import React, { useState, useMemo, useCallback } from "react";
import useStore from "../store";
import {
  MapPin,
  Calendar,
  ArrowRight,
  Store as StoreIcon,
  Map,
  Warehouse,
  User,
  Filter,
  ArrowUpDown,
  Phone,
  Truck,
  CheckCircle,
  Search,
} from "lucide-react";
import Lottie from "lottie-react";
import drivingAnimation from "../assets/drivingAnimation.json";
import PickupRouteModal from "../components/deliveries/PickupRouteModal";
import ScannerModal from "../components/deliveries/ScannerModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Button from "../components/common/Button";
import DeliveryDetailsModal from "../components/deliveries/DeliveryDetailsModal";
import DeliveryRouteModal from "../components/deliveries/DeliveryRouteModal";

// Driver's current location (mock)
const DRIVER_LOCATION = { name: "My Location", lat: 16.8, lng: 96.15 };

// Haversine distance in km
const getDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Get icon config by batch prefix
const getBatchIcon = (batchNo) => {
  if (batchNo.startsWith("WH"))
    return {
      Icon: Warehouse,
      color: "text-white",
      bg: "bg-gradient-to-br from-violet-500 to-violet-600",
      idColor: "text-violet-700",
    };
  if (batchNo.startsWith("C"))
    return {
      Icon: User,
      color: "text-white",
      bg: "bg-gradient-to-br from-sky-500 to-sky-600",
      idColor: "text-sky-700",
    };
  return {
    Icon: StoreIcon,
    color: "text-white",
    bg: "bg-gradient-to-br from-orange-500 to-orange-600",
    idColor: "text-orange-700",
  };
};

const Deliveries = () => {
  const pickups = useStore((state) => state.pickups);
  const packages = useStore((state) => state.packages);
  const updatePickupStatus = useStore((state) => state.updatePickupStatus);
  const activeDeliveryBatchNo = useStore(
    (state) => state.activeDeliveryBatchNo,
  );
  const setActiveDeliveryBatchNo = useStore(
    (state) => state.setActiveDeliveryBatchNo,
  );

  const [activeTab, setActiveTab] = useState("ready");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingBatch, setPendingBatch] = useState(null);
  const [showPickupSuccess, setShowPickupSuccess] = useState(false);
  const [isDeliveryRouteModalOpen, setIsDeliveryRouteModalOpen] =
    useState(false);
  const [scannedBatches, setScannedBatches] = useState(new Set()); // batches scanned but not yet confirmed

  // Delivery flow state
  const [isDeliveryDetailsOpen, setIsDeliveryDetailsOpen] = useState(false);
  const [isDeliveryConfirmOpen, setIsDeliveryConfirmOpen] = useState(false);
  const [deliveryConfirmAction, setDeliveryConfirmAction] = useState(null);
  const [showDeliverySuccess, setShowDeliverySuccess] = useState(false);
  const [qrPendingScan, setQrPendingScan] = useState(false);
  const [photoPending, setPhotoPending] = useState(false);

  // Filter & sort state
  const [townshipFilter, setTownshipFilter] = useState("");
  const [sortBy, setSortBy] = useState("nearest");
  const [searchQuery, setSearchQuery] = useState("");

  const closeModal = () => {
    setIsRouteModalOpen(false);
    setIsScannerModalOpen(false);
    setIsDeliveryDetailsOpen(false);
    setIsDeliveryRouteModalOpen(false);
    setSelectedBatch(null);
    setShowPickupSuccess(false);
    setShowDeliverySuccess(false);
    setQrPendingScan(false);
    setPhotoPending(false);
  };

  const handleStartPickup = (batch) => {
    setSelectedBatch(batch);
    setIsRouteModalOpen(true);
  };

  const handleViewDetails = (batch) => {
    setShowPickupSuccess(false);
    setShowDeliverySuccess(false);
    setQrPendingScan(false);
    setPhotoPending(false);
    setSelectedBatch(batch);
    setIsDeliveryDetailsOpen(true);
  };

  const handleStartPickupFromModal = (batch) => {
    setIsDeliveryDetailsOpen(false);
    setSelectedBatch(batch);
    setIsRouteModalOpen(true);
  };

  // "Start Going" pressed in PickupRouteModal → show confirmation
  const handleStartGoing = (batch) => {
    setPendingBatch(batch);
    setIsConfirmOpen(true);
  };

  // Confirmed → close everything, set status to ongoing
  const handleConfirmGoing = useCallback(() => {
    if (!pendingBatch) return;

    // Runtime guard: prevent multiple active actions
    const currentPickups = useStore.getState().pickups;
    const anyActive = currentPickups.some((p) =>
      ["ongoing", "arrived", "delivering"].includes(p.status.toLowerCase()),
    );
    if (anyActive) {
      setIsConfirmOpen(false);
      setPendingBatch(null);
      return;
    }

    const batchNo = pendingBatch.batchNo;

    setIsConfirmOpen(false);
    setIsRouteModalOpen(false);
    setSelectedBatch(null);
    setPendingBatch(null);

    updatePickupStatus(batchNo, "ongoing");
  }, [pendingBatch, updatePickupStatus]);

  // Simulate arrival for an ongoing batch
  const handleSimulateArrival = useCallback(
    (batch) => {
      updatePickupStatus(batch.batchNo, "arrived");
    },
    [updatePickupStatus],
  );

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    setPendingBatch(null);
  };

  // "Arrived & Scan" on card → open scanner
  const handleArrivedAndScan = (batch) => {
    setSelectedBatch(batch);
    setIsScannerModalOpen(true);
  };

  // Scanner "Finish" → update to todeliver, show DeliveryDetailsModal with success
  const handleFinishPickup = (batch) => {
    // Clear from scanned tracking
    setScannedBatches((prev) => {
      const next = new Set(prev);
      next.delete(batch.batchNo);
      return next;
    });
    updatePickupStatus(batch.batchNo, "todeliver");
    setIsScannerModalOpen(false);

    const updatedBatch = { ...batch, status: "todeliver" };
    setSelectedBatch(updatedBatch);
    setShowPickupSuccess(true);
    setIsDeliveryDetailsOpen(true);
  };

  // Called when QR scan completes (but pickup not yet confirmed)
  const handleScanDone = (batch) => {
    setScannedBatches((prev) => new Set(prev).add(batch.batchNo));
  };

  // ── Delivery Flow Handlers ──

  // View delivery details (from to-deliver tab)
  const handleViewDeliveryDetails = (batch) => {
    setShowDeliverySuccess(false);
    setQrPendingScan(false);
    setPhotoPending(false);
    setSelectedBatch(batch);
    setIsDeliveryDetailsOpen(true);
  };

  // Start Delivery button → open DeliveryRouteModal
  const handleStartDelivery = (batch) => {
    setSelectedBatch(batch);
    setIsDeliveryDetailsOpen(false);
    setIsDeliveryRouteModalOpen(true);
  };

  // "Start Delivery" pressed in DeliveryRouteModal → confirmation
  const handleStartDeliveryFromModal = (batch) => {
    setDeliveryConfirmAction({ type: "start", batch });
    setIsDeliveryConfirmOpen(true);
  };

  // Confirmed Start Delivery
  const handleDeliveryConfirm = () => {
    if (!deliveryConfirmAction) return;
    const { type, batch } = deliveryConfirmAction;

    // Runtime guard: prevent multiple active actions
    const currentPickups = useStore.getState().pickups;
    const anyActive = currentPickups.some((p) =>
      ["ongoing", "arrived", "delivering"].includes(p.status.toLowerCase()),
    );
    if (anyActive) {
      setIsDeliveryConfirmOpen(false);
      setDeliveryConfirmAction(null);
      return;
    }

    if (type === "start") {
      updatePickupStatus(batch.batchNo, "delivering");
      setActiveDeliveryBatchNo(batch.batchNo);
    }
    setIsDeliveryConfirmOpen(false);
    setIsDeliveryRouteModalOpen(false);
    setIsDeliveryDetailsOpen(false);
    setDeliveryConfirmAction(null);
  };

  const handleDeliveryCancelConfirm = () => {
    setIsDeliveryConfirmOpen(false);
    setDeliveryConfirmAction(null);
  };

  // Confirm Delivered button → open details with QR/photo pending
  const handleConfirmDelivered = (batch) => {
    setSelectedBatch(batch);
    setShowDeliverySuccess(false);
    const isShopOrWarehouse =
      batch.batchNo.startsWith("B") || batch.batchNo.startsWith("WH");
    const isCustomer = batch.batchNo.startsWith("C");
    if (isShopOrWarehouse) {
      setQrPendingScan(true);
      setPhotoPending(false);
    } else if (isCustomer) {
      setQrPendingScan(false);
      setPhotoPending(true);
    } else {
      setQrPendingScan(false);
      setPhotoPending(false);
    }
    setIsDeliveryDetailsOpen(true);
  };

  // Simulate QR scan for delivery confirmation
  const handleSimulateScan = () => {
    if (selectedBatch) {
      updatePickupStatus(selectedBatch.batchNo, "delivered");
      setActiveDeliveryBatchNo(null);
      const updatedBatch = { ...selectedBatch, status: "delivered" };
      setSelectedBatch(updatedBatch);
    }
    setQrPendingScan(false);
    setShowDeliverySuccess(true);
  };

  // Simulate photo capture for delivery confirmation
  const handleSimulatePhoto = () => {
    if (selectedBatch) {
      updatePickupStatus(selectedBatch.batchNo, "delivered");
      setActiveDeliveryBatchNo(null);
      const updatedBatch = { ...selectedBatch, status: "delivered" };
      setSelectedBatch(updatedBatch);
    }
    setPhotoPending(false);
    setShowDeliverySuccess(true);
  };

  // "Requests to pickup" tab includes ready, ongoing, arrived
  const requestPickups = useMemo(
    () =>
      pickups.filter((p) =>
        ["ready", "ongoing", "arrived"].includes(p.status.toLowerCase()),
      ),
    [pickups],
  );
  const toDeliverPickups = useMemo(
    () =>
      pickups.filter((p) =>
        ["todeliver", "delivering"].includes(p.status.toLowerCase()),
      ),
    [pickups],
  );

  // Delivered batches = completed
  const completedDeliveries = useMemo(
    () => pickups.filter((p) => p.status.toLowerCase() === "delivered"),
    [pickups],
  );

  // Check if any batch is currently active (ongoing or arrived) — only one at a time allowed
  const hasActiveBatch = useMemo(
    () =>
      pickups.some((p) =>
        ["ongoing", "arrived"].includes(p.status.toLowerCase()),
      ),
    [pickups],
  );

  // Check if any delivery is currently in progress
  const hasActiveDelivery = useMemo(
    () => pickups.some((p) => p.status.toLowerCase() === "delivering"),
    [pickups],
  );

  const basePickups = activeTab === "ready" ? requestPickups : toDeliverPickups;

  // Unique townships for filter dropdown
  const townships = useMemo(() => {
    const set = new Set(
      basePickups.map((p) => p.startTownship).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [basePickups]);

  // Unique townships for completed deliveries (use endTownship since those are delivery destinations)
  const completedTownships = useMemo(() => {
    const set = new Set(
      completedDeliveries.map((p) => p.endTownship).filter(Boolean),
    );
    return Array.from(set).sort();
  }, [completedDeliveries]);

  // Filtered + sorted + searched completed deliveries
  const displayedCompleted = useMemo(() => {
    let items = [...completedDeliveries];

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (b) =>
          b.batchNo.toLowerCase().includes(q) ||
          (b.shopName && b.shopName.toLowerCase().includes(q)) ||
          (b.shopPhone && b.shopPhone.toLowerCase().includes(q)) ||
          (b.destinationName && b.destinationName.toLowerCase().includes(q)) ||
          (b.destinationPhone &&
            b.destinationPhone.toLowerCase().includes(q)) ||
          (b.startLocation?.name &&
            b.startLocation.name.toLowerCase().includes(q)) ||
          (b.endLocation?.name &&
            b.endLocation.name.toLowerCase().includes(q)) ||
          (b.startTownship && b.startTownship.toLowerCase().includes(q)) ||
          (b.endTownship && b.endTownship.toLowerCase().includes(q)),
      );
    }

    // Apply township filter (endTownship = delivery destination)
    if (townshipFilter) {
      items = items.filter((p) => p.endTownship === townshipFilter);
    }

    // Compute distance
    items = items.map((p) => ({
      ...p,
      _distance: getDistance(
        DRIVER_LOCATION.lat,
        DRIVER_LOCATION.lng,
        p.endLocation.lat,
        p.endLocation.lng,
      ),
    }));

    // Sort
    items.sort((a, b) => {
      switch (sortBy) {
        case "nearest":
          return a._distance - b._distance;
        case "furthest":
          return b._distance - a._distance;
        case "time":
          return (
            new Date(b.completedAt || b.date) -
            new Date(a.completedAt || a.date)
          );
        default:
          return a._distance - b._distance;
      }
    });

    return items;
  }, [completedDeliveries, searchQuery, townshipFilter, sortBy]);

  // Filtered + sorted list
  const displayedPickups = useMemo(() => {
    let items = [...basePickups];

    // Apply township filter
    if (townshipFilter) {
      items = items.filter((p) => p.startTownship === townshipFilter);
    }

    // Compute distance for each
    items = items.map((p) => ({
      ...p,
      _distance: getDistance(
        DRIVER_LOCATION.lat,
        DRIVER_LOCATION.lng,
        p.startLocation.lat,
        p.startLocation.lng,
      ),
    }));

    // Apply sort with active items always on top
    const getActiveWeight = (item) =>
      ["ongoing", "arrived", "delivering"].includes(item.status.toLowerCase())
        ? 0
        : 1;

    items.sort((a, b) => {
      const activeOrder = getActiveWeight(a) - getActiveWeight(b);
      if (activeOrder !== 0) return activeOrder;
      switch (sortBy) {
        case "nearest":
          return a._distance - b._distance;
        case "furthest":
          return b._distance - a._distance;
        case "time":
          return new Date(a.date) - new Date(b.date);
        default:
          return a._distance - b._distance;
      }
    });

    return items;
  }, [basePickups, townshipFilter, sortBy]);

  const modalPackages = useMemo(() => {
    if (!selectedBatch) return [];
    return packages.filter((p) => p.batchNo === selectedBatch.batchNo);
  }, [selectedBatch, packages]);

  // Get the target location name for ongoing alert
  const getTargetName = (batch) => {
    return batch.startLocation?.name || "destination";
  };

  // Status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "arrived":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-gray-900">Deliveries</h2>
        <div className="flex items-center gap-1.5 text-sm text-neutral-800 font-bold">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-3 overflow-x-auto [&::-webkit-scrollbar]:h-0 [-ms-overflow-style:none] [scrollbar-width:none]">
        <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
          <button
            onClick={() => {
              setActiveTab("ready");
              setTownshipFilter("");
              setSearchQuery("");
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "ready"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Requests to pickup
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-600">
              {requestPickups.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("todeliver");
              setTownshipFilter("");
              setSearchQuery("");
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "todeliver"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            To Deliver
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-600">
              {toDeliverPickups.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab("completed");
              setTownshipFilter("");
              setSearchQuery("");
            }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "completed"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            Completed
            <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-600">
              {completedDeliveries.length}
            </span>
          </button>
        </nav>
      </div>

      {activeTab !== "completed" && (
        <>
          {/* Filter & Sort Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Township Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={townshipFilter}
                onChange={(e) => setTownshipFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              >
                <option value="">All Townships</option>
                {townships.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              >
                <option value="nearest">Nearest</option>
                <option value="furthest">Furthest</option>
                <option value="time">Time Priority</option>
              </select>
            </div>
          </div>

          {/* Pickup Cards — flat list */}
          {displayedPickups.length === 0 ? (
            <div className="py-12 text-center">
              <div className="bg-gray-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-sm">
                {activeTab === "ready"
                  ? "No pickup requests at the moment"
                  : "No batches to deliver yet"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {activeTab === "ready"
                  ? "New pickup requests will appear here"
                  : "Picked up batches will appear here"}
              </p>
            </div>
          ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {displayedPickups.map((b) => {
                  const batchPackages = packages.filter(
                    (p) => p.batchNo === b.batchNo,
                  );
                  const status = b.status.toLowerCase();
                  const {
                    Icon: BatchIcon,
                    color: iconColor,
                    bg: iconBg,
                    idColor,
                  } = getBatchIcon(b.batchNo);

                  const isActiveCard =
                    status === "ongoing" || status === "delivering";
                  const isPickupPhase = ["ready", "ongoing", "arrived"].includes(
                    status,
                  );

                  return (
                    <div
                      key={b.batchNo}
                      className={`rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col ${isActiveCard
                        ? "border-2 border-indigo-500 bg-linear-to-b from-yellow-50 to-zinc-50"
                        : "border-gray-200"
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${iconBg}`}>
                            <BatchIcon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div
                            className={`text-2xl font-bold ${idColor} flex items-center gap-2`}
                          >
                            {b.batchNo}
                            {b.timeToPickup && isPickupPhase && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gray-900 text-white">
                                {b.timeToPickup}
                              </span>
                            )}
                            {status === "ongoing" && (
                              <span className="flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${getStatusBadge(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="mt-3 space-y-2 text-gray-700">
                        {/* <div className="flex items-center text-sm">
                    <StoreIcon className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">
                        {b.startLocation.name}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium">{b.endLocation.name}</span>
                    </span>
                  </div> */}
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
                        {/* Distance indicator */}
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                          <span className="text-gray-500">
                            {b._distance !== undefined
                              ? `${b._distance.toFixed(1)} km away`
                              : "—"}
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                          {activeTab === "ready" ? (
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium">{b.shopName}</span>
                              <span>-</span>
                              <a
                                href={`tel:${b.shopPhone}`}
                                className="text-indigo-600 hover:underline"
                              >
                                <b>{b.shopPhone}</b>
                              </a>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium">
                                {b.destinationName}
                              </span>
                              <span>-</span>
                              <a
                                href={`tel:${b.destinationPhone}`}
                                className="text-indigo-600 hover:underline"
                              >
                                <b>{b.destinationPhone}</b>
                              </a>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex-grow flex items-end">
                        <div className="w-full space-y-2">
                          {/* View Details always visible */}
                          <Button
                            variant="secondary"
                            size="md"
                            block
                            onClick={() => handleViewDetails(b)}
                          >
                            View Details ({batchPackages.length})
                          </Button>

                          {/* Ready status: show Start Pickup (disabled if another batch is active) */}
                          {status === "ready" && activeTab === "ready" && (
                            <Button
                              variant="outline"
                              size="md"
                              block
                              onClick={() => handleStartPickup(b)}
                              disabled={hasActiveBatch || hasActiveDelivery}
                              className={
                                hasActiveBatch || hasActiveDelivery
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            >
                              {hasActiveDelivery
                                ? "Delivery in progress"
                                : hasActiveBatch
                                  ? "Another pickup in progress"
                                  : "Start Pickup"}
                            </Button>
                          )}

                          {/* Ongoing status: driving animation + simulate arrival */}
                          {status === "ongoing" && (
                            <>
                              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                                <div className="w-20 h-20 shrink-0">
                                  <Lottie
                                    animationData={drivingAnimation}
                                    loop
                                    autoplay
                                    className="h-full w-full shrink-0 bg-white rounded-full border border-2 border-indigo-400"
                                  />
                                </div>
                                <span>Ongoing to {getTargetName(b)}</span>
                              </div>
                              <Button
                                variant="secondary"
                                size="md"
                                block
                                onClick={() => handleSimulateArrival(b)}
                              >
                                Simulate Arrival
                              </Button>
                            </>
                        )}

                          {/* Arrived status: Scan QR Code or Confirm Pick Up */}
                          {status === "arrived" && (
                          <Button
                              variant="warning"
                              size="md"
                              block
                              onClick={() => handleArrivedAndScan(b)}
                          >
                              {scannedBatches.has(b.batchNo)
                                ? "Confirm Pick Up"
                                : "Scan QR Code"}
                          </Button>
                          )}

                          {/* To Deliver status: Start Delivery */}
                          {status === "todeliver" &&
                            activeTab === "todeliver" && (
                            <Button
                              variant="primary"
                              size="md"
                              block
                              onClick={() => handleStartDelivery(b)}
                              disabled={
                                hasActiveBatch || !!activeDeliveryBatchNo
                              }
                              className={
                                hasActiveBatch || !!activeDeliveryBatchNo
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            >
                              <Truck className="h-4 w-4" />
                              {hasActiveBatch
                                ? "Pickup in progress"
                                : activeDeliveryBatchNo
                                  ? "Another delivery in progress"
                                  : "Start Delivery"}
                            </Button>
                          )}

                          {/* Delivering status: driving animation + Delivered button */}
                          {status === "delivering" && (
                            <>
                              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                                <div className="w-20 h-20 shrink-0">
                                  <Lottie
                                    animationData={drivingAnimation}
                                    loop
                                    autoplay
                                    className="h-full w-full shrink-0 bg-white rounded-full border border-2 border-indigo-400"
                                  />
                                </div>
                                <span>Delivering to {b.endLocation.name}...</span>
                              </div>
                            <Button
                                variant="warning"
                                size="md"
                                block
                                onClick={() => handleConfirmDelivered(b)}
                            >
                                <CheckCircle className="h-4 w-4" />
                                Delivered
                            </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* ── COMPLETED TAB ── */}
      {activeTab === "completed" && (
        <>
          {/* Search + Filter + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch, name, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              />
            </div>

            {/* Township Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={townshipFilter}
                onChange={(e) => setTownshipFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              >
                <option value="">All Townships</option>
                {completedTownships.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              >
                <option value="nearest">Nearest</option>
                <option value="furthest">Furthest</option>
                <option value="time">Time Priority</option>
              </select>
            </div>
          </div>

          {/* Results */}
          {displayedCompleted.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-gray-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-sm">
                {searchQuery.trim() || townshipFilter
                  ? "No completed deliveries match your search"
                  : "No completed deliveries yet"}
              </p>
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedCompleted.map((b) => {
                  const batchPackages = packages.filter(
                    (p) => p.batchNo === b.batchNo,
                  );
                  const {
                    Icon: BatchIcon,
                    color: iconColor,
                    bg: iconBg,
                    idColor,
                  } = getBatchIcon(b.batchNo);

                  return (
                    <div
                      key={b.batchNo}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${iconBg}`}>
                            <BatchIcon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div className={`text-2xl font-bold ${idColor}`}>
                            {b.batchNo}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-800">
                          Delivered
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-gray-700">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                          <span className="font-medium">
                            {b.endLocation.name}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Map className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
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
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button
                          variant="secondary"
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
          )}
        </>
      )}

      {/* Modals */}
      {selectedBatch && (
        <>
          <PickupRouteModal
            isOpen={isRouteModalOpen}
            onClose={closeModal}
            batch={selectedBatch}
            packages={modalPackages}
            onStartGoing={handleStartGoing}
          />
          <ScannerModal
            isOpen={isScannerModalOpen}
            onClose={closeModal}
            onFinishPickup={handleFinishPickup}
            onScanDone={handleScanDone}
            initialPhase={
              scannedBatches.has(selectedBatch?.batchNo) ? "verify" : "scan"
            }
            batch={selectedBatch}
            packages={modalPackages}
          />
        </>
      )}
      {/* Confirmation Dialog for Start Going */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmGoing}
        title="Confirm Pickup"
        message="Are you sure to go and pickup this route?"
      />

      {/* Delivery Details Modal */}
      {selectedBatch && (
        <>
          <DeliveryDetailsModal
            isOpen={isDeliveryDetailsOpen}
            onClose={closeModal}
            batch={selectedBatch}
            packages={modalPackages}
            isActionDisabled={hasActiveBatch || hasActiveDelivery}
            onStartPickup={(batch) => {
              setIsDeliveryDetailsOpen(false);
              handleStartPickup(batch);
            }}
            onStartDelivery={handleStartDelivery}
            onConfirmDelivered={handleConfirmDelivered}
            showPickupSuccess={showPickupSuccess}
            showDeliverySuccess={showDeliverySuccess}
            qrPendingScan={qrPendingScan}
            onSimulateScan={handleSimulateScan}
            photoPending={photoPending}
            onSimulatePhoto={handleSimulatePhoto}
          />
          <DeliveryRouteModal
            isOpen={isDeliveryRouteModalOpen}
            onClose={() => setIsDeliveryRouteModalOpen(false)}
            batch={selectedBatch}
            packages={modalPackages}
            onStartDelivery={handleStartDeliveryFromModal}
          />
        </>
      )}

      {/* Confirmation Dialog for Start Delivery */}
      <ConfirmDialog
        isOpen={isDeliveryConfirmOpen}
        onClose={handleDeliveryCancelConfirm}
        onConfirm={handleDeliveryConfirm}
        title="Start Delivery"
        message="Are you sure you want to start delivering this batch?"
      />
    </div>
  );
};

export default Deliveries;
