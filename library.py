# to fetch and create library database from navidrome
# uses SEARCH3 api endpoint to build library database
# works by runing a loop thourgh the api

# TODO : ADD CHECKS FOR IF SONG ALDREADY EXISTS WITH DIFFRENT METADATA
# artist name : arijit singh ,
# artist name : arjeet singh may be recorded diffrently


# ISSUES AND FIXES
# Issue : Genre with slight diffrent name gets diffrent values, bollywood music and bollywood
# fix : used genre aliases to make bollywood and bollywood music same

import requests
import time
from config import build_url
from config import build_url , _extract , itunesApi
from db import init_db_lib, get_db_connection_lib
from time import sleep

toggle_itune = False


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

GENRE_ALIASES = {
    "bollywood music": "bollywood",
    "hindi": "bollywood",
    "hindi ost": "bollywood",
    "indian": "bollywood",
    "bandes originales de films": "soundtrack",
    "filme": "soundtrack",
    "films": "soundtrack",
    "ost": "soundtrack",
    "hip hop": "rap",
    "поп": "pop",
    "hits": "pop",
    "compilation": "pop",
    "musiques du monde": "world",
    "r&b": "rnb",
    "quran recitation": "quran",
    "bengali movie music": "bengali",
    "фильмы": "soundtrack",
    "indian music":"bollywood",
    "asian music" : "default"
}


def normalise_genre(raw):
    if not raw:
        return "default"
    parts = raw.split("/")
    result = []
    for g in parts:
        # print(g)

        g = g.strip().lower()
        
        # print(g)
        g = GENRE_ALIASES.get(g, g)  # if not in aliases, keep as-is
        
        # print(g)
        if g not in result:
            result.append(g)
    return ",".join(result)


def url(batch, offset):
    url = build_url("search3")
    song_url = url + f"&query=&songCount={batch}&songOffset={offset}"
    # print(song_url)
    return song_url


def fetch_all_song():
    all_song = []
    offset = 0
    batch = 100

    while True:
        data = _get_json(url(batch, offset))

        songs = data["subsonic-response"].get("searchResult3", {}).get("song", [])

        if not songs:
            break

        all_song.extend(songs)
        offset += batch
        print(f"[SYNC] fetched {len(all_song)} songs so far...")

    return all_song


def sync_library():
    songs = fetch_all_song()

    conn = get_db_connection_lib()
    cursor = conn.cursor()
    progress = 0
    for song in songs:
        print("toggle Itunes : " , toggle_itune)
        if toggle_itune:
            print("[ITUNES]")

            iTunes = itunesApi(song["title"], song["artist"]) or {}
            print(iTunes)
            sleep(0.5)

        else:
            iTunes = {}
        cursor.execute(
            """
            INSERT INTO library (song_id, title, artist, album, genre, duration , explicit)
            VALUES (?, ?, ?, ?, ?, ? , ? )
            ON CONFLICT(song_id) DO UPDATE SET
                title       = excluded.title,
                artist      = excluded.artist,
                album       = excluded.album,
                genre       = excluded.genre,
                duration    = excluded.duration,
                last_synced = CURRENT_TIMESTAMP,
                explicit    = excluded.explicit
        """,
            (
                song["id"],
                song["title"],
                iTunes.get("artist") or song.get("artist", ""),
                iTunes.get("album") or song.get("album", ""),
                normalise_genre(iTunes.get("genre") or song.get("genre")),
                (
                    (iTunes.get("duration") // 1000)
                    if iTunes.get("duration")
                    else song.get("duration", 0)
                ),
                iTunes.get("explicit", "notExplicit"),
            ),
        )
        progress += 1
        print("Progress : " , progress/len(songs) * 100 , "%")
        print("Remaing : ", len(songs) - progress)

    conn.commit()
    conn.close()

    print(f"[SYNC] done — {len(songs)} songs synced to library")


if __name__ == "__main__":
    init_db_lib()
    sync_library()
