import time
import threading


class GlobalStatus:
    def __init__(self):
        self._data = {
            "main": {"heartbeat": time.time(), "error": "", "status": "init"},
            "SSE": {"heartbeat": time.time(), "error": "", "status": "init"},
            "sync": {"heartbeat": time.time(), "error": "", "status": "idle"},
            "genre": {"heartbeat": time.time(), "error": "", "status": "idle"},
            "star": {"heartbeat": time.time(), "error": "", "status": "idle"},
            "Db": {"heartbeat": time.time(), "error": "", "status": "idle"},
            "uvicorn": {"heartbeat": time.time(), "error": "", "status": "idle"},
            "watcher": {"heartbeat": time.time(), "error": "", "status": "idle"},
            "import": {"heartbeat": time.time(), "error": "", "status": "idle"},
        }
        self.lock = threading.Lock()

    def update(self, thread_name, status=None, error=""):
        with self.lock:
            if thread_name in self._data:
                self._data[thread_name]["heartbeat"] = time.time()
                if status:
                    self._data[thread_name]["status"] = status
                if error:
                    self._data[thread_name]["error"] = error

    def get_all(self):
        with self.lock:
            return self._data.copy()


status_registry = GlobalStatus()


class SyncState:
    sync_running = False
    sync_stop = False

    fallback_running = False
    fallback_processed = 0
    fallback_total = 0
    fallback_stop = False


# Notification apis to implement
# 1. Who started playling what
# 2. Last sycned
# 3. last playlist generated for who
# 4. last song that got started
# start, stopped same -- song state
# notification_status.starredSong.append({"username" : user_id , "song" : song['title'] , "star" : f"needs more listen, currently {totalListens}"})
# notification_status.starredSong.append({"username" : user_id , "song" : song['title'] , "star" : final_rating})
# notification_status.playlist.append({"username" : user_id, "size" : len(data) , "type" : "append"})
# notification_status.playlist.append({"username" : user_id, "size" : len(data) , "type" : "regenerate"})
# class notificationStatus:
#     songState = []
#     playlist = []
#     starredSong = []

import asyncio
import json

_subscribers: list[tuple[asyncio.Queue, asyncio.AbstractEventLoop]] = []

def broadcast(field: str, data: list):
    payload = json.dumps({field: data})
    for q, loop in _subscribers:
        loop.call_soon_threadsafe(q.put_nowait, payload)

class _ReactiveList(list):
    def __init__(self, field_name: str):
        super().__init__()
        self._field = field_name

    def append(self, item):
        super().append(item)
        broadcast(self._field, list(self))
class NotificationStatus:
    print("function called")
    def __init__(self):
        self.songState   = _ReactiveList("songState")
        self.playlist    = _ReactiveList("playlist")
        self.starredSong = _ReactiveList("starredSong")

notification_status = NotificationStatus()

app_state = SyncState()
