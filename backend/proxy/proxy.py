# For proxy of navidrome to create a somewhat like tunnel

# iissue : /event endpoint is a sse 
# fix : create a sepeate sse for /event



from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
import httpx
import os
import asyncio
from search import searchTable
import json

NAVIDROME_URL = os.getenv("BASE_URL")

app = FastAPI()

client = httpx.AsyncClient(timeout=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_all(request: Request, path: str):
    url = f"{NAVIDROME_URL}/{path}"
    headers = dict(request.headers)
    headers.pop("host", None)
    params = dict(request.query_params)
    searchResponse , searchEndpoint  = await handle_search_logic(path, params , request)

        
    if searchEndpoint and searchResponse:
        count = len(searchResponse)
        if searchEndpoint == "rest/search3":
            payload = {
                "subsonic-response": {
                    "status": "ok",
                    "version": "1.16.1",
                    "searchResult3": {
                        "song": searchResponse
                    }
                }
            }
        else :
            payload = searchResponse
        return Response(
            content=json.dumps(payload),
            status_code=200,
            headers={
                "X-Total-Count": str(count),
                "Access-Control-Expose-Headers": "X-Total-Count", 
            "Content-Type": "application/json"
            }
        )




    headers = dict(request.headers)
    headers.pop("host", None)

    if "api/events" in path:
        req = client.build_request(
            request.method,
            url,
            headers=headers,
            params=request.query_params,
        )
        
        resp = await client.send(req, stream=True)

        async def event_stream():
            try:
                async for chunk in resp.aiter_bytes():
                    if chunk:
                        yield chunk
            except (httpx.ReadError, asyncio.CancelledError):
                print("SSE stream disconnected")
            finally:
                await resp.aclose()

        return StreamingResponse(
            event_stream(),
            status_code=resp.status_code,
            headers={
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no", 
            },
        )
    body = await request.body()
    resp = await client.request(
        request.method,
        url,
        headers=headers,
        params=request.query_params,
        content=body,
    )

    excluded = {"content-length", "transfer-encoding", "content-encoding"}
    resp_headers = {
        k: v for k, v in resp.headers.items()
        if k.lower() not in excluded
    }

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=resp_headers,
    )

@app.on_event("shutdown")
async def shutdown_event():
    await client.aclose()
    
async def handle_search_logic(path: str, params: dict , request):
    category_map = {
        "rest/search3": "query", 
        "api/song": "title",
        "api/album": "name",   
        "api/artist": "name"
    }
    start = int(params.get("_start" , 0 ))
    end = int(params.get("_end" , 15))
    for target_path, param_key in category_map.items():
        if target_path in path:
            search_term = params.get(param_key)
            print("searched using ", target_path , "for " , search_term)
            
            if search_term:
                if target_path == "rest/search3":
                    results =  await searchTable(request , search_term , end , start) 
                elif target_path == "api/song":
                    results =  await searchTable(request, search_term , end , start , "song")
                elif target_path == "api/album":
                    results =  await searchTable(request, search_term , end , start , "album") 
                elif target_path == "api/artist":
                    results =  await searchTable(request, search_term , end , start , "artist") 
                
                 
                
                return results, target_path
            
            return None, None
    return None, None