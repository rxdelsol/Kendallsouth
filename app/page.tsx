type ProviderRow = {
  doctorName: string;
  insuranceName: string;
  type: string;
  network: "In Network" | "Out of Network";
  expirationDate: string;
  daysLeftLabel: string;
  statusColor: "red" | "green" | "gray";
};

const data: ProviderRow[] = [
  {
    doctorName: "Enrique Vazquez Escarpanter",
    insuranceName: "Medicaid",
    type: "Medicaid",
    network: "Out of Network",
    expirationDate: "3/15/2025",
    daysLeftLabel: "Expired",
    statusColor: "red"
  },
  {
    doctorName: "Pedro M Fernandez",
    insuranceName: "Medicaid",
    type: "Medicaid",
    network: "Out of Network",
    expirationDate: "8/2/2025",
    daysLeftLabel: "Expired",
    statusColor: "red"
  },
  {
    doctorName: "Maria E Gadea",
    insuranceName: "Oscar",
    type: "HMO",
    network: "In Network",
    expirationDate: "4/2/2026",
    daysLeftLabel: "140 days",
    statusColor: "green"
  },
  {
    doctorName: "Ariel Goitia",
    insuranceName: "Medicaid",
    type: "Medicaid",
    network: "In Network",
    expirationDate: "12/4/2026",
    daysLeftLabel: "386 days",
    statusColor: "green"
  },
  {
    doctorName: "Sara J Zayas",
    insuranceName: "Oscar",
    type: "HMO",
    network: "In Network",
    expirationDate: "4/15/2027",
    daysLeftLabel: "518 days",
    statusColor: "green"
  },
  {
    doctorName: "Pedro M Fernandez",
    insuranceName: "Oscar",
    type: "HMO",
    network: "In Network",
    expirationDate: "10/30/2027",
    daysLeftLabel: "716 days",
    statusColor: "green"
  },
  {
    doctorName: "Maria E Gadea",
    insuranceName: "Medicaid",
    type: "Medicaid",
    network: "In Network",
    expirationDate: "11/6/2027",
    daysLeftLabel: "723 days",
    statusColor: "green"
  }
];

const badgeClassesByNetwork: Record<ProviderRow["network"], string> = {
  "In Network":
    "bg-white/80 text-sky-900 border border-sky-300 dark:bg-sky-900/30 dark:text-sky-100 dark:border-sky-700",
  "Out of Network":
    "bg-white/80 text-rose-800 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-700"
};

const statusColorClasses: Record<ProviderRow["statusColor"], string> = {
  red: "text-rose-700 dark:text-rose-400",
  green: "text-emerald-700 dark:text-emerald-400",
  gray: "text-slate-600 dark:text-slate-400"
};

export default function Page() {
  const inNetworkCount = 17;
  const outNetworkCount = 8;

  return (
    <div className="bg-[#dff3ff] dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Título */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Insurance Expiration Summary
          </h2>
        </div>

        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#dff3ff] rounded-xl shadow-sm border border-sky-300 p-4 flex items-center justify-between dark:bg-slate-900">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-700 dark:text-slate-400">
                In Network
              </p>
              <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                {inNetworkCount}
              </p>
            </div>
          </div>

          <div className="bg-[#dff3ff] rounded-xl shadow-sm border border-sky-300 p-4 flex items-center justify-between dark:bg-slate-900">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-700 dark:text-slate-400">
                Out of Network
              </p>
              <p className="mt-1 text-3xl font-bold text-rose-700 dark:text-rose-400">
                {outNetworkCount}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros + tabla */}
        <div className="bg-[#dff3ff] rounded-xl shadow-sm border border-sky-300 dark:bg-slate-900 dark:border-slate-700">
          {/* Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-sky-300 dark:border-slate-700">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-slate-400">
                  Doctor
                </span>
                <select className="mt-1 rounded-md border border-sky-300 bg-white/90 px-3 py-1.5 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
                  <option>All</option>
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-slate-400">
                  Insurance
                </span>
                <select className="mt-1 rounded-md border border-sky-300 bg-white/90 px-3 py-1.5 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
                  <option>All</option>
                </select>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-700 dark:text-slate-400">
                  Type
                </span>
                <select className="mt-1 rounded-md border border-sky-300 bg-white/90 px-3 py-1.5 text-xs text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100">
                  <option>All</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-400">
              Showing {data.length} records
            </p>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#c9e9ff] border-b border-sky-300 dark:bg-slate-900 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Doctor Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Insurance Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Network
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Expiration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider dark:text-slate-300">
                    Days Left
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-200 dark:divide-slate-800">
                {data.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row.statusColor === "red"
                        ? "bg-[#fbe5ea] dark:bg-rose-950/30"
                        : idx % 2 === 0
                        ? "bg-[#dff3ff] dark:bg-slate-900"
                        : "bg-[#cfeaff] dark:bg-slate-900/70"
                    }
                  >
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                      {row.doctorName}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                      {row.insuranceName}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                      {row.type}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClassesByNetwork[row.network]}`}
                      >
                        {row.network}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-900 dark:text-slate-100">
                      {row.expirationDate}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">
                      <span
                        className={
                          row.daysLeftLabel === "Expired"
                            ? statusColorClasses.red
                            : statusColorClasses[row.statusColor]
                        }
                      >
                        {row.daysLeftLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
