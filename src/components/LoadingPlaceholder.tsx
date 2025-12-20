import React from "react";

const LoadingPlaceholder = ({ width, height, children }) => {
  return (
    <div
      className={`bg-gray-200 rounded-lg shadow-md overflow-hidden animate-pulse ${
        width ? `w-${width}` : (children) ? "" : "w-full"
      } relative`}
      style={{ height: (height) ? height : 'auto'}}
    >
      {/* Анимация переливания */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-200 to-gray-700 opacity-75"
      >
      </div>
    </div>
  );
};

export default LoadingPlaceholder;