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

  async function load() {
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
      let expiringSoon = 0; // próximos 60 días
      let expired = 0;

      list.forEach((i) => {
        if (i.network === "In Network") inNetwork++;
        else if (i.network === "Out of Network") outNetwork++;

        if (i.expiration) {
          const expDate = new Date(i.expiration);
          const diffMs = expDate.getTime() - today.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            expired++;
          } else if (diffDays <= 60) {
            expiringSoon++;
          }
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
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-card rounded p-4">
      <h2 className="text-sky-200 font-semibold mb-4">
        Insurance Expiration Summary
      </h2>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">Total</p>
              <p className="text-3xl font-semibold text-sky-200">
                {stats.total}
              </p>
            </div>

            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">In Network</p>
              <p className="text-3xl font-semibold text-emerald-300">
                {stats.inNetwork}
              </p>
            </div>

            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">Out of Network</p>
              <p className="text-3xl font-semibold text-rose-300">
                {stats.outNetwork}
              </p>
            </div>

            <div className="rounded-xl bg-[#081424] p-4">
              <p className="text-slate-400 text-xs uppercase">
                Expiring &lt;= 60 days
              </p>
              <p className="text-3xl font-semibold text-amber-300">
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

          <p className="text-slate-400 text-xs">
            (Datos calculados en vivo desde la tabla <code>insurances</code> en
            Supabase)
          </p>
        </>
      )}
    </div>
  );
}
