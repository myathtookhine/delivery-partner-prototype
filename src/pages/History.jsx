import React, { useState, useMemo } from "react";
import {
  Search,
  Calendar,
  MapPin,
  ArrowRight,
  Store as StoreIcon,
  Warehouse,
  User,
  CheckCircle,
  Filter,
  X,
  Map,
} from "lucide-react";
import useStore from "../store";
import DeliveryDetailsModal from "../components/deliveries/DeliveryDetailsModal";
import Button from "../components/common/Button";


const History = () => {
  const pickups = useStore((state) => state.pickups);
  const packages = useStore((state) => state.packages);

  const [activeTab, setActiveTab] = useState("B");
  const [searchQuery, setSearchQuery] = useState("");
  const [townshipFilter, setTownshipFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // All delivered batches
  const deliveredBatches = useMemo(
    () => pickups.filter((p) => p.status.toLowerCase() === "delivered"),
    [pickups],
  );

  // Get unique townships from delivered batches
  const allTownships = useMemo(() => {
    const townships = new Set();
    deliveredBatches.forEach((b) => {
      if (b.startTownship) townships.add(b.startTownship);
      if (b.endTownship) townships.add(b.endTownship);
    });
    return Array.from(townships).sort();
  }, [deliveredBatches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    let items = deliveredBatches.filter((b) =>
      b.batchNo.startsWith(activeTab),
    );

    // Search by batch no
    if (searchQuery.trim()) {
      items = items.filter((b) =>
        b.batchNo.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      );
    }

    // Filter by township
    if (townshipFilter) {
      items = items.filter(
        (b) =>
          b.startTownship === townshipFilter ||
          b.endTownship === townshipFilter,
      );
    }

    // Filter by date range
    if (startDate) {
      items = items.filter((b) => b.date >= startDate);
    }
    if (endDate) {
      items = items.filter((b) => b.date <= endDate);
    }

    return items;
  }, [
    deliveredBatches,
    activeTab,
    searchQuery,
    townshipFilter,
    startDate,
    endDate,
  ]);

  const getBatchPackages = (batchNo) =>
    packages.filter((p) => p.batchNo === batchNo);

  const handleViewDetails = (batch) => {
    setSelectedBatch(batch);
    setIsDetailOpen(true);
  };

  const closeModal = () => {
    setIsDetailOpen(false);
    setSelectedBatch(null);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTownshipFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    searchQuery || townshipFilter || startDate || endDate;

  const tabs = [
    {
      key: "B",
      label: "Businesses",
      icon: StoreIcon,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      activeColor: "border-orange-500 text-orange-600",
    },
    {
      key: "WH",
      label: "Warehouses",
      icon: Warehouse,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-200",
      activeColor: "border-violet-500 text-violet-600",
    },
    {
      key: "C",
      label: "Customers",
      icon: User,
      color: "text-sky-600",
      bg: "bg-sky-50",
      border: "border-sky-200",
      activeColor: "border-sky-500 text-sky-600",
    },
  ];

  const activeTabData = tabs.find((t) => t.key === activeTab);

  const modalPackages = useMemo(() => {
    if (!selectedBatch) return [];
    return packages.filter((p) => p.batchNo === selectedBatch.batchNo);
  }, [selectedBatch, packages]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Delivery History
      </h2>

      {/* Type Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const count = deliveredBatches.filter((b) =>
              b.batchNo.startsWith(tab.key),
            ).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? tab.activeColor
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Batch No. (e.g. B001, WH012)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3">
          {/* Township filter */}
          <div className="relative flex-1 min-w-[180px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={townshipFilter}
              onChange={(e) => setTownshipFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Townships</option>
              {allTownships.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative flex-1 min-w-[150px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
            />
          </div>

          {/* End Date */}
          <div className="relative flex-1 min-w-[150px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-colors"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredBatches.length === 0 ? (
        <div className="py-12 text-center">
          <div className="bg-gray-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-sm">
            {hasActiveFilters
              ? "No deliveries match your filters"
              : `No ${activeTabData?.label.toLowerCase()} delivery history yet`}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {hasActiveFilters
              ? "Try adjusting your search or filters"
              : "Completed deliveries will appear here"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`p-1.5 rounded-lg ${activeTabData?.bg} ${activeTabData?.border} border`}
            >
              {activeTabData && (
                <activeTabData.icon
                  className={`h-4 w-4 ${activeTabData.color}`}
                />
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              {activeTabData?.label}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredBatches.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBatches.map((b) => {
              const batchPackages = getBatchPackages(b.batchNo);
              return (
                <div
                  key={b.batchNo}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        {b.batchNo}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-800">
                      Delivered
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-gray-700">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                      <span>{b.date}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                      <span className="font-medium">{b.endLocation.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <StoreIcon className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">
                          {b.startLocation.name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">
                          {b.endLocation.name}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Map className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                      {b.startTownship === b.endTownship ? (
                        <span className="font-medium">
                          Within {b.startTownship}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium">
                            {b.startTownship}
                          </span>
                            <ArrowRight className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">{b.endTownship}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 grow flex items-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      block
                      onClick={() => handleViewDetails(b)}
                    >
                      View Details ({batchPackages.length})
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBatch && (
        <DeliveryDetailsModal
          isOpen={isDetailOpen}
          onClose={closeModal}
          batch={selectedBatch}
          packages={modalPackages}
        />
      )}
    </div>
  );
};

export default History;
