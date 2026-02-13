import React, { useState, useEffect } from "react";
import { X, QrCode, AlertTriangle, CheckCircle, Package } from "lucide-react";
import Button from "../common/Button";
import ConfirmDialog from "../common/ConfirmDialog";

const ScannerModal = ({ isOpen, onClose, onFinishPickup, onScanDone, initialPhase = "scan", batch, packages }) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [phase, setPhase] = useState("scan"); // "scan" | "verify" | "success"
  const [isPickupConfirmOpen, setIsPickupConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimating(true);
      setPhase(initialPhase);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => {
        setAnimating(false);
        setScanError(null);
        setPhase("scan");
        setIsPickupConfirmOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !animating) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 300);
  };

  // Simulate QR scan → move to verify phase
  const handleSimulateScan = () => {
    setPhase("verify");
    if (onScanDone) onScanDone(batch);
  };

  // "Confirm to Pick Up" → open confirmation dialog
  const handleConfirmPickUp = () => {
    setIsPickupConfirmOpen(true);
  };

  // Confirmed in dialog → show success, then finish
  const handlePickupConfirmed = () => {
    setIsPickupConfirmOpen(false);
    setPhase("success");
  };

  // Cancel in dialog → close dialog, stay on verify phase
  const handlePickupCancelConfirm = () => {
    setIsPickupConfirmOpen(false);
  };

  // "Done" on success screen → finish pickup
  const handleDone = () => {
    if (onFinishPickup) {
      onFinishPickup(batch);
    }
  };

  // "Cancel" on verify phase → go back to parent (close scanner)
  const handleCancelVerify = () => {
    handleClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center">
        {/* Blur backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleClose}
        />

        {/* Modal container */}
        <div
          className={`relative z-10 bg-white w-full h-full lg:h-auto lg:max-h-[85vh] lg:w-full lg:max-w-md lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${
            visible
              ? "translate-y-0 lg:scale-100 opacity-100"
              : "translate-y-full lg:translate-y-0 lg:scale-95 opacity-0"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-900">
              {phase === "scan" && "Scan QR Code"}
              {phase === "verify" && "Confirm Pick Up"}
              {phase === "success" && "Pickup Complete"}
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* ─── SCAN PHASE ─── */}
            {phase === "scan" && (
              <>
                {/* Scanner area */}
                <div className="max-w-xs mx-auto mb-6">
                  <div className="qr-corners aspect-square bg-gray-900 rounded-xl overflow-hidden relative">
                    <div className="corner-bl absolute inset-0 pointer-events-none"></div>
                    <div className="corner-br absolute inset-0 pointer-events-none"></div>
                    <div className="scan-line"></div>
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <QrCode className="h-12 w-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">
                          Point camera at QR code
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {scanError && (
                  <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {scanError}
                  </div>
                )}

                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 max-w-xs mx-auto">
                    Scan the QR code at the pickup location for batch{" "}
                    <span className="font-semibold text-indigo-600">
                      {batch?.batchNo}
                    </span>
                    .
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="lg"
                  block
                  onClick={handleSimulateScan}
                >
                  Simulate Scan
                </Button>
              </>
            )}

            {/* ─── VERIFY PHASE ─── */}
            {phase === "verify" && (
              <>
                {/* Warning banner */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        Check Packages Carefully
                      </p>
                      <p className="text-xs text-amber-700">
                        Please verify that the physical packages match the list
                        below. Ensure all{" "}
                        <span className="font-semibold">
                          {packages?.length || 0} package(s)
                        </span>{" "}
                        are present and in good condition before confirming.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package list */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-sm text-gray-700 flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    Packages in <b className="font-bold">{batch?.batchNo}</b>
                  </h3>
                  {packages && packages.length > 0 ? (
                    <div className="space-y-2">
                      {packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg"
                        >
                          <img
                            src={`https://picsum.photos/seed/${pkg.id}/80/80`}
                            alt={pkg.id}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {pkg.id}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {pkg.weight} · {pkg.size}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No package details available.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ─── SUCCESS PHASE ─── */}
            {phase === "success" && (
              <>
              <div className="flex flex-col items-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                  Pick Up Confirmed!
                </h3>
                <p className="text-sm text-gray-600 text-center max-w-xs">
                  You have picked up the package(s). Now, they're ready to
                  deliver.
                </p>
                </div>
                {/* Package list */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-sm text-gray-700 flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    Packages in <b className="font-bold">{batch?.batchNo}</b>
                  </h3>
                  {packages && packages.length > 0 ? (
                    <div className="space-y-2">
                      {packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg"
                        >
                          <img
                            src={`https://picsum.photos/seed/${pkg.id}/80/80`}
                            alt={pkg.id}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {pkg.id}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {pkg.weight} · {pkg.size}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No package details available.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {phase === "verify" && (
            <div className="shrink-0 p-4 border-t border-gray-100 space-y-2">
              <Button
                variant="primary"
                size="lg"
                block
                onClick={handleConfirmPickUp}
              >
                Confirm to Pick Up
              </Button>
              <Button
                variant="secondary"
                size="lg"
                block
                onClick={handleCancelVerify}
              >
                Cancel
              </Button>
            </div>
          )}

          {phase === "success" && (
            <div className="shrink-0 p-4 border-t border-gray-100">
              <Button variant="primary" size="lg" block onClick={handleDone}>
                Done
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isPickupConfirmOpen}
        onClose={handlePickupCancelConfirm}
        onConfirm={handlePickupConfirmed}
        title="Confirm Pick Up"
        message="Are you sure the packages are correct and ready to pick up?"
      />
    </>
  );
};

export default ScannerModal;
