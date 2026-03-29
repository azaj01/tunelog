## watches SSE for event triggers

import requests
from config import Navidrome_url , login , event_queue
# from config import


def start_sse():
    creds = login()
    url = f"{Navidrome_url}/api/events?jwt={creds["jwt"]}"
    response = requests.get(url , stream=True , timeout=45)

    # print(response.status_code)
    # print("In watcher with response : ")
    # print(response.headers)

    event_type = None
    for line in response.iter_lines(decode_unicode=True):
        # print(line)
        if not line or line.startswith(":"):
            continue
        if line.startswith("event:"):
            event_type = line.split(":", 1)[1].strip()
            # print("event type ", event_type)
        elif line.startswith("data:"):
            data = line.split(":", 1)[1].strip()
            if event_type == "nowPlayingCount":
                event_queue.put("nowPlaying")
                # print("PUT IN QUQUE")
            # print(f"EVENT: {event_type} → {data}")


# {
#     "Desi": ["indian pop", "regional indian", "folk", "indian folk"],
#     "Punjabi": ["punjabi pop", "punjabi", "punjabi r&b"],
#     "Default": [
#         "default",
#         "soundtrack",
#         "singer,songwriter",
#         "boom bap",
#         "classique",
#         "darksynth",
#     ],
#     "Bollywood": ["bollywood"],
#     "Bhojpuri": ["Bhojpuri"],
#     "Bhangra": ["bhangra"],
#     "worldwide": ["worldwide"],
#     "rap": ["Old School Rap", "rap"],
#     "hip hop": ["hip-hop,rap", "hip-hop", "Hip-Hop/Rap"],
#     "filmi": ["filmi"],
#     "pop": ["pop", "indie pop"],
#     "rnb": ["rnb,soul"],
#     "rock": ["rock", "hard rock"],
#     "islamic": ["islamic", "musique indienne"],
#     "new age": ["New Age"],
#     "metal": ["metal"],
#     "dance": ["dance"],
#     "Bengali": ["bangla", "bengali", "bangla rock"],
#     "country": ["country"],
#     "vocal": ["Vocal"],
#     "house": ["house"],
#     "Blues": ["blues"],
#     "children Music": ["Children's Music"],
#     "sufi": ["sufi", "farsi"],
#     "asia": ["asia"],
#     "alternative": ["alternative", "alternative pop"],
#     "techno": ["techno"],
#     "motivational": ["devotional & spiritual", "inspirational"],
#     "tollywood": ["tollywood", "tamil"],
#     "electronic": ["electronica", "electronic"],
#     "classical": ["classical"],
# }
