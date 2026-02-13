import React from 'react';
import { Package, Mail, Phone, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-linear-to-r from-fromGray to-toGray text-white py-6 mt-auto shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="bg-linear-to-r from-hoverColor to-blue-500 p-1.5 rounded-full shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight uppercase">
              Delivery Partner
            </span>
          </div>

          <div className="flex space-x-6">
            <a
              href="#"
              className="flex items-center space-x-1 text-text-gray hover:text-white transition-colors duration-200"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm">Contact</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 text-text-gray hover:text-white transition-colors duration-200"
            >
              <Phone className="h-4 w-4" />
              <span className="text-sm">Support</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 text-text-gray hover:text-white transition-colors duration-200"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">Help Center</span>
            </a>
          </div>

          <div className="text-secondaryText text-sm">
            <p>
              &copy; {new Date().getFullYear()} DeliveryPartner. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;