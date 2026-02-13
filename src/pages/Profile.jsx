import React, { useState } from "react";
import { CheckCircle } from "lucide-react";
// import ProfileHeader from "../components/profile/ProfileHeader"; // Removed
import ProfileInfo from "../components/profile/ProfileInfo";
// import ProfileStats from "../components/profile/ProfileStats"; // Removed
// import AccountStatus from "../components/profile/AccountStatus"; // Removed

const Profile = () => {
  // Mock user data
  const initialUserData = {
    name: "John Driver",
    email: "john.driver@example.com",
    phone: "(555) 123-4567",
    address: "789 Delivery Ave, Suite 101",
    vehicleType: "Sedan",
    licensePlate: "ABC-1234",
  };

  const [userData, setUserData] = useState(initialUserData);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Mock stats
  const stats = [
    { id: 1, title: "Deliveries Completed", value: 128 },
    { id: 2, title: "On-time Rate", value: "98%" },
    { id: 3, title: "Customer Rating", value: "4.9/5" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    setMessage({ text: "Profile updated successfully!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  // Optional: Revert data to initialUserData if needed, but for now just exit edit mode
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>

      {message.text && (
        <div
          className={`p-4 rounded-xl shadow-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          <div className="flex items-center">
            <CheckCircle
              className={`h-5 w-5 mr-2 ${
                message.type === "success" ? "text-green-500" : "text-red-500"
              }`}
            />
            {message.text}
          </div>
        </div>
      )}

      {/* Profile Information - Full Width */}
      <div className="w-full">
        <ProfileInfo
          userData={userData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          handleInputChange={handleInputChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default Profile;
