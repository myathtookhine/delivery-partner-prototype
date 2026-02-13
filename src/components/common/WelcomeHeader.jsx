import React, { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

const WelcomeHeader = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h1 className="text-neutral-800 text-lg lg:text-3xl font-medium tracking-tight">
            {greeting}, <span className="text-indigo-600">John Doe</span>
          </h1>
          <p className="text-gray-600 mt-1 text-xs lg:text-sm">
            Here's your delivery overview for today
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="ms-2 text-sm lg:text-md font-bold">{dateStr}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="ms-1.5 text-sm lg:text-md font-bold tabular-nums">
              {timeStr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;
