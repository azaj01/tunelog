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
├── main.py             # entry point, runs the watcher loop
├── watcher.py          # polls Navidrome now-playing, logs to SQLite
├── generator.py        # reads DB, scores songs, outputs M3U playlist
├── db.py               # SQLite schema and helpers
├── config.py           # builds Navidrome API URLs from .env
├── .env                # your credentials (never commit this)
├── .env.example        # template — copy this to .env
├── Data/
│   └── tunelog.db      # listen history (auto-created)
└── playlists/          # generated M3U files go here
```

## Requirements

- Python 3.10+
- Navidrome instance (local or remote)
- Docker (optional, recommended for Navidrome)

## Setup

**1. Clone the repo**

**2. Configure your environment**
```bash
cp .env.example .env
```

Edit `.env` with your Navidrome details:
```env
NAVIDROME_URL=http://localhost:4533
NAVIDROME_USER=your_username
NAVIDROME_PASS=your_password
POLL_INTERVAL=5
```

**4. Run the watcher**
```bash
python main.py
```

## Roadmap

- [x] Project structure
- [x] Navidrome API connection
- [x] SQLite listen logger
- [x] Multi-user support (user_id per record)
- [x] INSERT on new song, UPDATE on same song
- [x] 10 minute re-listen window
- [ ] Signal scoring (skip / partial / full / repeat)
- [ ] Playlist generator
- [ ] M3U export
- [ ] Time decay for old listens
- [ ] Genre-filtered random injection
- [ ] Web UI dashboard

## Why tunelog?

Most self-hosted music servers either have no recommendations or rely on external APIs like Last.fm. tunelog is fully offline, stores everything locally, and is built around implicit feedback — your behavior is the only input needed.

---

> Built for Navidrome. Inspired by how early Last.fm and Spotify worked before they had millions of users.
