import React from "react";

const variantStyles = {
  primary:
    "bg-linear-to-b from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 shadow-sm",
  secondary:
    "bg-linear-to-b from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300",
  success:
    "bg-linear-to-b from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-sm",
  warning:
    "bg-linear-to-b from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-sm",
  info: "bg-linear-to-t from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700 shadow-sm",
  danger:
    "bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-sm",
  outline:
    "border border-indigo-600 text-indigo-600 hover:bg-gray-50 bg-transparent",
  ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-transparent",
};

const sizeStyles = {
  sm: "px-3 py-2 text-xs font-medium rounded-sm",
  md: "px-4 py-2.5 text-sm font-semibold rounded-md",
  lg: "px-4 py-3 text-sm font-semibold rounded-md",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  className = "",
  onClick,
  type = "button",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer";
  const width = block ? "w-full" : "";
  const disabledStyles = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "";

  const classes = [
    base,
    variantStyles[variant] || variantStyles.primary,
    sizeStyles[size] || sizeStyles.md,
    width,
    disabledStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
