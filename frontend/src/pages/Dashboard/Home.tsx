import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import LibraryMetrics from "../../components/ecommerce/LibraryMetrics";
import MonthlyPlayed from "../../components/ecommerce/MonthlyPlayed";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MostSkippedPercentage from "../../components/ecommerce/MostSkippedPercentage";
import MostPlaysbyUser from "../../components/ecommerce/MostPlaysbyUser";
import MostHeardArtist from "../../components/ecommerce/MostHeardArtist";
import PageMeta from "../../components/common/PageMeta";
import { fetchLogin, fetchStats, Stats , fetchGetUsers} from "../../API/API";

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const navigate = useNavigate();
useEffect(() => {
  const token =
    localStorage.getItem("tunelog_token") ||
    sessionStorage.getItem("tunelog_token");

  if (!token) {
    navigate("/signin");
    return;
  }

  const username =
    localStorage.getItem("tunelog_user") ||
    sessionStorage.getItem("tunelog_user") ||
    "";
  const password =
    localStorage.getItem("tunelog_password") ||
    sessionStorage.getItem("tunelog_password") ||
    "";

  if (username && password) {
    fetchLogin({ username, password })
      .then(() => {
        // after login ensures user is in DB, pre-cache users list
        fetchGetUsers({ admin: username, adminPD: password }).catch(() => {});
      })
      .catch(() => {});
  }

  fetchStats().then((data) => setStats(data));
}, []);

  return (
    <>
      <PageMeta
        title="Dashboard - Tunelog"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <LibraryMetrics stats={stats} />
          <MonthlyPlayed />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MostSkippedPercentage stats={stats} />
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
