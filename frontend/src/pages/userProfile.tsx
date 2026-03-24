import { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { fetchUserProfile, UserProfileResponse } from "../API/API";

const formatDate = (raw: string | undefined) => {
  if (!raw || raw === "never") return "No activity";
  const date = new Date(raw.replace(" ", "T"));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SIGNAL_STYLE: Record<
  string,
  { color: string; bg: string; border: string; label: string; bar: string }
> = {
  skip: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Skip",
    bar: "bg-red-400",
  },
  partial: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    label: "Partial",
    bar: "bg-yellow-400",
  },
  positive: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    label: "Complete",
    bar: "bg-green-400",
  },
  repeat: {
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    label: "Repeat",
    bar: "bg-purple-400",
  },
};

const GENRE_COLORS = [
  "bg-blue-400",
  "bg-purple-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-pink-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-indigo-400",
  "bg-rose-400",
  "bg-teal-400",
];

const SignalPill = ({ signal }: { signal: string }) => {
  const s = SIGNAL_STYLE[signal] ?? SIGNAL_STYLE["partial"];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${s.bg} ${s.border} ${s.color}`}
    >
      {s.label}
    </span>
  );
};

const BarRow = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-gray-600 dark:text-gray-400 truncate flex-shrink-0">
        {label}
      </span>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-xs text-gray-400 text-right flex-shrink-0">
        {value}
      </span>
    </div>
  );
};

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const password = (location.state as { password?: string })?.password ?? "";

  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetchUserProfile(username, password)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
      console.log("Fetched user profile")
  }, [username, password]);

  const avatarColor = () => {
    const colors = [
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-teal-600",
      "from-orange-500 to-red-600",
      "from-cyan-500 to-blue-600",
    ];
    return colors[(username?.charCodeAt(0) ?? 0) % colors.length];
  };

  const initials = (username ?? "??").slice(0, 2).toUpperCase();
  const totalSignals =
    (data?.skips ?? 0) +
    (data?.partial ?? 0) +
    (data?.complete ?? 0) +
    (data?.repeat ?? 0);
  const signalPct = (val: number) =>
    totalSignals > 0 ? Math.round((val / totalSignals) * 100) : 0;
  const maxArtist = Math.max(...(data?.topArtists?.map((a) => a.count) ?? [1]));
  const maxGenre = Math.max(...(data?.topGenres?.map((g) => g.count) ?? [1]));

  if (loading) {
    return (
      <>
        {/* <PageMeta title="Loading... | TuneLog" description="" />
        <PageBreadcrumb pageTitle="User Profile" /> */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
          <div className="col-span-12 xl:col-span-8">
            <div className="h-[600px] rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`${username} | TuneLog`}
        description={`Profile for ${username}`}
      />
      <PageBreadcrumb pageTitle={username ?? "User Profile"} />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-4 mb-5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarColor()} flex items-center justify-center flex-shrink-0`}
              >
                <span className="text-white text-lg font-bold">{initials}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                  {username}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Last active: {formatDate(data?.lastLogged)}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 p-4 text-center mb-3">
              <p className="text-3xl font-bold text-gray-800 dark:text-white/90">
                {data?.totalListens ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Total Listens</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Skips", value: data?.skips, color: "text-red-400" },
                {
                  label: "Partial",
                  value: data?.partial,
                  color: "text-yellow-400",
                },
                {
                  label: "Complete",
                  value: data?.complete,
                  color: "text-green-400",
                },
                {
                  label: "Repeats",
                  value: data?.repeat,
                  color: "text-purple-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 p-3 text-center"
                >
                  <p className={`text-xl font-bold ${s.color}`}>
                    {s.value ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-4">
              Signal Breakdown
            </h4>
            <div className="space-y-3">
              {[
                { label: "Skip", value: data?.skips ?? 0, signal: "skip" },
                {
                  label: "Partial",
                  value: data?.partial ?? 0,
                  signal: "partial",
                },
                {
                  label: "Complete",
                  value: data?.complete ?? 0,
                  signal: "positive",
                },
                { label: "Repeat", value: data?.repeat ?? 0, signal: "repeat" },
              ].map((r) => (
                <BarRow
                  key={r.label}
                  label={r.label}
                  value={r.value}
                  max={totalSignals}
                  color={SIGNAL_STYLE[r.signal].bar}
                />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-1 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
              {[
                {
                  label: "Skip",
                  pct: signalPct(data?.skips ?? 0),
                  color: "text-red-400",
                },
                {
                  label: "Partial",
                  pct: signalPct(data?.partial ?? 0),
                  color: "text-yellow-400",
                },
                {
                  label: "Complete",
                  pct: signalPct(data?.complete ?? 0),
                  color: "text-green-400",
                },
                {
                  label: "Repeat",
                  pct: signalPct(data?.repeat ?? 0),
                  color: "text-purple-400",
                },
              ].map((p) => (
                <div key={p.label}>
                  <p className={`text-sm font-bold ${p.color}`}>{p.pct}%</p>
                  <p className="text-xs text-gray-400">{p.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-4">
              Top Artists
            </h4>
            <div className="space-y-2.5">
              {(data?.topArtists ?? []).slice(0, 8).map((a, i) => (
                <BarRow
                  key={i}
                  label={a.artist}
                  value={a.count}
                  max={maxArtist}
                  color="bg-brand-500"
                />
              ))}
              {(!data?.topArtists || data.topArtists.length === 0) && (
                <p className="text-xs text-gray-400">No data yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-4">
              Genre Breakdown
            </h4>
            <div className="space-y-2.5">
              {(data?.topGenres ?? []).slice(0, 8).map((g, i) => (
                <BarRow
                  key={i}
                  label={g.genre}
                  value={g.count}
                  max={maxGenre}
                  color={GENRE_COLORS[i % GENRE_COLORS.length]}
                />
              ))}
              {(!data?.topGenres || data.topGenres.length === 0) && (
                <p className="text-xs text-gray-400">No data yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-8 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-4">
              Most Played Songs
            </h4>
            <div className="space-y-1">
              {(data?.topSongs ?? []).slice(0, 6).map((song, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="w-5 text-xs text-gray-400 text-right flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SignalPill signal={song.signal} />
                    <span className="text-xs text-gray-400 w-8 text-right font-medium">
                      {song.count}×
                    </span>
                  </div>
                </div>
              ))}
              {(!data?.topSongs || data.topSongs.length === 0) && (
                <p className="text-xs text-gray-400 px-2">No song data yet.</p>
              )}
            </div>
          </div>

         
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-white/80">
                  Listen History
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {data?.recentHistory?.length ?? 0} recent listens
                </p>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 w-8">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Song
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Genre
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Signal
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      Listened At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(data?.recentHistory ?? []).map((h, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-3 text-xs text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-white/90 truncate max-w-[220px]">
                          {h.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[220px]">
                          {h.artist}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {h.genre}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SignalPill signal={h.signal} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(h.listened_at)}
                      </td>
                    </tr>
                  ))}
                  {(!data?.recentHistory ||
                    data.recentHistory.length === 0) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-gray-400"
                      >
                        No listen history yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
