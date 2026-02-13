import React, { useState, useMemo } from "react";
import {
  MapPin,
  Map,
  Calendar,
  ArrowRight,
  Store,
  Truck,
  Package,
  CheckCircle,
  Navigation,
  ChevronRight,
  MoveRight,
  Phone,
  User,
  Warehouse,
  X,
  Expand,
  Minimize,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Lottie from "lottie-react";
import drivingAnimation from "../assets/drivingAnimation.json";
import useStore from "../store";
import RoutingMachine from "../components/RoutingMachine";
import DeliveryDetailsModal from "../components/deliveries/DeliveryDetailsModal";
import PickupRouteModal from "../components/deliveries/PickupRouteModal";
import DeliveryRouteModal from "../components/deliveries/DeliveryRouteModal";
import ScannerModal from "../components/deliveries/ScannerModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Button from "../components/common/Button";

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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
    return { Icon: Warehouse, color: "text-white", bg: "bg-gradient-to-br from-violet-500 to-violet-600", idColor: "text-violet-700" };
  if (batchNo.startsWith("C"))
    return { Icon: User, color: "text-white", bg: "bg-gradient-to-br from-sky-500 to-sky-600", idColor: "text-sky-700" };
  return { Icon: Store, color: "text-white", bg: "bg-gradient-to-br from-orange-500 to-orange-600", idColor: "text-orange-700" };
};

const Routes = () => {
  const [queueTab, setQueueTab] = useState("all"); // all | pickup | todeliver
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: "start" | "delivered", batch }
  const [showDeliverySuccess, setShowDeliverySuccess] = useState(false);
  const [qrPendingScan, setQrPendingScan] = useState(false); // QR awaiting scan for B*/WH* batches
  const [photoPending, setPhotoPending] = useState(false); // Photo awaiting capture for C* batches
  const [routeContactInfo, setRouteContactInfo] = useState(null); // { batch, packages } for route step popup
  const [mapEnlarged, setMapEnlarged] = useState(false); // fullscreen map
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [pendingBatch, setPendingBatch] = useState(null);
  const [showPickupSuccess, setShowPickupSuccess] = useState(false);
  const [scannedBatches, setScannedBatches] = useState(new Set());
  const [isDeliveryRouteModalOpen, setIsDeliveryRouteModalOpen] = useState(false);

  const pickups = useStore((state) => state.pickups);
  const packages = useStore((state) => state.packages);
  const updatePickupStatus = useStore((state) => state.updatePickupStatus);
  const activeDeliveryBatchNo = useStore(
    (state) => state.activeDeliveryBatchNo,
  );
  const setActiveDeliveryBatchNo = useStore(
    (state) => state.setActiveDeliveryBatchNo,
  );

  // Requests to pickup (ready, ongoing, arrived)
  const requestPickups = useMemo(
    () =>
      pickups.filter((p) =>
        ["ready", "ongoing", "arrived"].includes(p.status.toLowerCase()),
      ),
    [pickups],
  );

  // Picked up batches = upcoming deliveries
  const upcomingDeliveries = useMemo(
    () =>
      pickups.filter((p) =>
        ["todeliver", "delivering"].includes(p.status.toLowerCase()),
      ),
    [pickups],
  );

  // All pending tasks (pickups + deliveries) for map display
  const allPendingTasks = useMemo(
    () => [...requestPickups, ...upcomingDeliveries],
    [requestPickups, upcomingDeliveries],
  );

  // All routes: combined & sorted by distance
  const allRoutes = useMemo(() => {
    const combined = [...requestPickups, ...upcomingDeliveries];
    return combined
      .map((p) => ({
        ...p,
        _distance: getDistance(
          DRIVER_LOCATION.lat,
          DRIVER_LOCATION.lng,
          p.startLocation.lat,
          p.startLocation.lng,
        ),
      }))
      .sort((a, b) => a._distance - b._distance);
  }, [requestPickups, upcomingDeliveries]);


  // Items to display in queue based on selected queueTab
  const queueItems = useMemo(() => {
    let items;
    if (queueTab === "pickup") items = [...requestPickups];
    else if (queueTab === "todeliver") items = [...upcomingDeliveries];
    else items = [...allRoutes];

    // Compute distance if not present
    items = items.map((p) => ({
      ...p,
      _distance: p._distance ?? getDistance(
        DRIVER_LOCATION.lat, DRIVER_LOCATION.lng,
        p.startLocation.lat, p.startLocation.lng
      ),
    }));

    // Active items (ongoing/arrived/delivering) on top, then by distance
    items.sort((a, b) => {
      const aActive = ["ongoing", "arrived", "delivering"].includes(a.status.toLowerCase()) ? 0 : 1;
      const bActive = ["ongoing", "arrived", "delivering"].includes(b.status.toLowerCase()) ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return a._distance - b._distance;
    });

    return items;
  }, [queueTab, requestPickups, upcomingDeliveries, allRoutes]);

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

  // Build the step-by-step route for the step bar
  const routeSteps = useMemo(() => {
    const steps = [DRIVER_LOCATION];
    allPendingTasks.forEach((b) => {
      const isPickupPhase = ["ready", "ongoing", "arrived"].includes(b.status.toLowerCase());
      const loc = isPickupPhase ? b.startLocation : b.endLocation;
      steps.push({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        batchNo: b.batchNo,
        status: b.status,
      });
    });
    return steps;
  }, [allPendingTasks]);

  // Map center
  const mapCenter = useMemo(() => {
    if (allPendingTasks.length > 0) {
      const first = allPendingTasks[0];
      const isPickup = ["ready", "ongoing", "arrived"].includes(first.status.toLowerCase());
      const loc = isPickup ? first.startLocation : first.endLocation;
      return [loc.lat, loc.lng];
    }
    return [DRIVER_LOCATION.lat, DRIVER_LOCATION.lng];
  }, [allPendingTasks]);

  // Get packages for a batch
  const getBatchPackages = (batchNo) =>
    packages.filter((p) => p.batchNo === batchNo);

  // View details modal
  const handleViewDetails = (batch) => {
    setShowDeliverySuccess(false);
    setQrPendingScan(false);
    setPhotoPending(false);
    setSelectedBatch(batch);
    setIsDetailsModalOpen(true);
  };

  // Start Delivery - open DeliveryRouteModal
  const handleStartDelivery = (batch) => {
    setSelectedBatch(batch);
    setIsDetailsModalOpen(false);
    setIsDeliveryRouteModalOpen(true);
  };

  // "Start Delivery" pressed in DeliveryRouteModal → show confirmation
  const handleStartDeliveryFromModal = (batch) => {
    setConfirmAction({ type: "start", batch });
    setIsConfirmOpen(true);
  };

  // Confirm Delivered - open details modal directly with QR/photo pending
  const handleConfirmDelivered = (batch) => {
    setSelectedBatch(batch);
    setShowDeliverySuccess(false);

    // For shop (B*) and warehouse (WH*) batches, show QR pending
    // For customer (C*) batches, show photo capture pending
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

    setIsDetailsModalOpen(true);
  };

  // Handle confirmation (only for Start Delivery now)
  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, batch } = confirmAction;

    // Runtime guard: prevent multiple active actions
    const currentPickups = useStore.getState().pickups;
    const anyActive = currentPickups.some((p) =>
      ["ongoing", "arrived", "delivering"].includes(p.status.toLowerCase()),
    );
    if (anyActive) {
      setIsConfirmOpen(false);
      setConfirmAction(null);
      return;
    }

    if (type === "start") {
      updatePickupStatus(batch.batchNo, "delivering");
      setActiveDeliveryBatchNo(batch.batchNo);
      setIsConfirmOpen(false);
      setIsDeliveryRouteModalOpen(false);
      setIsDetailsModalOpen(false);
      setConfirmAction(null);
    }

    if (type === "pickup") {
      updatePickupStatus(batch.batchNo, "ongoing");
      setIsConfirmOpen(false);
      setIsRouteModalOpen(false);
      setSelectedBatch(null);
      setConfirmAction(null);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    setConfirmAction(null);
  };

  // ── Pickup Flow Handlers ──
  const handleStartPickup = (batch) => {
    setSelectedBatch(batch);
    setIsRouteModalOpen(true);
  };

  const handleStartGoing = (batch) => {
    setConfirmAction({ type: "pickup", batch });
    setIsConfirmOpen(true);
  };

  const handleSimulateArrival = (batch) => {
    updatePickupStatus(batch.batchNo, "arrived");
  };

  const handleArrivedAndScan = (batch) => {
    setSelectedBatch(batch);
    setIsScannerModalOpen(true);
  };

  const handleFinishPickup = (batch) => {
    setScannedBatches((prev) => {
      const next = new Set(prev);
      next.delete(batch.batchNo);
      return next;
    });
    updatePickupStatus(batch.batchNo, "todeliver");
    setIsScannerModalOpen(false);
    setSelectedBatch(null);
  };

  const handleScanDone = (batch) => {
    setScannedBatches((prev) => new Set(prev).add(batch.batchNo));
  };

  const closeModal = () => {
    setIsDetailsModalOpen(false);
    setIsRouteModalOpen(false);
    setIsScannerModalOpen(false);
    setIsDeliveryRouteModalOpen(false);
    setSelectedBatch(null);
    setShowDeliverySuccess(false);
    setShowPickupSuccess(false);
    setQrPendingScan(false);
    setPhotoPending(false);
  };

  // Simulate QR scan for shop/warehouse delivery confirmation
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

  // Simulate photo capture for customer delivery confirmation
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

  const modalPackages = useMemo(() => {
    if (!selectedBatch) return [];
    return packages.filter((p) => p.batchNo === selectedBatch.batchNo);
  }, [selectedBatch, packages]);

  // Status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "ready":
        return "bg-emerald-100 text-emerald-800";
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "arrived":
        return "bg-amber-100 text-amber-800";
      case "todeliver":
        return "bg-yellow-100 text-yellow-800";
      case "delivering":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ready":
        return "Ready";
      case "ongoing":
        return "On the Way";
      case "arrived":
        return "Arrived";
      case "todeliver":
        return "Picked Up";
      case "delivering":
        return "Delivering";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-gray-900">Routes</h2>
        <div className="flex items-center gap-1.5 text-sm text-neutral-800 font-bold">
          <Calendar className="h-4 w-4" />
          <span>{today}</span>
        </div>
      </div>

      {/* Map (left) + Batch Stack (right) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Map + Step Bar */}
        <div className="w-full lg:w-1/2 space-y-3">
          {/* Step-by-step destination bar */}
          {routeSteps.length > 1 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Route
              </h4>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                {routeSteps.map((step, idx) => {
                  // Find the batch for this step to enable click
                  const stepBatch =
                    idx > 0
                      ? allPendingTasks.find(
                          (b) => b.batchNo === step.batchNo,
                        )
                      : null;
                  return (
                    <React.Fragment key={idx}>
                      <button
                        type="button"
                        onClick={() => {
                          if (stepBatch) {
                            const stepPkgs = packages.filter(
                              (p) => p.batchNo === stepBatch.batchNo,
                            );
                            setRouteContactInfo({
                              batch: stepBatch,
                              packages: stepPkgs,
                            });
                          }
                        }}
                        disabled={idx === 0}
                        className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          idx === 0
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-default"
                            : step.status === "delivered"
                              ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer"
                              : step.status === "delivering"
                                ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                                : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 cursor-pointer"
                        }`}
                      >
                        {idx === 0 ? (
                          <Navigation className="h-3 w-3" />
                        ) : step.status === "delivered" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        <span className="whitespace-nowrap">{step.name}</span>
                      </button>
                      {idx < routeSteps.length - 1 && (
                        <MoveRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
            {allPendingTasks.length > 0 ? (
              <>
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  className="h-[200px] lg:h-[520px] w-full"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  {/* Driver marker */}
                  <Marker position={[DRIVER_LOCATION.lat, DRIVER_LOCATION.lng]}>
                    <Popup>📍 My Location</Popup>
                  </Marker>
                  {/* Destination markers */}
                  {allPendingTasks.map((b) => {
                    const isPickup = ["ready", "ongoing", "arrived"].includes(b.status.toLowerCase());
                    const loc = isPickup ? b.startLocation : b.endLocation;
                    return (
                      <Marker
                        key={b.batchNo}
                        position={[loc.lat, loc.lng]}
                      >
                        <Popup>
                          {isPickup ? "🏪" : "📦"} {b.batchNo} → {loc.name}
                        </Popup>
                      </Marker>
                    );
                  })}
                  {/* Route lines */}
                  {allPendingTasks.map((b, idx) => {
                    const isPickup = ["ready", "ongoing", "arrived"].includes(b.status.toLowerCase());
                    const dest = isPickup ? b.startLocation : b.endLocation;
                    let start;
                    if (idx === 0) {
                      start = [DRIVER_LOCATION.lat, DRIVER_LOCATION.lng];
                    } else {
                      const prev = allPendingTasks[idx - 1];
                      const prevIsPickup = ["ready", "ongoing", "arrived"].includes(prev.status.toLowerCase());
                      const prevLoc = prevIsPickup ? prev.startLocation : prev.endLocation;
                      start = [prevLoc.lat, prevLoc.lng];
                    }
                    const end = [dest.lat, dest.lng];
                    return (
                      <RoutingMachine
                        key={`route-${b.batchNo}`}
                        start={start}
                        end={end}
                        color={
                          isPickup
                            ? (b.status === "ongoing" ? "#f59e0b" : "#10b981")
                            : (b.status === "delivering" ? "#3b82f6" : "#6366f1")
                        }
                      />
                    );
                  })}
                </MapContainer>
                {/* Enlarge map button */}
                <button
                  onClick={() => setMapEnlarged(true)}
                  className="absolute bottom-3 right-3 z-500 p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  title="Enlarge map"
                >
                  <Expand className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="h-[200px] lg:h-[520px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No pending tasks to show on map</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Batch Stack */}
        <div className="w-full lg:w-1/2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="h-4 w-4 text-indigo-500" />
                Delivery Queue
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {queueItems.length} batches
              </span>
            </div>

            {/* Queue Sub-Tabs */}
            <div className="border-b border-gray-100 px-4 overflow-x-auto [&::-webkit-scrollbar]:h-0 [-ms-overflow-style:none] [scrollbar-width:none]">
              <nav className="-mb-px flex space-x-4" aria-label="Queue Tabs">
                {[
                  { key: "all", label: "All Routes", count: allRoutes.length },
                  {
                    key: "pickup",
                    label: "Requests to Pickup",
                    count: requestPickups.length,
                  },
                  {
                    key: "todeliver",
                    label: "To-Deliver",
                    count: upcomingDeliveries.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setQueueTab(tab.key)}
                    className={`whitespace-nowrap py-2.5 px-1 border-b-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      queueTab === tab.key
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                        queueTab === tab.key
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto scrollbar-thin">
              {queueItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="bg-gray-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium text-sm">
                    {queueTab === "pickup"
                      ? "No pickup requests"
                      : queueTab === "todeliver"
                        ? "No deliveries pending"
                        : "No routes available"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {queueTab === "pickup"
                      ? "New pickup requests will appear here"
                      : queueTab === "todeliver"
                        ? "Pick up batches to start delivering"
                        : "Pickup requests and deliveries will appear here"}
                  </p>
                </div>
              ) : (
                queueItems.map((b) => {
                  const batchPackages = getBatchPackages(b.batchNo);
                  const status = b.status.toLowerCase();
                  const isActive =
                    status === "ongoing" || status === "delivering";
                  const isPickupPhase = [
                    "ready",
                    "ongoing",
                    "arrived",
                  ].includes(status);
                  const {
                    Icon: BatchIcon,
                    color: batchIconColor,
                    bg: batchIconBg,
                    idColor: batchIdColor,
                  } = getBatchIcon(b.batchNo);

                  return (
                    <div
                      key={b.batchNo}
                      className={`p-4 transition-colors ${
                        isActive
                          ? "border-l-4 border-l-indigo-500 bg-linear-to-b from-yellow-50 to-zinc-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-lg ${batchIconBg}`}>
                            <BatchIcon
                              className={`h-4 w-4 ${batchIconColor}`}
                            />
                          </div>
                          <div>
                            <div
                              className={`text-lg font-bold ${batchIdColor} flex items-center gap-2`}
                            >
                              {b.batchNo}
                              {b.timeToPickup && isPickupPhase && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gray-900 text-white">
                                  {b.timeToPickup}
                                </span>
                              )}
                              {isActive && (
                                <span className="flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${getStatusBadge(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      {/* Location info */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
                          <span className="text-sm truncate text-gray-500">
                            {isPickupPhase
                              ? b.startLocation.name
                              : b.endLocation.name}
                          </span>
                        </div>
                        {/* Contact info */}
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
                          <span className="text-sm">
                            <a
                              href={`tel:${isPickupPhase ? b.shopPhone : b.destinationPhone}`}
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              {isPickupPhase ? b.shopPhone : b.destinationPhone}
                            </a>
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Map className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
                          <span className="text-sm flex items-center gap-1 flex-wrap">
                            <span>{b.startTownship}</span>
                            <ArrowRight className="h-4 w-4 text-gray-600" />
                            <span>{b.endTownship}</span>
                          </span>
                        </div>
                        {b._distance !== undefined && (
                          <div className="flex items-center text-gray-600">
                            <Navigation className="h-3.5 w-3.5 text-gray-400 mr-1.5 shrink-0" />
                            <span className="text-sm text-gray-500">
                              {b._distance.toFixed(1)} km away
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ongoing indicator */}
                      {status === "ongoing" && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium mb-3">
                          <Lottie
                            animationData={drivingAnimation}
                            loop={true}
                            className="h-14 w-14 shrink-0 bg-white rounded-full border border-2 border-indigo-400"
                          />
                          On the way to {b.startLocation?.name}...
                        </div>
                      )}

                      {/* Delivering indicator */}
                      {status === "delivering" && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium mb-3">
                          <Lottie
                            animationData={drivingAnimation}
                            loop={true}
                            className="h-14 w-14 shrink-0 bg-white rounded-full border border-2 border-indigo-400"
                          />
                          Delivering to {b.endLocation.name}...
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleViewDetails(b)}
                          className="flex-1"
                        >
                          View Details ({batchPackages.length})
                        </Button>

                        {/* Pickup phase actions */}
                        {status === "ready" && (
                          <Button
                            variant="outline"
                            onClick={() => handleStartPickup(b)}
                            disabled={hasActiveBatch || hasActiveDelivery}
                            className={`flex-1 ${hasActiveBatch || hasActiveDelivery ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            Start Pickup
                          </Button>
                        )}

                        {status === "ongoing" && (
                          <Button
                            variant="secondary"
                            onClick={() => handleSimulateArrival(b)}
                            className="flex-1"
                          >
                            Simulate Arrival
                          </Button>
                        )}

                        {status === "arrived" && (
                          <Button
                            variant="warning"
                            onClick={() => handleArrivedAndScan(b)}
                            className="flex-1"
                          >
                            {scannedBatches.has(b.batchNo)
                              ? "Confirm Pick Up"
                              : "Scan QR Code"}
                          </Button>
                        )}

                        {/* Delivery phase actions */}
                        {status === "todeliver" && (
                          <Button
                            variant="primary"
                            onClick={() => handleStartDelivery(b)}
                            disabled={hasActiveBatch || !!activeDeliveryBatchNo}
                            className={`flex-1 ${hasActiveBatch || !!activeDeliveryBatchNo ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Start Delivery
                          </Button>
                        )}
                        {status === "delivering" && (
                          <Button
                            variant="warning"
                            onClick={() => handleConfirmDelivered(b)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-5 w-5" />
                            Delivered
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      {mapEnlarged && allPendingTasks.length > 0 && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-indigo-500" />
              Route Map
            </h2>
            <button
              onClick={() => setMapEnlarged(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Close map"
            >
              <X size={20} />
            </button>
          </div>

          {/* Fullscreen Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[DRIVER_LOCATION.lat, DRIVER_LOCATION.lng]}>
                <Popup>📍 My Location</Popup>
              </Marker>
              {allPendingTasks.map((b) => {
                const isPickup = ["ready", "ongoing", "arrived"].includes(b.status.toLowerCase());
                const loc = isPickup ? b.startLocation : b.endLocation;
                return (
                  <Marker
                    key={b.batchNo}
                    position={[loc.lat, loc.lng]}
                  >
                    <Popup>
                      {isPickup ? "🏪" : "📦"} {b.batchNo} → {loc.name}
                    </Popup>
                  </Marker>
                );
              })}
              {allPendingTasks.map((b, idx) => {
                const isPickup = ["ready", "ongoing", "arrived"].includes(b.status.toLowerCase());
                const dest = isPickup ? b.startLocation : b.endLocation;
                let start;
                if (idx === 0) {
                  start = [DRIVER_LOCATION.lat, DRIVER_LOCATION.lng];
                } else {
                  const prev = allPendingTasks[idx - 1];
                  const prevIsPickup = ["ready", "ongoing", "arrived"].includes(prev.status.toLowerCase());
                  const prevLoc = prevIsPickup ? prev.startLocation : prev.endLocation;
                  start = [prevLoc.lat, prevLoc.lng];
                }
                const end = [dest.lat, dest.lng];
                return (
                  <RoutingMachine
                    key={`enlarged-route-${b.batchNo}`}
                    start={start}
                    end={end}
                    color={
                      isPickup
                        ? (b.status === "ongoing" ? "#f59e0b" : "#10b981")
                        : (b.status === "delivering" ? "#3b82f6" : "#6366f1")
                    }
                  />
                );
              })}
            </MapContainer>

            {/* Minimize button */}
            <button
              onClick={() => setMapEnlarged(false)}
              className="absolute bottom-4 right-4 z-500 p-2.5 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              title="Minimize map"
            >
              <Minimize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Pickup Flow Modals */}
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
          <DeliveryRouteModal
            isOpen={isDeliveryRouteModalOpen}
            onClose={() => setIsDeliveryRouteModalOpen(false)}
            batch={selectedBatch}
            packages={modalPackages}
            onStartDelivery={handleStartDeliveryFromModal}
          />
        </>
      )}

      {/* Details Modal */}
      {selectedBatch && (
        <DeliveryDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={closeModal}
          batch={selectedBatch}
          packages={modalPackages}
          isActionDisabled={hasActiveBatch || hasActiveDelivery}
          onStartPickup={(batch) => {
            setIsDetailsModalOpen(false);
            handleStartPickup(batch);
          }}
          onStartDelivery={handleStartDelivery}
          onConfirmDelivered={handleConfirmDelivered}
          showDeliverySuccess={showDeliverySuccess}
          qrPendingScan={qrPendingScan}
          onSimulateScan={handleSimulateScan}
          photoPending={photoPending}
          onSimulatePhoto={handleSimulatePhoto}
        />
      )}

      {/* Route Contact Info Modal */}
      {routeContactInfo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRouteContactInfo(null)}
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-[scaleIn_200ms_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {/* {routeContactInfo.batch.batchNo.startsWith("C") ? (
                  <User className="h-4 w-4 text-indigo-500" />
                ) : (
                  <Warehouse className="h-4 w-4 text-indigo-500" />
                )} */}
                Contact Info
              </h3>
              <button
                onClick={() => setRouteContactInfo(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div className="flex items-center text-sm text-gray-600">
                {routeContactInfo.batch.batchNo.startsWith("C") ? (
                  <User className="h-4 w-4 mr-2.5 text-indigo-400 shrink-0" />
                ) : (
                  <Warehouse className="h-4 w-4 mr-2.5 text-indigo-400 shrink-0" />
                )}
                <div>
                  <span className="text-gray-500 text-xs block">
                    {routeContactInfo.batch.batchNo.startsWith("C")
                      ? "Customer"
                      : "Warehouse"}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {routeContactInfo.batch.batchNo.startsWith("C")
                      ? routeContactInfo.packages.length > 0 &&
                        routeContactInfo.packages[0].customer
                        ? routeContactInfo.packages[0].customer.name
                        : "N/A"
                      : routeContactInfo.batch.endLocation.name}
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2.5 mt-0.5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs block">Phone</span>
                  <div className="space-y-0.5">
                    {routeContactInfo.batch.batchNo.startsWith("C") ? (
                      (() => {
                        const phones = [
                          ...new Set(
                            routeContactInfo.packages
                              .filter((p) => p.customer?.phone)
                              .map((p) => p.customer.phone),
                          ),
                        ];
                        return phones.length > 0 ? (
                          phones.map((ph, i) => (
                            <a
                              key={i}
                              href={`tel:${ph}`}
                              className="block font-semibold text-indigo-600 hover:underline"
                            >
                              {ph}
                            </a>
                          ))
                        ) : (
                          <span className="font-semibold text-gray-900">
                            N/A
                          </span>
                        );
                      })()
                    ) : (
                      <a
                        href={`tel:${routeContactInfo.batch.shopPhone}`}
                        className="font-semibold text-indigo-600 hover:underline"
                      >
                        {routeContactInfo.batch.shopPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2.5 mt-0.5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs block">Address</span>
                  <span className="font-semibold text-gray-900">
                    {routeContactInfo.batch.destination ||
                      routeContactInfo.batch.endLocation.name}
                  </span>
                </div>
              </div>

              {/* Batch badge */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Batch: </span>
                <span className="text-xs font-bold text-indigo-600">
                  {routeContactInfo.batch.batchNo}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirm}
        title={
          confirmAction?.type === "pickup" ? "Confirm Pickup" : "Start Delivery"
        }
        message={
          confirmAction?.type === "pickup"
            ? `Are you sure to go and pickup batch ${confirmAction?.batch?.batchNo}?`
            : confirmAction?.batch
              ? `Are you sure you want to start delivering batch ${confirmAction.batch.batchNo} to ${confirmAction.batch.endLocation?.name}?`
              : ""
        }
      />
    </div>
  );
};

export default Routes;
