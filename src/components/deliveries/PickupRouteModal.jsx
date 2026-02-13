import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  X,
  ArrowRight,
  Calendar,
  Store,
  Map,
  Weight,
  Maximize,
  Expand,
  Phone,
  MapPin,
  Warehouse,
  User,
} from "lucide-react";
import Button from "../common/Button";

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

// Get icon config by batch prefix
const getBatchIcon = (batchNo) => {
  if (batchNo.startsWith("WH"))
    return { Icon: Warehouse, color: "text-violet-600", iconColor: "text-white", bg: "bg-gradient-to-br from-violet-500 to-violet-600" };
  if (batchNo.startsWith("C"))
    return { Icon: User, color: "text-sky-600", iconColor: "text-white", bg: "bg-gradient-to-br from-sky-500 to-sky-600" };
  return { Icon: Store, color: "text-orange-600", iconColor: "text-white", bg: "bg-gradient-to-br from-orange-500 to-orange-600" };
};

const PickupRouteModal = ({
  isOpen,
  onClose,
  batch,
  packages,
  onStartGoing,
}) => {
  const [mapEnlarged, setMapEnlarged] = useState(false);

  if (!isOpen || !batch) return null;

  const { startLocation, endLocation } = batch;
  const mapCenter = [
    (startLocation.lat + endLocation.lat) / 2,
    (startLocation.lng + endLocation.lng) / 2,
  ];

  const { Icon: BatchIcon, color: batchIconColor, iconColor: batchIconIconColor, bg: batchIconBg } = getBatchIcon(batch.batchNo);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <h2 className="text-lg font-bold text-gray-900">Pickup Route</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main content: side-by-side on desktop, stacked on mobile/tablet */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map: fixed top on mobile/tablet, fixed left on desktop */}
        <div
          className={`shrink-0 relative transition-all duration-300 ease-out lg:w-1/2 lg:h-full ${
            mapEnlarged ? "h-full" : "h-48"
          }`}
        >
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[startLocation.lat, startLocation.lng]}>
              <Popup>{startLocation.name}</Popup>
            </Marker>
            <Marker position={[endLocation.lat, endLocation.lng]}>
              <Popup>{endLocation.name}</Popup>
            </Marker>
          </MapContainer>

          {/* Enlarge/shrink button */}
          <button
            onClick={() => setMapEnlarged(!mapEnlarged)}
            className="lg:hidden absolute bottom-3 right-3 z-[500] p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            title={mapEnlarged ? "Shrink map" : "Enlarge map"}
          >
            <Expand
              className={`h-4 w-4 transition-transform ${mapEnlarged ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Right side: Way Info + Packages — scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin lg:w-1/2">
          <div className="p-4 space-y-4">
            {/* Pickup Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Pickup Info
              </h3>
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className={`p-1.5 rounded-lg me-2 ${batchIconBg}`}>
                    <BatchIcon className={`h-5 w-5 ${batchIconIconColor}`} />
                  </div>
                  <div className={`text-2xl font-bold me-2 ${batchIconColor}`}>
                    {batch.batchNo}
                  </div>
                  {batch.timeToPickup && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-gray-900 text-white">
                      {batch.timeToPickup}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                  <span className="text-gray-500 mr-1.5">Date</span>
                  <span className="font-semibold text-gray-900">
                    {batch.date}
                  </span>
                </div>

                {/* Pick Up From */}
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <span className="text-gray-500 block mb-1">
                      Pick Up From
                    </span>
                    <span className="font-semibold text-gray-900 block">
                      {batch.startLocation.name}
                    </span>
                    {batch.startLocation.address && (
                      <span className="text-xs text-gray-500 block mt-0.5">
                        {batch.startLocation.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-start text-sm text-gray-600">
                  <Map className="h-4 w-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <span className="text-gray-500 block mb-1">Route</span>
                    {batch.startTownship === batch.endTownship ? (
                      <span className="font-semibold text-gray-900">
                        Within {batch.startTownship}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-semibold text-gray-900 flex-wrap">
                        <span>{batch.startTownship}</span>
                          <ArrowRight className="h-4 w-4 text-gray-600" />
                        <span>{batch.endTownship}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Pickup Contact */}
                <div className="flex items-start text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <span className="text-gray-500 block mb-1">
                      Pickup Contact
                    </span>
                    <span className="font-semibold text-gray-900 block">
                      {batch.shopName}
                    </span>
                    <a
                      href={`tel:${batch.shopPhone}`}
                      className="text-indigo-600 hover:text-indigo-700 text-xs mt-0.5 inline-block"
                    >
                      {batch.shopPhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Package List */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Package List ({packages.length})
              </h3>
              <div className="space-y-2.5">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                  >
                    <img
                      src={`https://picsum.photos/seed/${pkg.id}/80/80`}
                      alt={pkg.id}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {pkg.id}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Weight className="h-3 w-3" />
                          {pkg.weight}
                        </span>
                        <span className="flex items-center gap-1">
                          <Maximize className="h-3 w-3" />
                          {pkg.size}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="shrink-0 p-4 border-t border-gray-100 bg-white flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={() => onStartGoing(batch)}
          className="flex-1"
        >
          Start Going
        </Button>
      </div>
    </div>
  );
};

export default PickupRouteModal;
