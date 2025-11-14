import { useState } from "react";
import data from "../../../base.json";
import NetworkStatus from "../../components/NetworkStatus";

export default function Dashboard() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const today = new Date();

  const getStatus = (expirationDate) => {
    const expDate = new Date(expirationDate);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (expDate < today) return "out";
    if (diffDays <= 30) return "soon";
    return "in";
  };

  const filteredData = data.filter((provider) => {
    const status = getStatus(provider.expirationDate);
    const matchesFilter =
      filter === "all" ||
      (filter === "in" && status === "in") ||
      (filter === "out" && status === "out") ||
      (filter === "soon" && status === "soon");

    const matchesSearch =
      provider.name.toLowerCase().includes(search.toLowerCase()) ||
      provider.insurance.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Provider Summary</h1>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by provider or insurance..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <div className="flex gap-2 mt-2 sm:mt-0">
          {["all", "in", "soon", "out"].map((key) => {
            const labelMap = {
              all: "All",
              in: "In Network",
              soon: "Expiring Soon",
              out: "Out of Network",
            };
            const colorMap = {
              all: "bg-blue-600",
              in: "bg-green-600",
              soon: "bg-yellow-500",
              out: "bg-red-600",
            };
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === key
                    ? colorMap[key] + " text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {labelMap[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider list */}
      <div className="grid gap-4">
        {filteredData.map((provider) => (
          <div
            key={provider.id}
            className="border p-4 rounded-2xl bg-white shadow-sm flex justify-between items-center provider-card"
          >
            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                {provider.name}
              </h2>
              <p className="text-sm text-gray-500">{provider.insurance}</p>
              <p className="text-sm text-gray-600">
                Expiration:{" "}
                <span className="font-medium">{provider.expirationDate}</span>
              </p>
            </div>
            <NetworkStatus expirationDate={provider.expirationDate} />
          </div>
        ))}

        {filteredData.length === 0 && (
          <p className="text-gray-500 text-center mt-8">
            No providers found for this search or filter.
          </p>
        )}
      </div>
    </div>
  );
}
