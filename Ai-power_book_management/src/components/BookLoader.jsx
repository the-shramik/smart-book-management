// src/components/BookLoader.jsx
export default function BookLoader() {
  return (
    <div className="animate-pulse flex flex-col items-center w-64 p-5 bg-white rounded-xl shadow-lg">
      <div className="w-32 h-44 bg-gray-200 rounded-md mb-3"></div>
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-3 bg-gray-100 rounded w-3/4"></div>
    </div>
  );
}
