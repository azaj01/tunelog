import {
  ListIcon,
  AudioIcon
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { Stats } from "../../API/API";

// import { useState } from "react";

export default function LibraryMetrics({ stats }: { stats: Stats | null }) {
  console.log("stats " , stats);
  // totalSongs = stats?.total_songs

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <ListIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Songs
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats?.total_songs ?? "—"}
            </h4>
          </div>
          {/* <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge> */}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <AudioIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Song Played
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {stats?.total_listens ?? "—"}
            </h4>
          </div>
{/* 
          <Badge color="error">
            <ArrowDownIcon />
            9.05%
          </Badge> */}
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
