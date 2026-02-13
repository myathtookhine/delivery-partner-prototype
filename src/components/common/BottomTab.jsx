import { Link, useLocation } from "react-router-dom";
import { Home, Package, Truck, User, ListCheck, Map } from "lucide-react";
import useStore from "../../store";

const tabs = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/deliveries", label: "Deliveries", icon: Truck },
  { path: "/routes", label: "Routes", icon: Map },
  { path: "/history", label: "History", icon: ListCheck },
  { path: "/profile", label: "Profile", icon: User },
];

const BottomTab = () => {
  const location = useLocation();

  // Get store data for activity indicators
  const pickups = useStore((state) => state.pickups);
  const activeDeliveryBatchNo = useStore(
    (state) => state.activeDeliveryBatchNo,
  );

  // Check for ongoing activity (actively driving)
  const hasOngoingPickups = pickups.some((p) => p.status === "ongoing");
  const hasOngoingDeliveries = pickups.some((p) => p.status === "delivering");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-0">
      <div className="flex justify-around items-center h-16 bg-white border border-white/30 rounded-t-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          const showIndicator =
            path === "/deliveries" &&
            (hasOngoingPickups || hasOngoingDeliveries);

          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 relative
                ${active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"}
              `}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  active ? "bg-indigo-100/60 scale-110" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className={`mt-0.5 ${active ? "font-semibold" : ""}`}>
                {label}
              </span>
              {active && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-500" />
              )}
              {showIndicator && (
                <span className="absolute top-0 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTab;
