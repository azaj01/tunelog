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
    
app_state = SyncState()