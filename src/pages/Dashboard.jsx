import React, { useMemo, useState } from "react";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  Store,
  Navigation,
  ChevronRight,
  Expand,
  Minimize,
  X,
  Warehouse,
  User,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Lottie from "lottie-react";
import drivingAnimation from "../assets/drivingAnimation.json";
import useStore from "../store";
import RoutingMachine from "../components/RoutingMachine";
import StatCard from "../components/common/StatCard";
import Button from "../components/common/Button";
import WelcomeHeader from "../components/common/WelcomeHeader";

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

const DRIVER_LOCATION = { name: "My Location", lat: 16.8, lng: 96.15 };

const Dashboard = () => {
  const navigate = useNavigate();
  const pickups = useStore((state) => state.pickups);
  const packages = useStore((state) => state.packages);
  const [mapEnlarged, setMapEnlarged] = useState(false);
  const updatePickupStatus = useStore((state) => state.updatePickupStatus);

  const getBatchTypeInfo = (batchNo) => {
    if (batchNo.startsWith("WH"))
      return {
        label: "Warehouse",
        icon: Warehouse,
        color: "text-violet-600",
        bg: "bg-gradient-to-br from-violet-500 to-violet-600",
        border: "border-violet-200",
        idColor: "text-violet-700",
      };
    if (batchNo.startsWith("C"))
      return {
        label: "Customer",
        icon: User,
        color: "text-sky-600",
        bg: "bg-gradient-to-br from-sky-500 to-sky-600",
        border: "border-sky-200",
        idColor: "text-sky-700",
      };
    return {
      label: "Business",
      icon: Store,
      color: "text-orange-600",
      bg: "bg-gradient-to-br from-orange-500 to-orange-600",
      border: "border-orange-200",
      idColor: "text-orange-700",
    };
  };

  const handleSimulateArrival = (batch) => {
    updatePickupStatus(batch.batchNo, "arrived");
  };

  // Active batch: only batches with an active process (driving/arrived)
  const activeBatch = useMemo(() => {
    // Priority: delivering > ongoing > arrived
    const delivering = pickups.find(
      (b) => b.status.toLowerCase() === "delivering",
    );
    if (delivering) return delivering;
    const ongoing = pickups.find((b) => b.status.toLowerCase() === "ongoing");
    if (ongoing) return ongoing;
    const arrived = pickups.find((b) => b.status.toLowerCase() === "arrived");
    if (arrived) return arrived;
    return null;
  }, [pickups]);

  const activeBatchPackages = useMemo(() => {
    if (!activeBatch) return [];
    return packages.filter((p) => p.batchNo === activeBatch.batchNo);
  }, [activeBatch, packages]);

  // Map center based on active batch phase
  const mapCenter = useMemo(() => {
    if (activeBatch) {
      const status = activeBatch.status.toLowerCase();
      const isPickupPhase = ["ongoing", "arrived"].includes(status);
      if (isPickupPhase) {
        return [activeBatch.startLocation.lat, activeBatch.startLocation.lng];
      }
      return [activeBatch.endLocation.lat, activeBatch.endLocation.lng];
    }
    return [DRIVER_LOCATION.lat, DRIVER_LOCATION.lng];
  }, [activeBatch]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "arrived":
        return "bg-purple-100 text-purple-800";
      case "todeliver":
        return "bg-yellow-100 text-yellow-800";
      case "delivering":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ongoing":
        return "On The Way";
      case "arrived":
        return "Arrived";
      case "todeliver":
        return "Picked Up";
      case "delivering":
        return "Delivering";
      default:
        return status;
    }
  };

  const stats = [
    {
      id: 1,
      title: "Pending Deliveries",
      value: pickups.filter((p) =>
        ["ready", "ongoing", "arrived", "todeliver", "delivering"].includes(
          p.status.toLowerCase(),
        ),
      ).length,
      icon: <Clock className="h-6 w-6 text-orange-500" />,
    },
    {
      id: 2,
      title: "Completed Today",
      value: pickups.filter((p) => p.status.toLowerCase() === "delivered")
        .length,
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    },
    {
      id: 3,
      title: "Total Packages",
      value: packages.length,
      icon: <Package className="h-6 w-6 text-blue-500" />,
    },
    {
      id: 4,
      title: "Total Distance",
      value: "45 km",
      icon: <MapPin className="h-6 w-6 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-4">
      <WelcomeHeader />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>

      {/* Active Batch Card + Map */}
      {activeBatch && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left: Active Batch Card */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-indigo-500" />
                  {(() => {
                    const s = activeBatch.status.toLowerCase();
                    if (s === "ongoing") return "Going to Pickup";
                    if (s === "arrived") return "Arrived at Pickup Place";
                    if (s === "delivering") return "Currently Delivering";
                    return "Next Delivery";
                  })()}
                </h3>
                {(() => {
                  const typeInfo = getBatchTypeInfo(activeBatch.batchNo);
                  const TypeIcon = typeInfo.icon;
                  return (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeInfo.bg} ${typeInfo.border} border text-white`}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      {typeInfo.label}
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 flex-1 bg-linear-to-b from-yellow-50 to-zinc-50">
                {(() => {
                  const status = activeBatch.status.toLowerCase();
                  const isPickupPhase = ["ongoing", "arrived"].includes(status);
                  const isDelivering = status === "delivering";
                  const isOngoing = status === "ongoing";
                  const targetLocation = isPickupPhase
                    ? activeBatch.startLocation
                    : activeBatch.endLocation;
                  const contactName = isPickupPhase
                    ? activeBatch.shopName
                    : activeBatch.destinationName;
                  const contactPhone = isPickupPhase
                    ? activeBatch.shopPhone
                    : activeBatch.destinationPhone;

                  return (
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          {(() => {
                            const typeInfo = getBatchTypeInfo(activeBatch.batchNo);
                            const TypeIcon = typeInfo.icon;
                            return (
                              <div className={`p-1.5 rounded-lg ${typeInfo.bg}`}>
                                <TypeIcon className="h-5 w-5 text-white" />
                              </div>
                            );
                          })()}
                          <div
                            className={`text-xl font-bold ${getBatchTypeInfo(activeBatch.batchNo).idColor} flex items-center gap-2`}
                          >
                            {activeBatch.batchNo}
                            {activeBatch.timeToPickup && isPickupPhase && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gray-900 text-white">
                                {activeBatch.timeToPickup}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${getStatusBadge(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      {/* Location info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 mr-2 shrink-0" />
                          <span className="text-sm font-medium">
                            {targetLocation.name}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Store className="h-3.5 w-3.5 text-gray-400 mr-2 shrink-0" />
                          <span className="text-sm flex items-center gap-1 flex-wrap">
                            <span>{activeBatch.startTownship}</span>
                            <ArrowRight className="h-4 w-4 text-gray-600" />
                            <span>{activeBatch.endTownship}</span>
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="h-3.5 w-3.5 text-gray-400 mr-2 shrink-0" />
                          <span className="text-sm">
                            {activeBatchPackages.length} package(s)
                          </span>
                        </div>
                        {/* Contact */}
                        {contactName && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3.5 w-3.5 text-gray-400 mr-2 shrink-0" />
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium">{contactName}</span>
                              {contactPhone && (
                                <>
                                  <span>-</span>
                                  <a
                                    href={`tel:${contactPhone}`}
                                    className="text-indigo-600 font-bold hover:underline"
                                  >
                                    {contactPhone}
                                  </a>
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Ongoing — driving to pickup */}
                      {isOngoing && (
                        <>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium mb-3">
                            <div className="w-20 h-20 shrink-0">
                              <Lottie
                                animationData={drivingAnimation}
                                loop
                                autoplay
                                className="h-full w-full shrink-0 bg-white rounded-full border border-2 border-indigo-400"
                              />
                            </div>
                            On the way to {activeBatch.startLocation.name}...
                          </div>
                          <Button
                            variant="secondary"
                            size="md"
                            block
                            onClick={() => handleSimulateArrival(activeBatch)}
                          >
                            Simulate Arrival
                          </Button>
                        </>
                      )}

                      {/* Arrived at pickup */}
                      {status === "arrived" && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium">
                          <MapPin className="h-5 w-5 shrink-0" />
                          Arrived at {activeBatch.startLocation.name}
                        </div>
                      )}

                      {/* Delivering */}
                      {isDelivering && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
                          <div className="w-20 h-20 shrink-0">
                            <Lottie
                              animationData={drivingAnimation}
                              loop
                              autoplay
                              className="h-full w-full shrink-0 bg-white rounded-full border border-2 border-indigo-400"
                            />
                          </div>
                          Delivering to {activeBatch.endLocation.name}...
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Footer button */}
              <div className="p-4 border-t border-gray-100">
                <Button
                  variant="primary"
                  size="md"
                  block
                  onClick={() => {
                    const s = activeBatch.status.toLowerCase();
                    if (["ongoing", "arrived"].includes(s)) {
                      navigate("/deliveries");
                    } else {
                      navigate("/routes");
                    }
                  }}
                >
                  <Navigation className="h-4 w-4" />
                  {["ongoing", "arrived"].includes(
                    activeBatch.status.toLowerCase(),
                  )
                    ? "Go to Deliveries"
                    : "View All Deliveries"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
              <MapContainer
                center={mapCenter}
                zoom={13}
                className="h-[320px] lg:h-[420px] w-full"
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
                {/* Target destination marker */}
                {(() => {
                  const s = activeBatch.status.toLowerCase();
                  const isPickupPhase = ["ongoing", "arrived"].includes(s);
                  const target = isPickupPhase
                    ? activeBatch.startLocation
                    : activeBatch.endLocation;
                  return (
                    <>
                      <Marker position={[target.lat, target.lng]}>
                        <Popup>
                          📦 {activeBatch.batchNo} → {target.name}
                        </Popup>
                      </Marker>
                      <RoutingMachine
                        start={[DRIVER_LOCATION.lat, DRIVER_LOCATION.lng]}
                        end={[target.lat, target.lng]}
                        color={
                          ["delivering", "ongoing"].includes(s)
                            ? "#3b82f6"
                            : "#6366f1"
                        }
                      />
                    </>
                  );
                })()}
              </MapContainer>
              {/* Enlarge map button */}
              <button
                onClick={() => setMapEnlarged(true)}
                className="absolute bottom-3 right-3 z-500 p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                title="Enlarge map"
              >
                <Expand className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State — no active batches at all */}
      {!activeBatch && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-12 text-center">
            <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Truck className="h-12 w-12 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No Active Deliveries
            </h3>
            <p className="text-gray-600 text-sm mb-1">
              You don't have any ongoing pickups or deliveries at the moment.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Head to the deliveries page to start your delivery journey!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/deliveries")}
            >
              <Package className="h-4 w-4" />
              Go to Deliveries
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Map Modal */}
      {mapEnlarged && activeBatch && (
        <div className="fixed inset-0 z-9999 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-indigo-500" />
              {["ongoing", "arrived"].includes(activeBatch.status.toLowerCase())
                ? "Pickup Route Map"
                : "Delivery Route Map"}
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
              zoom={13}
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
              {(() => {
                const s = activeBatch.status.toLowerCase();
                const isPickupPhase = ["ongoing", "arrived"].includes(s);
                const target = isPickupPhase
                  ? activeBatch.startLocation
                  : activeBatch.endLocation;
                return (
                  <>
                    <Marker position={[target.lat, target.lng]}>
                      <Popup>
                        📦 {activeBatch.batchNo} → {target.name}
                      </Popup>
                    </Marker>
                    <RoutingMachine
                      start={[DRIVER_LOCATION.lat, DRIVER_LOCATION.lng]}
                      end={[target.lat, target.lng]}
                      color={
                        ["delivering", "ongoing"].includes(s)
                          ? "#3b82f6"
                          : "#6366f1"
                      }
                    />
                  </>
                );
              })()}
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
    </div>
  );
};

export default Dashboard;
