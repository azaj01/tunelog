# This to give frontend api data


# imports

from fastapi import FastAPI

from db import get_db_connection_lib , get_db_connection


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ping

@app.get("/api/ping")
def ping():
    return {"status" : "OK"}


# send statics

@app.get("/api/stats")
def stats():

    # connection to db
    conn_lib = get_db_connection_lib()
    conn_log = get_db_connection()    #tunelog.db

    # no of songs in library

    countSongsLib = conn_lib.execute(
        "SELECT COUNT(*) FROM library"
    ).fetchone()[0]

    countPlayedSongs = conn_log.execute(
        "SELECT COUNT(*) FROM listens"
        ).fetchone()[0]

    signal_rows = conn_log.execute(
        "SELECT signal, COUNT(*) as count FROM listens GROUP BY signal"
    ).fetchall()

    signals = {row[0]: row[1] for row in signal_rows}

    mostPlayedArtists_row = conn_log.execute(
        "SELECT artist, COUNT(*) as count FROM listens GROUP BY artist ORDER BY count DESC LIMIT 10"
    ).fetchall()

    mostPlayedArtists = {row[0] : row[1] for row in mostPlayedArtists_row}

    mostPlayedSongs_row = conn_log.execute(
    """
    SELECT title, artist, COUNT(*) as play_count 
    FROM listens 
    GROUP BY title
    ORDER BY play_count DESC
    LIMIT 10
    """
    ).fetchall()

    mostPlayedSongs = [
    {
        "title": row[0],
        "artist": row[1],
        "play_count": row[2]
    } 
    for row in mostPlayedSongs_row
    ]    

    conn_lib.close()
    conn_log.close()

    return {
        "total_songs": countSongsLib,
        "total_listens": countPlayedSongs,
        "signals": signals,
        "most_played_artists": mostPlayedArtists,
        "most_played_songs": mostPlayedSongs,
    }
