import React, { useState, useEffect } from "react";
import {
  X,
  Weight,
  Maximize,
  ArrowRight,
  Calendar,
  Hash,
  Store,
  Map,
  PackageCheck,
  Truck,
  CheckCircle,
  Phone,
  User,
  Warehouse,
  MapPin,
  QrCode,
  ScanLine,
  Camera,
  ImagePlus,
} from "lucide-react";
import Button from "../common/Button";
import sampleQr from "../../assets/sample-qr.png";

const DeliveryDetailsModal = ({
  isOpen,
  onClose,
  batch,
  packages,
  onStartPickup,
  onStartDelivery,
  onConfirmDelivered,
  showDeliverySuccess,
  showPickupSuccess,
  qrPendingScan,
  onSimulateScan,
  photoPending,
  onSimulatePhoto,
  isActionDisabled,
}) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !animating) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const status = batch?.status?.toLowerCase();
  const isPickupPhase = ["ready", "ongoing", "arrived"].includes(status);
  const isCompleted = status === "delivered" && !qrPendingScan && !photoPending && !showDeliverySuccess;

  const getStatusInfo = () => {
    switch (status) {
      case "ready":
        return { label: "Ready", color: "bg-emerald-100 text-emerald-800" };
      case "ongoing":
        return { label: "On the Way", color: "bg-blue-100 text-blue-800" };
      case "arrived":
        return { label: "Arrived", color: "bg-amber-100 text-amber-800" };
      case "todeliver":
        return { label: "Picked Up", color: "bg-yellow-100 text-yellow-800" };
      case "delivering":
        return { label: "Delivering", color: "bg-blue-100 text-blue-800" };
      case "delivered":
        return { label: "Delivered", color: "bg-green-100 text-green-800" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const statusInfo = getStatusInfo();

  // Show "Start Pickup" for ready, "Start Delivery" for pickedup, "Confirm Delivered" for delivering
  const showStartPickup = status === "ready";
  const showStartDelivery = status === "todeliver";
  const showConfirmDelivered = status === "delivering";
  const showFooter = !isCompleted && (showStartPickup || showStartDelivery || showConfirmDelivered || qrPendingScan || photoPending || showDeliverySuccess);

  return (
    <div className="fixed inset-0 z-9999 flex items-end lg:items-center justify-center">
      {/* Blur backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal container */}
      <div
        className={`relative z-10 bg-white w-full h-full lg:h-auto lg:max-h-[90vh] lg:w-full lg:max-w-lg lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          visible
            ? "translate-y-0 lg:scale-100 opacity-100"
            : "translate-y-full lg:translate-y-0 lg:scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {isCompleted ? "Delivery Details" : isPickupPhase ? "Pick Up Details" : "Delivery Details"}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className={`flex-1 overflow-y-auto p-4 ${showFooter ? "pb-24" : "pb-6"}`}>
          {/* QR Code pending scan - for shop/warehouse batches */}
          {qrPendingScan && (
            <div className="mb-5 p-5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-amber-100 mb-3">
                  <img
                    src={sampleQr}
                    alt="QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <p className="text-sm font-semibold text-amber-900 mt-1">
                  Show this QR code to{" "}
                  <span className="text-indigo-600">
                    {batch.endLocation.name}
                  </span>
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  They will scan this code to confirm the delivery.
                </p>
              </div>
            </div>
          )}

          {/* Photo capture pending - for customer batches */}
          {photoPending && (
            <div className="mb-5 p-5 bg-sky-50 border border-sky-200 rounded-xl">
              <div className="flex flex-col items-center text-center">
                <div className="p-5 bg-white rounded-2xl shadow-sm border border-sky-100 mb-3">
                  <Camera
                    className="h-16 w-16 text-sky-600"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm font-semibold text-sky-900 mt-1">
                  Take a photo of the delivered packages
                </p>
                <p className="text-xs text-sky-700 mt-1">
                  Please capture a clear photo of the package(s) at the
                  customer's location as proof of delivery.
                </p>
                {/* Mock camera area */}
                <div className="w-full mt-4 rounded-xl border-2 border-dashed border-sky-300 bg-sky-50/50 p-6 flex flex-col items-center gap-2">
                  <div className="p-3 bg-sky-100 rounded-full">
                    <ImagePlus className="h-8 w-8 text-sky-500" />
                  </div>
                  <p className="text-xs text-sky-600 font-medium">
                    Tap to take a photo
                  </p>
                  <p className="text-[10px] text-sky-500">
                    Photo will be attached as delivery proof
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delivery success message - shown after QR scan or photo */}
          {showDeliverySuccess && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <PackageCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800">
                Delivery confirmed! The package(s) have been delivered
                successfully.
              </p>
            </div>
          )}

          {/* Pickup success message */}
          {showPickupSuccess && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <PackageCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800">
                You have picked up the package(s). Now, they're ready to
                deliver. Please check the contact info and address below!
              </p>
            </div>
          )}

          {/* Completed delivery banner */}
          {isCompleted && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <PackageCheck className="h-6 w-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Delivery Completed
                </p>
                {batch.completedAt && (
                  <p className="text-xs text-green-600 mt-0.5">
                    {new Date(batch.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Completed: show BOTH Pickup + Delivery info ── */}
          {isCompleted ? (
            <>
              {/* Pickup Info */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pickup Info
                </h3>
                <div className="space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center text-sm text-gray-600">
                    {batch.batchNo.startsWith("WH") ? (
                      <Warehouse className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                    ) : (
                      <Store className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-gray-500 text-xs block">Pick Up From</span>
                      <span className="font-semibold text-gray-900">
                        {batch.shopName || batch.startLocation.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs block">Phone</span>
                      <a
                        href={`tel:${batch.shopPhone}`}
                        className="block font-semibold text-indigo-600 hover:underline"
                      >
                        {batch.shopPhone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs block">Address</span>
                      <span className="font-semibold text-gray-900">
                        {batch.startLocation.address || batch.startLocation.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Delivery Info
                </h3>
                <div className="space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="flex items-center text-sm text-gray-600">
                    {batch.batchNo.startsWith("C") ? (
                      <User className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                    ) : batch.batchNo.startsWith("WH") ? (
                      <Warehouse className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                      ) : (
                        <Store className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-gray-500 text-xs block">
                        {batch.batchNo.startsWith("C")
                          ? "Customer"
                          : batch.batchNo.startsWith("WH")
                            ? "Warehouse"
                            : "Destination"}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {batch.destinationName || batch.endLocation.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs block">Phone</span>
                      <a
                        href={`tel:${batch.destinationPhone}`}
                        className="block font-semibold text-indigo-600 hover:underline"
                      >
                        {batch.destinationPhone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs block">Address</span>
                      <span className="font-semibold text-gray-900">
                        {batch.endLocation.address || batch.destination || batch.endLocation.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Non-completed: show single Contact Info section ── */
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Contact Info
              </h3>
              <div className="space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                {/* Name */}
                <div className="flex items-center text-sm text-gray-600">
                  {isPickupPhase ? (
                    batch.batchNo.startsWith("WH") ? (
                      <Warehouse className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                    ) : (
                      <Store className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                    )
                  ) : batch.batchNo.startsWith("C") ? (
                    <User className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                  ) : batch.batchNo.startsWith("WH") ? (
                    <Warehouse className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                  ) : (
                      <Store className="h-4 w-4 mr-2 text-indigo-400 shrink-0" />
                    )}
                    <div>
                      <span className="text-gray-500 text-xs block">
                        {isPickupPhase
                          ? "Pick Up From"
                          : batch.batchNo.startsWith("C")
                            ? "Customer"
                            : batch.batchNo.startsWith("WH")
                              ? "Warehouse"
                              : "Destination"}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {isPickupPhase
                          ? batch.shopName || batch.startLocation.name
                          : batch.destinationName || batch.endLocation.name}
                      </span>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-start text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs block">Phone</span>
                      <div className="space-y-0.5">
                        {isPickupPhase ? (
                          <a
                            href={`tel:${batch.shopPhone}`}
                            className="block font-semibold text-indigo-600 hover:underline"
                          >
                            {batch.shopPhone}
                          </a>
                        ) : (
                          <a
                            href={`tel:${batch.destinationPhone}`}
                            className="block font-semibold text-indigo-600 hover:underline"
                          >
                            {batch.destinationPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Address */}
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs block">Address</span>
                      <span className="font-semibold text-gray-900">
                        {isPickupPhase
                          ? batch.startLocation.address || batch.startLocation.name
                          : batch.endLocation.address ||
                          batch.destination ||
                          batch.endLocation.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Way Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Way Info
            </h3>
            <div className="space-y-3 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Hash className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                  <span className="text-gray-500 mr-1.5">Batch No.</span>
                  <span className="font-semibold text-gray-900">
                    {batch.batchNo}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize ${statusInfo.color}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                <span className="text-gray-500 mr-1.5">Date</span>
                <span className="font-semibold text-gray-900">
                  {batch.date}
                </span>
              </div>
              <div className="flex items-start text-sm text-gray-600">
                <Store className="h-4 w-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                <div>
                  <span className="text-gray-500 block mb-1">
                    {isPickupPhase ? "Pick Up From → To" : "Deliver From → To"}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-gray-900 flex-wrap">
                    <span>{batch.startLocation.name}</span>
                    <ArrowRight className="h-4 w-4 text-gray-600" />
                    <span>{batch.endLocation.name}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Map className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                {batch.startTownship === batch.endTownship ? (
                  <span className="font-semibold text-gray-900">
                    Within {batch.startTownship}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-semibold text-gray-900 flex-wrap">
                    <span>{batch.startTownship}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{batch.endTownship}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Package list */}
          <div className="space-y-2.5 mt-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Package List ({packages.length})
            </h3>
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

          {/* Simulate QR Scan button - only for shop/warehouse batches awaiting scan */}
          {qrPendingScan && (
            <Button
              variant="secondary"
              size="lg"
              block
              onClick={onSimulateScan}
              className="mt-4"
            >
              <ScanLine className="h-4 w-4" />
              Simulate QR Scan
            </Button>
          )}

          {/* Simulate Photo Capture button - only for customer batches awaiting photo */}
          {photoPending && (
            <Button
              variant="secondary"
              size="lg"
              block
              onClick={onSimulatePhoto}
              className="mt-4"
            >
              <Camera className="h-4 w-4" />
              Simulate Photo Capture
            </Button>
          )}
        </div>

        {/* Fixed bottom bar */}
        {(showFooter || isCompleted) && (
          <div className="shrink-0 p-4 border-t border-gray-100 bg-white">
            {qrPendingScan && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-600">
                <QrCode className="h-4 w-4" />
                Waiting for QR scan...
              </div>
            )}
            {photoPending && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-sky-600">
                <Camera className="h-4 w-4" />
                Waiting for photo capture...
              </div>
            )}
            {status === "delivered" && showDeliverySuccess && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="h-4 w-4" />
                Delivered Successfully
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="h-4 w-4" />
                Delivered Successfully
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDetailsModal;
