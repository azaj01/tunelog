# tunelog

A lightweight, self-hosted music recommendation system that learns your taste from how you actually listen — no ratings, no manual input.

## How It Works

tunelog watches your Navidrome listening activity in the background. It tracks whether you skip, finish, or replay songs, and uses that behavior to build smart playlists automatically.

| Listening Behavior | Signal | Weight |
|---|---|---|
| Skipped before 30% | Negative | Excluded |
| Played 60–90% | Weak positive | 0.5 |
| Played to end | Positive | 1.0 |
| Replayed in same session | Strong positive | 2.0 |

Generated playlists include your top weighted songs, occasional one-time listens, and a random injection from your unplayed library — so you keep discovering new music.

## Stack

- **Navidrome** — self-hosted music server (Subsonic API)
- **Python** — watcher script + playlist generator
- **SQLite** — local listen history database
- **M3U** — playlist output format (works with Navidrome, Strawberry, VLC)

## Project Structure

```
tunelog/
├── watcher.py          # polls Navidrome now-playing, logs to SQLite
├── generator.py        # reads DB, scores songs, outputs M3U playlist
├── db.py               # SQLite schema and helpers
├── config.py           # Navidrome URL, credentials, thresholds
├── data/
│   └── tunelog.db      # listen history (auto-created)
└── playlists/          # generated M3U files go here
```

## Roadmap

- [x] Project structure
- [ ] Navidrome watcher (now-playing poller)
- [ ] SQLite listen logger
- [ ] Playlist generator with scoring
- [ ] M3U export
- [ ] Config file support
- [ ] Multi-user support (user_id per record)
- [ ] Time decay for old listens
- [ ] Genre-filtered random injection
- [ ] Web UI dashboard

## Requirements

- Python 3.10+
- Navidrome instance (local or remote)
- Docker (optional, recommended for Navidrome)

## Setup

```bash
git clone https://github.com/yourusername/tunelog.git
cd tunelog
pip install -r requirements.txt
cp config.example.py config.py
# edit config.py with your Navidrome URL and credentials
python watcher.py
```

## Why tunelog?

Most self-hosted music servers either have no recommendations or rely on external APIs like Last.fm. tunelog is fully offline, stores everything locally, and is built around implicit feedback — your behavior is the only input needed.

---

> Built for Navidrome. Inspired by how early Last.fm and Spotify worked before they had millions of users.
