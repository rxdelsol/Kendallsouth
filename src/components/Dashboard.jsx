import React, { useEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inNetwork: 0,
    outNetwork: 0,
    expiringSoon: 0,
    expired: 0,
  });

  async function loadData() {
    try {
      const res = await fetch("/api/get-insurances");
      const data = await res.json();

      if (!data.ok) {
        console.error(data.error);
        setLoading(false);
        return;
      }

      const list = data.data || [];
      const today = new Date();

      let inNetwork = 0;
      let outNetwork = 0;
      let expiringSoon = 0;
      let expired = 0;

      list.forEach((insurance) => {
        if (insurance.network === "In Network") inNetwork++;
        else if (insurance.network === "Out of Network") outNetwork++;

        if (insurance.expiration) {
          const expDate = new Date(insurance.expiration);
          const diffMs = expDate.getTime() - today.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays < 0) expired++;
          else if (diffDays <= 60) expiringSoon++;
        }
      });

      setStats({
        total: list.length,
        inNetwork,
        outNetwork,
        expiringSoon,
        expired,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-4">
        Insurance Expiration Summary
      </h2>

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total */}
          <div className="bg-[#081424] p-4 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Total</p>
            <p className="text-4xl text-sky-300 font-semibold">{stats.total}</p>
          </div>

          {/* In Network */}
          <div className="bg-[#081424] p-4 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">In Network</p>
            <p className="text-4xl text-emerald-300 font-semibold">
              {stats.inNetwork}
            </p>
          </div>

          {/* Out of Network */}
          <div className="bg-[#081424] p-4 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">Out of Network</p>
            <p className="text-4xl text-rose-300 font-semibold">
              {stats.outNetwork}
            </p>
          </div>

          {/* Expiring Soon */}
          <div className="bg-[#081424] p-4 rounded-xl">
            <p className="text-slate-400 text-xs uppercase">
              Expiring (Next 60 Days)
            </p>
            <p className="text-4xl text-amber-300 font-semibold">
              {stats.expiringSoon}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Expired:{" "}
              <span className="text-rose-300 font-semibold">
                {stats.expired}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
