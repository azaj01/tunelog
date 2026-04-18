import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useGlobalSocket } from "../../context/SocketContext";


const NAVIDROME_URL = import.meta.env.VITE_NAVIDROME_URL || "http://localhost:4533";

// const NAVIDROME_URL = "" ;
const NAVIDROME_VERSION = "1.16.1";
const NAVIDROME_CLIENT = "tunelog";

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  coverArt?: string;
}

interface Playlist {
  id: string;
  name: string;
  songCount: number;
  description: string;
}

const PLAYLISTS: Playlist[] = [
  {
    id: "p1",
    name: "Morning Vibes",
    songCount: 24,
    description: "Chill tracks to start the day",
  },
  {
    id: "p2",
    name: "Workout Bangers",
    songCount: 38,
    description: "High energy for the gym",
  },
  {
    id: "p3",
    name: "Late Night Drive",
    songCount: 17,
    description: "Dark, moody, cinematic",
  },
  {
    id: "p4",
    name: "Focus Mode",
    songCount: 31,
    description: "Instrumental and ambient",
  },
];

function formatTime(s: number) {
  if (!s) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function buildSearchParams(query: string) {
  const username = localStorage.getItem("tunelog_user") || "";
  const password = localStorage.getItem("tunelog_password") || "";

  const params = new URLSearchParams({
    u: username,
    p: password,
    v: NAVIDROME_VERSION,
    c: NAVIDROME_CLIENT,
    f: "json",
    query,
    artistCount: "5",
    albumCount: "5",
    songCount: "10",
  });

  return params.toString();
}

function buildCoverArtUrl(coverArtId?: string) {
  if (!coverArtId) return null;

  const username = localStorage.getItem("tunelog_user") || "";
  const password = localStorage.getItem("tunelog_password") || "";

  const params = new URLSearchParams({
    u: username,
    p: password,
    v: NAVIDROME_VERSION,
    c: NAVIDROME_CLIENT,
    f: "json",
  });

  return `${NAVIDROME_URL}/rest/getCoverArt?id=${encodeURIComponent(coverArtId)}&${params.toString()}`;
}

function normalizeQueuePayload(payload: any): Track[] {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload.map((item: any) => ({
      id: String(item.id ?? item.song_id ?? crypto.randomUUID()),
      title: item.title ?? "Unknown Track",
      artist: item.artist ?? item.user ?? "Unknown Artist",
      album: item.album,
      duration: Number(item.duration ?? 0),
      coverArt: item.coverArt,
    }));
  }

  if (typeof payload === "object") {
    return Object.entries(payload).map(([id, item]: any) => ({
      id: String(item?.id ?? id),
      title: item?.title ?? "Unknown Track",
      artist: item?.artist ?? item?.user ?? "Unknown Artist",
      album: item?.album,
      duration: Number(item?.duration ?? 0),
      coverArt: item?.coverArt,
    }));
  }

  return [];
}

function TrackRow({
  track,
  index,
  active = false,
  onAdd,
  addLabel = "+ Add",
}: {
  track: Track;
  index?: number;
  active?: boolean;
  onAdd?: (t: Track) => void;
  addLabel?: string;
}) {
  const coverUrl = buildCoverArtUrl(track.coverArt);  // issue if used buildcoverurl(track.coverArt) it does not render image in queue, fix, send cover art id from backend

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active
          ? "bg-brand-500/10"
          : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
      }`}
    >
      {index !== undefined && (
        <span
          className={`w-5 flex-shrink-0 text-center text-xs tabular-nums ${
            active ? "font-semibold text-brand-500" : "text-gray-400"
          }`}
        >
          {active ? "▶" : index + 1}
        </span>
      )}

      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={track.album ?? track.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-400">🎵</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            active ? "text-brand-500" : "text-gray-800 dark:text-white/90"
          }`}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {track.artist}
          {track.album ? ` · ${track.album}` : ""}
        </p>
      </div>

      <span className="flex-shrink-0 text-xs tabular-nums text-gray-400">
        {formatTime(track.duration)}
      </span>

      {onAdd && (
        <button
          onClick={() => onAdd(track)}
          className="ml-1 flex-shrink-0 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400"
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

const CARD_HEIGHT = "h-[520px]";

export default function Queue() {
  const { socket } = useGlobalSocket();

  const [librarySearch, setLibrarySearch] = useState("");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [activeQueueId] = useState<string | null>(null);

  useEffect(() => {
    const onQueueUpdate = (payload: any) => {
      setQueue(normalizeQueuePayload(payload));
    };

    socket.on("queue_update", onQueueUpdate);
    socket.emit("get_queue");

    return () => {
      socket.off("queue_update", onQueueUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!librarySearch.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);

      try {
        const params = buildSearchParams(librarySearch.trim());
        const res = await fetch(`${NAVIDROME_URL}/rest/search3?${params}`);

        const data = await res.json();
        const songs = data?.["subsonic-response"]?.searchResult3?.song || [];
        const songList = Array.isArray(songs) ? songs : songs ? [songs] : [];

        const mappedTracks: Track[] = songList.map((s: any) => ({
          id: String(s.id),
          title: s.title ?? "Unknown Track",
          artist: s.artist ?? "Unknown Artist",
          album: s.album,
          duration: Number(s.duration ?? 0),
          coverArt: s.coverArt,
        }));

        setSearchResults(mappedTracks);
      } catch (error) {
        console.error("Failed to fetch search results from Navidrome:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [librarySearch]);

  return (
    <div>
      <PageMeta
        title="Queue | TuneLog"
        description="Manage your playback queue"
      />
      <PageBreadcrumb pageTitle="Queue" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-4">
          <div
            className={`flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${CARD_HEIGHT}`}
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div>
                <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                  Queue
                </h4>
                <p className="text-xs text-gray-400">{queue.length} tracks</p>
              </div>
              <button
                onClick={() => socket.emit("clear_queue")}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 transition-colors hover:border-red-400 hover:text-red-400 dark:border-gray-700 dark:text-gray-400"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {queue.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-gray-400">Queue is empty</p>
                </div>
              ) : (
                queue.map((track, i) => (
                  <TrackRow
                    key={track.id || i}
                    track={track}
                    index={i}
                    active={track.id === activeQueueId}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:col-span-8">
          <div
            className={`flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${CARD_HEIGHT}`}
          >
            <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h4 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
                Library Search
              </h4>
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search Navidrome tracks..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {isSearching ? (
                <div className="flex h-full items-center justify-center">
                  <p className="animate-pulse text-sm text-gray-400">
                    Searching...
                  </p>
                </div>
              ) : librarySearch.trim() === "" ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-gray-400">
                    Type to search your library
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-gray-400">No results found</p>
                </div>
              ) : (
                searchResults.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    onAdd={(t) =>
                      socket.emit("add_queue", {
                        song_id: t.id,
                        title: t.title,
                        artist: t.artist,
                        coverArt: t.coverArt,
                        duration: t.duration,
                      })
                    }
                    addLabel="+ Queue"
                  />
                ))
              )}
            </div>
          </div>

          <div
            className={`flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${CARD_HEIGHT}`}
          >
            <div className="flex-shrink-0 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Playlists
              </h4>
              <p className="text-xs text-gray-400">
                {PLAYLISTS.length} playlists
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {PLAYLISTS.map((pl) => (
                <div
                  key={pl.id}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                    <span className="text-base">🎵</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {pl.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {pl.description}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <span className="text-xs tabular-nums text-gray-400">
                      {pl.songCount} songs
                    </span>
                    <button className="rounded-lg border border-gray-200 px-2 py-0.5 text-xs text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400">
                      Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
