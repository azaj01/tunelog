# search engine for the navidrome proxy 


from db import get_db_connection_lib, get_db_connection
# from collections import defaultdict









def fetchAllFromListes():
    conn = get_db_connection()
    cursor = conn.cursor()
    songs = cursor.execute("select song_id, count(*) as listen from listens group by song_id order by listen desc").fetchall()
    song_counts = {row[0]: row[1] for row in songs}
    conn.close()
    return song_counts

def searchTable(query):
    history = fetchAllFromListes()
    
    conn = get_db_connection_lib()
    cursor = conn.cursor()
    safe_query = f'"{query.replace('"', '""')}"'
    results = cursor.execute(
        "SELECT song_id, title, artist, lyrics, rank FROM song_search_index WHERE song_search_index MATCH ?", 
        (safe_query,)
    ).fetchall()
    
    processed_songs = []

    for result in results:
        song_id, title, artist, lyrics, rank = result
        
        listens = history.get(song_id, 0)
        in_history = listens > 0
        processed_songs.append({
    "id": song_id,
    "title": title,
    "artist": artist,
    "album": "by proxy",
    "artistId": "by proxy",
    "albumId": "by proxy",
    "duration": 180,
    "isDir": False,
    "in_history": in_history,  
    "listens": listens,
    "rank" : rank  
  })
        
    
    processed_songs.sort(key=lambda x: (not x["in_history"], -x["listens"], x["rank"]))

    conn.close()
    return processed_songs    
    
# search("phir se")