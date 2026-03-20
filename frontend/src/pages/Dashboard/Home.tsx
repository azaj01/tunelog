import LibraryMetrics from "../../components/ecommerce/LibraryMetrics";
import MonthlyPlayed from "../../components/ecommerce/MonthlyPlayed";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MostSkippedPercentage from "../../components/ecommerce/MostSkippedPercentage";
import MostPlaysbyUser from "../../components/ecommerce/MostPlaysbyUser";
import MostHeardArtist from "../../components/ecommerce/MostHeardArtist";
import PageMeta from "../../components/common/PageMeta";
import { useState, useEffect } from "react";

import { fetchStats , Stats } from "../../API/API";

export default function Home() {
  
  const [stats, setStats] = useState<Stats | null>(null);

  
  
  
  // API CALLS

  useEffect(() => {
    console.log("Fetching data (home)")
    fetchStats().then((data) => setStats(data));
    console.log(stats)
  
  }, []);

  return (
    <>
      <PageMeta
        title="Dashboard - Tunelog"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <LibraryMetrics stats={stats}/>

          <MonthlyPlayed />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MostSkippedPercentage />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MostHeardArtist />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <MostPlaysbyUser />
        </div>
      </div>
    </>
  );
}
