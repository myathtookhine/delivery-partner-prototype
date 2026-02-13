import React from "react";
import { Package } from "lucide-react";

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-hoverColor to-blue-500 shadow-lg mb-2">
        <Package className="h-10 w-10 text-white" />
      </div>
      <h1 className="mt-4 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fromColor to-blue-600">
        Delivery Partner
      </h1>
      <p className="mt-2 text-secondaryStrongText font-medium">
        Sign in to your account
      </p>
    </div>
  );
};

export default LoginHeader;
