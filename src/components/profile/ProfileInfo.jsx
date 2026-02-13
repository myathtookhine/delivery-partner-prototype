import React from "react";
import { User, Mail, Phone, MapPin, Truck } from "lucide-react";
import Button from "../common/Button";
import Input from "../common/Input";
import Textarea from "../common/Textarea";
import Select from "../common/Select";

const VEHICLE_OPTIONS = [
  "Sedan",
  "SUV",
  "Van",
  "Pickup Truck",
  "Motorcycle",
  "Bicycle",
  "Scooter",
];

const ProfileInfo = ({
  userData,
  isEditing,
  setIsEditing,
  handleInputChange,
  onSave,
  onCancel,
}) => {
  const renderDisplayField = (label, value, Icon) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="flex items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
        {Icon ? (
          <Icon className="h-4.5 w-4.5 text-indigo-500 mr-3 shrink-0" />
        ) : (
          <div className="h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded mr-3 shrink-0">
            LP
          </div>
        )}
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Full Name"
                name="name"
                icon={User}
                value={userData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                value={userData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                icon={Phone}
                value={userData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
              <Input
                label="License Plate"
                name="licensePlate"
                value={userData.licensePlate}
                onChange={handleInputChange}
                placeholder="e.g. ABC-1234"
              />
              <Select
                label="Vehicle Type"
                name="vehicleType"
                icon={Truck}
                value={userData.vehicleType}
                onChange={handleInputChange}
                options={VEHICLE_OPTIONS}
                placeholder="Select vehicle type"
              />
              <Textarea
                label="Address"
                name="address"
                icon={MapPin}
                value={userData.address}
                onChange={handleInputChange}
                placeholder="Enter your full address"
                rows={3}
                containerClassName="md:col-span-2"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {renderDisplayField("Full Name", userData.name, User)}
              {renderDisplayField("Email Address", userData.email, Mail)}
              {renderDisplayField("Phone Number", userData.phone, Phone)}
              {renderDisplayField("License Plate", userData.licensePlate, null)}
              {renderDisplayField("Vehicle Type", userData.vehicleType, Truck)}
              <div className="md:col-span-2">
                {renderDisplayField("Address", userData.address, MapPin)}
              </div>
            </div>
          )}

          <div className="flex justify-start">
            {isEditing ? (
              <div className="flex space-x-3">
                <Button variant="outline" size="md" onClick={onCancel}>
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={onSave}>
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo;
