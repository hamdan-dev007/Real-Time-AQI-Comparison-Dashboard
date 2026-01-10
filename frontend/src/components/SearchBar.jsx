import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [city, setCity] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim() === "") return;
    onSearch(city);
    setCity("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-3 bg-white rounded-xl shadow-lg p-3 max-w-md w-full"
    >
     <input
  type="text"
  placeholder="Enter city name..."
  className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-gray-300 outline-none"
  value={city}
  onChange={(e) => setCity(e.target.value)}
/>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        Search
      </button>
    </form>
  );
}
