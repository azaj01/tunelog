const BASE_URL = import.meta.env.VITE_API_URL;

// types

export interface Stats {
  total_songs: number;
  total_listens: number;
  signals: {
    positive: number;
    skip: number;
    partial: number;
    repeat: number;
  };
  most_played_artists: Record<string, number>;
  most_played_songs: {
    title: string;
    artist: string;
    play_count: number;
  }[];
}

export interface SyncStatus {
  is_syncing: boolean;
  progress: number;
  start_sync: boolean;
  auto_sync: number;
  use_itunes: boolean;
  total_songs: number;
  explicit_songs: number;
  last_sync: string | null;
  songs_needing_itunes: number;
  explicit_counts: {
    explicit: number;
    notExplicit: number;
    cleaned: number;
    notInItunes: number;
    pending: number;
  };
}

export interface SyncStartResponse {
  status: "started" | "already_syncing";
}

export interface SyncSettingResponse {
  status: "ok";
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: "success" | "failed";
  JWT?: string;
  reason?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  isAdmin: boolean;
  admin: string;
  adminPD: string;
  email: string;
  name: string;
}

export interface CreateUserResponse {
  status: "success" | "failed";
  reason?: string;
  username?: string;
}

export interface AdminAuthRequest {
  admin: string;
  adminPD: string;
}

export interface User {
  username: string;
  password: string;
  isAdmin: boolean;
}

export interface GetUsersResponse {
  status: "ok" | "failed";
  users?: User[];
  reason?: string;
}

export interface PlaylistSong {
  song_id: string;
  title: string;
  artist: string;
  genre: string;
  signal: string;
  explicit: string;
}

export interface PlaylistStats {
  last_generated: string;
  total_songs: number;
  top_genre: string;
}

export interface PlaylistSongsResponse {
  status: string;
  stats: PlaylistStats;
  songs: PlaylistSong[];
}

export interface PlaylistGenerateResponse {
  status: string;
  songs_added?: number;
  reason?: string;
}

export interface SyncStopResponse {
  status: string;
  response: string;
}

// API Calls

export async function fetchPing(): Promise<{ status: string }> {
  const res = await fetch(`${BASE_URL}/api/ping`);
  if (!res.ok) throw new Error("Ping failed");
  return res.json();
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE_URL}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const res = await fetch(`${BASE_URL}/api/sync/status`);
  if (!res.ok) throw new Error("Failed to fetch sync status");
  return res.json();
}

export async function fetchSyncStart(
  use_itunes: boolean,
): Promise<SyncStartResponse> {
  const res = await fetch(
    `${BASE_URL}/api/sync/start?use_itunes=${use_itunes}`,
  );
  if (!res.ok) throw new Error("Failed to start sync");
  return res.json();
}

export async function fetchSyncSettings(
  auto_sync_hour: number,
  use_itunes: boolean,
): Promise<SyncSettingResponse> {
  const res = await fetch(
    `${BASE_URL}/api/sync/setting?auto_sync_hour=${auto_sync_hour}&use_itunes=${use_itunes}`,
  );
  if (!res.ok) throw new Error("Failed to save sync settings");
  return res.json();
}

export async function fetchLogin(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function fetchCreateUser(
  data: CreateUserRequest,
): Promise<CreateUserResponse> {
  const res = await fetch(`${BASE_URL}/admin/create-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}
const USERS_CACHE_KEY = "tunelog_users_cache";

export async function fetchGetUsers(
  data: AdminAuthRequest,
): Promise<GetUsersResponse> {
  // return cached users immediately while fetching
  const cached = localStorage.getItem(USERS_CACHE_KEY);
  console.log("In fetchgetuser cached : ", cached);
  const cachedUsers: User[] = cached ? JSON.parse(cached) : [];

  const fetchPromise = fetch(`${BASE_URL}/admin/get-users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Failed to get users");
      return res.json() as Promise<GetUsersResponse>;
    })
    .then((fresh) => {
      if (fresh.status === "ok" && fresh.users) {
        // update cache if response differs
        const freshStr = JSON.stringify(fresh.users);
        if (freshStr !== JSON.stringify(cachedUsers)) {
          localStorage.setItem(USERS_CACHE_KEY, freshStr);
        }
      }
      return fresh;
    });

  // if cache exists, return it immediately and let fetch update in background
  if (cachedUsers.length > 0) {
    return { status: "ok", users: cachedUsers };
  }

  // no cache — wait for the real response
  return fetchPromise;
}

export async function fetchPlaylistSongs(
  username: string,
): Promise<PlaylistSongsResponse> {
  const res = await fetch(
    `${BASE_URL}/api/playlist/songs?username=${username}`,
  );
  if (!res.ok) throw new Error("Failed to fetch playlist songs");
  return res.json();
}

export async function fetchPlaylistGenerate(
  username: string,
  explicit_filter: string = "allow_cleaned",
  size: number = 50,
): Promise<PlaylistGenerateResponse> {
  const res = await fetch(
    `${BASE_URL}/api/playlist/generate?username=${username}&explicit_filter=${explicit_filter}&size=${size}`,
  );
  if (!res.ok) throw new Error("Failed to generate playlist");
  return res.json();
}

export async function fetchSyncStop(): Promise<SyncStopResponse> {
  const res = await fetch(`${BASE_URL}/api/sync/stop`);
  if (!res.ok) throw new Error("Failed to stop sync");
  return res.json();
}