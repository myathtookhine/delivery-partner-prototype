import React from "react";
import Lottie from "lottie-react";
import drivingAnimation from "../../assets/drivingAnimation.json";
import { Package } from "lucide-react";

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-br from-white via-indigo-50 to-indigo-100">
      {/* Lottie Animation */}
      <div className="w-64 h-64 md:w-80 md:h-80">
        <Lottie
          animationData={drivingAnimation}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Logo Text */}
      <div className="flex items-center gap-3 mt-2">
        <div className="bg-indigo-600 p-2 rounded-full shadow-lg">
          <Package className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Delivery Partner
        </h1>
      </div>

      {/* Loading dots */}
      <div className="mt-8 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
};

export default SplashScreen;
