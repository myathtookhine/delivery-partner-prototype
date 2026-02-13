import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Package,
  Home,
  Truck,
  User,
  LogOut,
  Bell,
  ListCheck,
  X,
  CheckCheck,
  MapPin,
  AlertCircle,
  Clock,
  PackageCheck,
  Map,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import useStore from "../../store";

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "pickup",
    title: "New Pickup Request",
    message: "Batch B006 from Home Décor Plus is ready for pickup.",
    time: "2 min ago",
    read: false,
    icon: Package,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    id: 2,
    type: "delivery",
    title: "Delivery Confirmed",
    message: "Batch C004 has been delivered successfully to 222 Banyan St.",
    time: "15 min ago",
    read: false,
    icon: PackageCheck,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    id: 3,
    type: "alert",
    title: "Route Change Alert",
    message:
      "Traffic detected on your route to Hledan Warehouse. Consider alternate route.",
    time: "32 min ago",
    read: false,
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    id: 4,
    type: "pickup",
    title: "Pickup Reminder",
    message:
      "Batch WH005 from Tamwe Warehouse is waiting. Please proceed to pickup.",
    time: "1 hr ago",
    read: true,
    icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    id: 5,
    type: "location",
    title: "Arrived at Destination",
    message: "You've arrived at Kamayut Warehouse for Batch B007 pickup.",
    time: "2 hrs ago",
    read: true,
    icon: MapPin,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: 6,
    type: "delivery",
    title: "Delivery Completed",
    message:
      "Batch B005 delivered to Hledan Warehouse. Customer rated 5 stars!",
    time: "3 hrs ago",
    read: true,
    icon: PackageCheck,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    id: 7,
    type: "alert",
    title: "Schedule Update",
    message:
      "Tomorrow's pickup schedule has been updated. 4 new batches assigned.",
    time: "5 hrs ago",
    read: true,
    icon: AlertCircle,
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
];

const Header = ({ onLogout }) => {
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const notiRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get store data for activity indicators
  const pickups = useStore((state) => state.pickups);
  const activeDeliveryBatchNo = useStore(
    (state) => state.activeDeliveryBatchNo,
  );

  // Check for ongoing activity (actively driving)
  const hasOngoingPickups = pickups.some((p) => p.status === "ongoing");
  const hasOngoingDeliveries = pickups.some((p) => p.status === "delivering");

  // Scroll-to-bottom loading simulation
  const handleNotiScroll = useCallback(
    (e) => {
      if (loadingMore) return;
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop - clientHeight < 10) {
        setLoadingMore(true);
        setTimeout(() => setLoadingMore(false), 1500);
      }
    },
    [loadingMore],
  );

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-linear-to-t from-fromColor to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo & Label */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2 lg:mr-12">
              <div className="bg-white p-1.5 rounded-full">
                <Package className="h-6 w-6 text-fromColor" />
              </div>
              <span className="font-bold text-sm tracking-tight uppercase">
                Delivery Partner
              </span>
            </div>

            {/* Desktop nav links — hidden on mobile/tablet */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${isActive("/dashboard") ? "text-white" : "text-white/70 hover:text-white"}`}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>

              <Link
                to="/deliveries"
                className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 relative ${isActive("/deliveries") ? "text-white" : "text-white/70 hover:text-white"}`}
              >
                <Truck className="h-4 w-4" />
                Deliveries
                {(hasOngoingPickups || hasOngoingDeliveries) && (
                  <span className="absolute top-0.5 right-0 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </Link>

              <Link
                to="/routes"
                className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 relative ${isActive("/routes") ? "text-white" : "text-white/70 hover:text-white"}`}
              >
                <Map className="h-4 w-4" />
                Routes
              </Link>

              <Link
                to="/history"
                className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${isActive("/history") ? "text-white" : "text-white/70 hover:text-white"}`}
              >
                <ListCheck className="h-4 w-4" />
                History
              </Link>

              <Link
                to="/profile"
                className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 ${isActive("/profile") ? "text-white" : "text-white/70 hover:text-white"}`}
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
            </nav>
          </div>

          {/* Right side: Notification + Logout */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notiRef}>
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="p-1.5 lg:px-3 lg:py-1.5 rounded-md text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 cursor-pointer relative"
              >
                <Bell className="h-5 w-5 lg:h-4 lg:w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 lg:top-0.5 lg:right-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-indigo-700">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Desktop/Tablet dropdown */}
              {showNotifications && (
                <div className="hidden md:block absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div
                    className="max-h-[400px] overflow-y-auto divide-y divide-gray-50"
                    onScroll={handleNotiScroll}
                  >
                    {notifications.map((noti) => {
                      const NotiIcon = noti.icon;
                      return (
                        <button
                          key={noti.id}
                          onClick={() => markAsRead(noti.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            !noti.read ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl ${noti.bg} shrink-0 mt-0.5`}
                          >
                            <NotiIcon className={`h-4 w-4 ${noti.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-medium truncate ${!noti.read ? "text-gray-900" : "text-gray-600"}`}
                              >
                                {noti.title}
                              </p>
                              {!noti.read && (
                                <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {noti.message}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {noti.time}
                            </p>
                          </div>
                        </button>
                      );
                    })}

                    {/* Loading spinner at bottom */}
                    {loadingMore && (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <span className="h-4 w-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="text-xs text-gray-400">
                          Loading more...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center p-1.5 lg:px-3 lg:py-1.5 rounded-md text-sm font-medium text-white/70 hover:text-white transition-colors duration-200 gap-1.5 cursor-pointer"
            >
              <LogOut className="h-5 w-5 lg:h-4 lg:w-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile fullscreen notification modal */}
      {showNotifications && (
        <div className="md:hidden fixed inset-0 z-[9999] bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-indigo-500 font-medium"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Read all
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div
            className="flex-1 overflow-y-auto divide-y divide-gray-50"
            onScroll={handleNotiScroll}
          >
            {notifications.map((noti) => {
              const NotiIcon = noti.icon;
              return (
                <button
                  key={noti.id}
                  onClick={() => markAsRead(noti.id)}
                  className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors ${
                    !noti.read ? "bg-indigo-50/40" : ""
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${noti.bg} shrink-0 mt-0.5`}
                  >
                    <NotiIcon className={`h-5 w-5 ${noti.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${!noti.read ? "text-gray-900" : "text-gray-600"}`}
                      >
                        {noti.title}
                      </p>
                      {!noti.read && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {noti.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{noti.time}</p>
                  </div>
                </button>
              );
            })}

            {/* Loading spinner at bottom */}
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 py-5">
                <span className="h-5 w-5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm text-gray-400">Loading more...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout();
        }}
        title="Log Out"
        message="Are you sure you want to log out?"
      />
    </header>
  );
};

export default Header;
