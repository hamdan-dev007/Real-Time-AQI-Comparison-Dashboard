export default function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 max-w-md w-full text-center">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        {weather.name}, {weather.sys.country}
      </h2>

      <p className="text-gray-500 mb-4">{weather.weather[0].description}</p>

      <h1 className="text-6xl font-bold text-blue-600 mb-4">
        {Math.round(weather.main.temp)}°C
      </h1>

      <div className="flex justify-center gap-6 text-gray-700">
        <div>
          <p className="font-medium">Humidity</p>
          <p>{weather.main.humidity}%</p>
        </div>

        <div>
          <p className="font-medium">Wind</p>
          <p>{weather.wind.speed} m/s</p>
        </div>
      </div>
    </div>
  );
}
