import requests
import time
from config import build_url, itunesApi
from db import init_db_lib, get_db_connection_lib
from genre import autoGenre, sync_database_to_json

from rich.console import Console
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeElapsedColumn,
)
from rich.panel import Panel
from rich.live import Live

console = Console()

_auto_sync = 2
_toggle_itune = False
_startSyncSong = False
_isSyncing = False
_progress = 0
_stopSync = False
_fallbackStop = False
_timezone = "Asia/Kolkata"


def setSyncSettings(auto_sync=2, itunes=False, timezone="Asia/Kolkata"):
    global _auto_sync, _toggle_itune, _timezone
    _auto_sync = auto_sync
    _toggle_itune = itunes
    _timezone = timezone


def getSyncSettings():
    return {
        "auto_sync": _auto_sync,
        "use_itunes": _toggle_itune,
    }


def triggerSync(use_itunes=False):
    global _startSyncSong, _toggle_itune
    _toggle_itune = use_itunes
    _startSyncSong = True


def getSyncStatus():
    return {
        "is_syncing": _isSyncing,
        "progress": _progress,
        "start_sync": _startSyncSong,
    }


def _response_preview(response, limit=240):
    text = (response.text or "").strip().replace("\n", " ")
    return text[:limit] + ("..." if len(text) > limit else "")


def _get_json(url_value, retries=3):
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url_value, timeout=20)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            last_error = RuntimeError(f"Failed to call Navidrome API: {exc}")
        except requests.exceptions.JSONDecodeError as exc:
            content_type = response.headers.get("Content-Type", "unknown")
            preview = _response_preview(response)
            last_error = RuntimeError(
                "Navidrome API returned a non-JSON response while syncing library. "
                f"status={response.status_code}, content_type={content_type}, "
                f"url={response.url}, body_preview={preview!r}"
            )
        if attempt < retries:
            time.sleep(1.5 * attempt)
    raise last_error


def normalise_genre(raw):
    if not raw:
        return "default"
    parts = raw.split("/")
    result = []
    for g in parts:
        g = g.strip().lower()
        if g not in result:
            result.append(g)
    return ",".join(result)


def url(batch, offset):
    base_url = build_url("search3")
    song_url = base_url + f"&query=&songCount={batch}&songOffset={offset}"
    return song_url


def fetch_all_song():
    all_song = []
    offset = 0
    batch = 50

    with console.status(
        "[bold yellow]Fetching song list from Navidrome..."
    ):
        while True:
            data = _get_json(url(batch, offset))
            songs = data["subsonic-response"].get("searchResult3", {}).get("song", [])
            if not songs:
                break
            all_song.extend(songs)
            offset += batch

    return all_song


def remove_deleted_songs(navidrome_ids: set):
    conn = get_db_connection_lib()
    cursor = conn.cursor()
    db_ids = {
        row[0] for row in cursor.execute("SELECT song_id FROM library").fetchall()
    }
    deleted_ids = db_ids - navidrome_ids

    if not deleted_ids:
        conn.close()
        return

    console.log(
        f"[bold red]CLEANUP:[/bold red] Found {len(deleted_ids)} stale songs. Removing..."
    )
    for song_id in deleted_ids:
        cursor.execute("DELETE FROM library WHERE song_id = ?", (song_id,))

    conn.commit()
    conn.close()


def sync_library():
    global _isSyncing, _progress, _startSyncSong, _stopSync

    _isSyncing = True
    _startSyncSong = False
    _progress = 0

    songs = fetch_all_song()
    total = len(songs)

    conn = get_db_connection_lib()
    cursor = conn.cursor()

    inserted = 0
    updated = 0
    skipped = 0

    progress_bar = Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(bar_width=None),
        TaskProgressColumn(),
        TimeElapsedColumn(),
    )

    sync_task = progress_bar.add_task("[cyan]Syncing Library...", total=total)

    with Live(progress_bar, refresh_per_second=4):
        for i, song in enumerate(songs):
            if _stopSync:
                console.log("[bold red]Sync stopped by user.")
                break

            song_id = song["id"]
            song_title = song.get("title", "Unknown")
            song_artist = song.get("artist", "Unknown")

            existing = cursor.execute(
                "SELECT explicit, genre FROM library WHERE song_id = ?", (song_id,)
            ).fetchone()

            if existing:
                explicit_val = existing[0]

                if explicit_val and explicit_val != "":
                    skipped += 1
                elif _toggle_itune:
                    try:
                        raw_itunes = itunesApi(song_title, song_artist)
                        iTunes = raw_itunes or {}

                        if not iTunes:
                            cursor.execute(
                                """UPDATE library SET
                                    explicit = 'notInItunes',
                                    genre = COALESCE(NULLIF(genre, 'default'), 'default'),
                                    last_synced = CURRENT_TIMESTAMP
                                WHERE song_id = ?""",
                                (song_id,),
                            )
                        else:
                            new_explicit = iTunes.get("explicit", "notInItunes")
                            new_genre = normalise_genre(
                                iTunes.get("genre") or song.get("genre")
                            )
                            cursor.execute(
                                """UPDATE library SET
                                    explicit = ?,
                                    genre = ?,
                                    last_synced = CURRENT_TIMESTAMP
                                WHERE song_id = ?""",
                                (new_explicit, new_genre, song_id),
                            )
                        updated += 1
                    except Exception:
                        skipped += 1
                else:
                    skipped += 1
            else:
                if _toggle_itune:
                    try:
                        raw_itunes = itunesApi(song_title, song_artist)
                        iTunes = raw_itunes or {}

                        if not iTunes:
                            explicit = "notInItunes"
                            genre = normalise_genre(song.get("genre"))
                            artist = song.get("artist", "")
                            album = song.get("album", "")
                            duration = song.get("duration", 0)
                        else:
                            explicit = iTunes.get("explicit")
                            genre = normalise_genre(
                                iTunes.get("genre") or song.get("genre")
                            )
                            artist = iTunes.get("artist") or song.get("artist", "")
                            album = iTunes.get("album") or song.get("album", "")
                            duration = (
                                (iTunes.get("duration") // 1000)
                                if iTunes.get("duration")
                                else song.get("duration", 0)
                            )
                    except Exception:
                        explicit = None
                        genre = normalise_genre(song.get("genre"))
                        artist = song.get("artist", "")
                        album = song.get("album", "")
                        duration = song.get("duration", 0)
                else:
                    explicit = None
                    genre = normalise_genre(song.get("genre"))
                    artist = song.get("artist", "")
                    album = song.get("album", "")
                    duration = song.get("duration", 0)

                cursor.execute(
                    """
                    INSERT INTO library (song_id, title, artist, album, genre, duration, explicit)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (song_id, song_title, artist, album, genre, duration, explicit),
                )
                inserted += 1

            _progress = round((i + 1) / total * 100, 2)
            progress_bar.update(
                sync_task,
                advance=1,
                description=f"[cyan]Syncing: [white]{song_title[:20]}...",
            )

            if (i + 1) % 10 == 0:
                conn.commit()

    conn.commit()
    conn.close()

    with console.status(
        "[bold cyan]Performing cleanup and genre sync...", spinner="bouncingBar"
    ):
        navidrome_ids = {song["id"] for song in songs}
        remove_deleted_songs(navidrome_ids)
        autoGenre()
        sync_database_to_json()

    _isSyncing = False

    summary = (
        f"[bold green]Sync Complete![/bold green]\n\n"
        f"Total Processed: {total}\n"
        f"Inserted: [green]{inserted}[/green]\n"
        f"Updated: [yellow]{updated}[/yellow]\n"
        f"Skipped: [blue]{skipped}[/blue]"
    )
    console.print(Panel(summary, border_style="bright_blue", expand=False))


if __name__ == "__main__":
    init_db_lib()
    sync_library()
