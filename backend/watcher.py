## watches SSE for event triggers

import requests
from config import Navidrome_url, login, event_queue
from rich.console import Console
from state import status_registry
import time

console = Console()


def start_sse():
    while True:
        response = None
        try:
            with console.status("[bold green]Connecting to Navidrome SSE..."):
                creds = login()
                url = f"{Navidrome_url}/api/events?jwt={creds['jwt']}"

                response = requests.get(url, stream=True, timeout=(10, None))

                if response.status_code != 200:
                    raise Exception(f"Server returned {response.status_code}")

                console.print("[bold green]Connected to Navidrome SSE")
                status_registry.update("SSE", status="connected")

            event_type = None
            for line in response.iter_lines(decode_unicode=True):
                if not line or line.startswith(":"):
                    continue

                if line.startswith("event:"):
                    event_type = line.split(":", 1)[1].strip()

                elif line.startswith("data:"):
                    status_registry.update("SSE", status="running")
                    if event_type == "nowPlayingCount":
                        event_queue.put("nowPlaying")

        except (
            requests.exceptions.ReadTimeout,
            requests.exceptions.ConnectionError,
        ) as e:
            console.print(
                f"[bold yellow]SSE Connection lost (Timeout/Network). Retrying in 5s...[/bold yellow]"
            )
            status_registry.update("SSE", status="retrying", error=str(e))
            time.sleep(5)
            continue

        except Exception as e:
            console.print(f"[bold red]SSE Critical Failure:[/bold red] {e}")
            status_registry.update("SSE", status="crashed", error=str(e))
            time.sleep(10)
            continue
