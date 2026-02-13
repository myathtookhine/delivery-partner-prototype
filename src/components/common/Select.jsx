import React from "react";
import { ChevronDown } from "lucide-react";

const Select = ({
  id,
  name,
  label,
  icon: Icon,
  error,
  options = [],
  placeholder = "Select an option",
  containerClassName = "",
  className = "",
  labelAddon,
  disabled,
  ...props
}) => {
  const baseClasses =
    "w-full pr-9 py-2.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 transition-all duration-200 appearance-none cursor-pointer";
  const stateClasses = error
    ? "border-red-300 focus:ring-red-500/20 focus:border-red-400"
    : "border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-300";
  const disabledClasses = disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "";
  const iconClasses = Icon ? "pl-10" : "pl-3";

  return (
    <div className={containerClassName}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={id || name}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          {labelAddon}
        </div>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4.5 w-4.5 text-gray-400" />
          </div>
        )}
        <select
          id={id || name}
          name={name}
          disabled={disabled}
          className={`${baseClasses} ${stateClasses} ${disabledClasses} ${iconClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) =>
            typeof opt === "string" ? (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ) : (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ),
          )}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Select;
