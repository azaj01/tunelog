
import os
from dotenv import load_dotenv
import requests
import time

load_dotenv()

NAVIDROME_URL = os.getenv("BASE_URL", "http://localhost:4533")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "adii")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234")

songQueue = {}


def getStream(id):
    return (
        f"{NAVIDROME_URL}/rest/stream?id={id}"
        f"&u={ADMIN_USERNAME}&p={ADMIN_PASSWORD}&v=1.16.1&c=tunelog&f=json"
    )


def getSongDetails(id):
    url = (
        f"{NAVIDROME_URL}/rest/getSong?id={id}"
        f"&u={ADMIN_USERNAME}&p={ADMIN_PASSWORD}&v=1.16.1&c=tunelog&f=json"
    )
    request = requests.get(url, timeout=15)
    request.raise_for_status()
    json_data = request.json()
    return json_data["subsonic-response"]["song"]


def getAlbumCover(id):
    return (
        f"{NAVIDROME_URL}/rest/getCoverArt?id={id}"
        f"&u={ADMIN_USERNAME}&p={ADMIN_PASSWORD}&v=1.16.1&c=tunelog&f=json"
    )


def currentQueue():
    print("current queue")
    queue = []
    for song_id, item in songQueue.items():
        queue.append({
            "id": song_id,
            "title": item.get("title"),
            "artist": item.get("artist", "Unknown"),
            "album": item.get("album"),
            "duration": item.get("duration", 0),
            "coverArt": item.get("coverArt"),
            "user": item.get("user", "Unknown"),
            "streamUrl": item.get("streamUrl"),
        })
    return queue


def AddQueue(song_id, title=None, user="Unknown"):
    try:
        song = getSongDetails(song_id)
        cover_art_id = song.get("coverArt")
        title = song.get("title", title or "Unknown Track")
        artist = song.get("artist", "Unknown Artist")
        album = song.get("album", "")
        duration = int(song.get("duration", 0))
        stream_url = getStream(song_id)
        cover_url = getAlbumCover(cover_art_id) if cover_art_id else None
        # print("Adding cover art " , cover_url)
        songQueue[song_id] = {
            "title": title,
            "artist": artist,
            "album": album,
            "duration": duration,
            "coverArt": cover_art_id,
            "user": user,
            "streamUrl": stream_url,
        }
        print(f"Added: {title} (ID: {song_id})")
        # print(songQueue)
    except Exception as e:
        songQueue[song_id] = {
            "title": title or "Unknown Track",
            "artist": "Unknown Artist",
            "album": "",
            "duration": 0,
            "coverArt": None,
            "user": user,
            "streamUrl": getStream(song_id),
        }
        print(f"Added fallback queue item for {song_id}: {e}")


def DeleteQueue(song_id):
    removed_song = songQueue.pop(song_id, None)
    if removed_song:
        print(f"Deleted: {removed_song['title']}")
    else:
        print(f"Error: ID {song_id} not found in queue.")


def ClearQueue():
    songQueue.clear()
    print("Queue cleared")


def sendSongPayload(id="OrUep4q0YonfiRPZwFemqI"):
    song = getSongDetails(id)
    song_url = getStream(id)
    album_id = song.get("coverArt")

    payload = {
        "user": "Adii",
        "song": {
            "title": song.get("title", "Unknown Track"),
            "artist": song.get("artist", "Unknown Artist"),
            "album": song.get("album", ""),
            "duration": int(song.get("duration", 0)) * 1000,
        },
        "playback": {
            "positionMs": 0,
            "isPlaying": True,
        },
        "media": {
            "url": song_url,
            "albumArtUrl": getAlbumCover(album_id) if album_id else None,
        },
        "timestamp": int(time.time() * 1000),
    }

    return payload