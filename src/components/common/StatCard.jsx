import React from "react";

const StatCard = ({ stat }) => (
  <div
    key={stat.id}
    className="bg-white p-5 rounded-xl shadow-sm border border-border hover:shadow-lg transition-shadow duration-300"
  >
    <p className="text-sm font-medium text-secondaryDarkText mb-3">
      {stat.title}
    </p>
    <div className="flex items-center justify-between">
      <p className="text-2xl font-bold text-fromColor">{stat.value}</p>
      <div className="p-2.5 rounded-full bg-gray-100">{stat.icon}</div>
    </div>
  </div>
);

export default StatCard;
