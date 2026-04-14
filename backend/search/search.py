# search engine for the navidrome proxy 


from db import get_db_connection_lib, get_db_connection
import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()




NAVIDROME_URL = os.getenv("BASE_URL" , "http://localhost:4533")

def fetchAllFromListes():
    conn = get_db_connection()
    cursor = conn.cursor()
    songs = cursor.execute("select song_id, count(*) as listen from listens group by song_id order by listen desc").fetchall()
    song_counts = {row[0]: row[1] for row in songs}
    conn.close()
    return song_counts


async def fetchAll(request, song_ids, is_subsonic=False , type = "global"):
    async with httpx.AsyncClient() as client:
        tasks = []
        for sid in song_ids:
            if is_subsonic:
                url = f"{NAVIDROME_URL}/rest/getSong"
                
                req_params = dict(request.query_params)
                req_params["id"] = sid 
                
                tasks.append(client.get(url, params=req_params))
            else:
                url = f"{NAVIDROME_URL}/api/song/{sid}"
                tasks.append(client.get(url, headers=request.headers))
        responses = await asyncio.gather(*tasks)
        results = []
        for res in responses:
            if res.status_code == 200:
                data = res.json()
                if is_subsonic:
                    target_song_dict = data.get("subsonic-response", {}).get("song")
                else:
                    target_song_dict = data
                    
                if target_song_dict:
                    # old_comment = target_song_dict.get("comment", "").strip()
                    
                    if type == "global":
                        target_song_dict["comment"] = f"BY TUNELOG PROXY - GLOBAL SEARCH RESULTS"
                    elif type == "song":
                        target_song_dict["comment"] = f"BY TUNELOG PROXY - Song TITLE and LYRICS RESULTS"
                    
                    else:
                        target_song_dict["comment"] = f"BY TUNELOG PROXY - {type} RESULTS"
                        
                    results.append(target_song_dict)
        return results

async def searchTable(request , query, end= 15, start = 0 , type :str = "global" ):
    history = fetchAllFromListes()
    
    conn = get_db_connection_lib()
    cursor = conn.cursor()
    safe_query = f'"{query.replace('"', '""')}"'
    if type == "global":
        results = cursor.execute(
            "SELECT song_id , rank FROM song_search_index WHERE song_search_index MATCH ?", 
            (safe_query,)
        ).fetchall()
    
    elif type == "song":
        results = cursor.execute(
            "SELECT song_id, rank FROM song_search_index WHERE song_search_index MATCH ?", 
            (f' {{lyrics title}} : {safe_query}',)
        ).fetchall()
    
    else :
        results = cursor.execute(
            "SELECT song_id, rank FROM song_search_index WHERE song_search_index MATCH ?", 
            (f'{type} : {safe_query}',)
        ).fetchall()
    
    processed_songs = []
    LISTEN_WEIGHT = 2.0 

    for result in results:
        song_id, rank = result
        listens = history.get(song_id, 0)
        blended_score = rank - (listens * LISTEN_WEIGHT)
        
        processed_songs.append({
            "id": song_id,
            "rank": rank,
            "score": blended_score 
        })
        
    processed_songs.sort(key=lambda x: x["score"])
    conn.close()
    paginated_songs =[song["id"] for song in processed_songs[start:end]]
    if not paginated_songs:
        return []
    urls = []
    if type == "global":
        enriched_songs = await fetchAll(request, paginated_songs, is_subsonic=True , type=type)
        print(enriched_songs)
        return enriched_songs
    else :
        print("else")
        enriched_songs = await fetchAll(request , paginated_songs , is_subsonic=False , type=type)
        print(enriched_songs)
        return enriched_songs