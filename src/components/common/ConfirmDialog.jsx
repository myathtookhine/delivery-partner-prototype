import React from "react";
import Button from "./Button";

const variantMap = {
  primary: "primary",
  danger: "danger",
  warning: "warning",
  success: "success",
  info: "info",
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Yes, I'm sure",
  cancelText = "No",
  variant = "primary",
  icon: Icon,
}) => {
  if (!isOpen) return null;

  const iconBgMap = {
    primary: "bg-indigo-100 text-indigo-600",
    danger: "bg-red-100 text-red-600",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-emerald-100 text-emerald-600",
    info: "bg-sky-100 text-sky-600",
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-[scaleIn_200ms_ease-out]">
        {Icon && (
          <div
            className={`mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center ${iconBgMap[variant] || iconBgMap.primary}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        )}
        <h3
          className={`text-lg font-bold text-gray-900 ${Icon ? "text-center" : ""} mb-2`}
        >
          {title}
        </h3>
        <p
          className={`text-sm text-gray-600 ${Icon ? "text-center" : ""} mb-6`}
        >
          {message}
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variantMap[variant] || "primary"}
            size="md"
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
