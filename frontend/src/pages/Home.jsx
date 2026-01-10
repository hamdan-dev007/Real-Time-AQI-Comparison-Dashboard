import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API_BASE = "http://localhost:5000";

/* ------------------------------------------------
   AQI severity badge
------------------------------------------------ */
function getAqiSeverity(aqi) {
  if (aqi == null) return { label: "Unknown", color: "bg-gray-300 text-gray-800" };
  if (aqi <= 50) return { label: "Good", color: "bg-green-100 text-green-800" };
  if (aqi <= 100) return { label: "Moderate", color: "bg-yellow-100 text-yellow-800" };
  if (aqi <= 200) return { label: "Poor", color: "bg-orange-100 text-orange-800" };
  if (aqi <= 300) return { label: "Very Poor", color: "bg-red-100 text-red-800" };
  return { label: "Hazardous", color: "bg-purple-100 text-purple-800" };
}

function formatLocal(ts) {
  try {
    const d = new Date(ts);
    if (isNaN(d)) return ts;
    return d.toLocaleString();
  } catch {
    return ts;
  }
}

/* ------------------------------------------------
   History chart component – REAL last 10 days
------------------------------------------------ */
/* ------------------------------------------------
   History chart component – real CPCB + WAQI + OW
------------------------------------------------ */
function AQIHistoryChart({ data }) {
  if (!data || !data.length) return null;

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Delhi – 5-Day AQI Comparison
        </h3>
      </div>

      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            {/* CPCB from PDFs */}
            <Line
              type="linear"
              dataKey="cpcb"
              name="CPCB"
              stroke="#1976D2"
              strokeWidth={2.5}
              dot={false}
            />
            {/* WAQI stays null for now, line will be empty */}
            <Line
              type="linear"
              dataKey="waqi"
              name="WAQI"
              stroke="#2E7D32"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
            />
            {/* OpenWeather EPA AQI */}
            <Line
              type="linear"
              dataKey="openweather"
              name="OpenWeather (EPA AQI)"
              stroke="#7C4DFF"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
/* ========================================================
   MAIN HOME COMPONENT – 3 API cards + chart
======================================================== */
export default function Home() {
  const [averages, setAverages] = useState(null);
  const [showAverages, setShowAverages] = useState(true);
  const [loadingAverages, setLoadingAverages] = useState(true);

  const [city, setCity] = useState("");
  const [msg, setMsg] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  // Load category averages: Metropolitan / Tier 2 / Tier 3
  useEffect(() => {
    (async () => {
      setLoadingAverages(true);
      try {
        const res = await fetch(`${API_BASE}/api/averages`);
        const json = await res.json();
        if (json && json.ok && json.groups) {
          setAverages(json.groups);
        } else {
          setMsg("Failed to load averages");
        }
      } catch (e) {
        console.error("averages fetch", e);
        setMsg("Could not load averages (see console)");
      } finally {
        setLoadingAverages(false);
      }
    })();
  }, []);

  // Search: live AQI + past 10-day history
    // Search now: still station-oriented for cards,
  // but chart uses Delhi history (CPCB PDFs) for now.
  async function handleSearch(e) {
  e?.preventDefault?.();
  const q = city.trim();
  if (!q) return setMsg("Enter a station / city");

  setMsg("");
  setSearching(true);
  setResults(null);
  setHistoryData(null);

  try {
    // 1) live combined APIs (CPCB/WAQI/OW)
    const res = await fetch(`${API_BASE}/api/combined?city=${encodeURIComponent(q)}`);
    const json = await res.json();

    if (json && json.ok && json.results) {
      setResults(json.results);
    } else {
      setMsg("Search returned no data");
    }

    // 2) ONLY FOR DELHI: fetch 10-day CPCB + OW history
    if (q.toLowerCase() === "delhi") {
      try {
       
const histRes = await fetch(`${API_BASE}/api/history/delhi`);
const histJson = await histRes.json();

if (histJson && histJson.ok && Array.isArray(histJson.days)) {
  const rows = histJson.days.map((d) => ({
    date: d.date,          // already pretty formatted, e.g. "19 Nov"
    cpcb: d.cpcb ?? null,
    waqi: d.waqi ?? null,
    openweather: d.openweather ?? null,
    }));
    setHistoryData(rows);
    } else {
    setHistoryData(null);
    console.warn("No Delhi history available", histJson);
      }
      } catch (err) {
        console.error("history fetch error", err);
        setHistoryData(null);
      }
    } else {
      // For non-Delhi, we don’t show the 10-day chart
      setHistoryData(null);
    }
  } catch (e) {
    console.error("search error", e);
    setMsg("Search failed (see console)");
  } finally {
    setSearching(false);
    setShowAverages(false); // after first search, hide averages cards
  }
}
  /* --------- CATEGORY AVERAGES: Metro / Tier2 / Tier3 ---------- */
  function renderAvgLines(key) {
  if (!averages || !averages[key]) {
    return (
      <>
        <div className="text-sm text-gray-700">Metropolitan —</div>
        <div className="text-sm text-gray-700 mt-1">Tier 2 —</div>
        <div className="text-sm text-gray-700 mt-1">Tier 3 —</div>
      </>
    );
  }

  const g = averages[key];

  return (
    <>
      <div className="text-sm text-gray-700">
        Metropolitan – <span className="font-semibold">{g.metropolitan ?? "—"}</span>
      </div>
      <div className="text-sm text-gray-700 mt-1">
        Tier 2 – <span className="font-semibold">{g.tier2 ?? "—"}</span>
      </div>
      <div className="text-sm text-gray-700 mt-1">
        Tier 3 – <span className="font-semibold">{g.tier3 ?? "—"}</span>
      </div>
    </>
  );
}
  /* --------- RESULT BLOCK (station / city AQI) ---------- */
  function renderResultBlock(obj) {
    if (!obj) {
      return (
        <>
          <div className="text-lg font-semibold text-gray-900">AQI – —</div>
          <div className="text-sm text-gray-600 mt-1">Main Pollutant – —</div>
          <div className="text-xs text-gray-500 mt-3">(updated —)</div>
        </>
      );
    }
    const sev = getAqiSeverity(obj.aqi);
    return (
      <>
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-gray-900">
            AQI – {obj.aqi ?? "—"}
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${sev.color}`}>{sev.label}</div>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Main Pollutant – {obj.main ?? "pm2.5"}
        </div>
        <div className="text-xs text-gray-500 mt-3">
          (updated {obj.updated ? formatLocal(obj.updated) : "—"})
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER same as screenshot */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AQI Comparison Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Material-style dashboard — Govt vs Private APIs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Theme: Material</div>
            <div className="px-3 py-2 rounded-md bg-white shadow-sm text-sm text-gray-700">
              v1.0
            </div>
          </div>
        </header>

        {/* SEARCH BAR */}
        <section className="bg-white rounded-lg shadow-sm p-5 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 items-center">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search city (e.g., Delhi)"
              className="flex-1 px-4 py-3 rounded-md border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-gray-900"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              {searching ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCity("");
                setResults(null);
                setHistoryData(null);
                setShowAverages(true); // show Metro/Tier2/Tier3 averages again
                setMsg("");
              }}
              className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-200"
            >
              Reset
            </button>
          </form>
          {msg && <div className="mt-3 text-sm text-red-600">{msg}</div>}
        </section>

        {/* 3 FLASH CARDS – CPCB / WAQI / OpenWeather */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CPCB */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-5"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-700">CPCB (Govt)</h4>
                <p className="text-xs text-gray-500 mt-1">data.gov.in</p>
              </div>
              <div className="text-xs text-gray-500">Gov</div>
            </div>
            <div className="mt-4">
              {showAverages ? renderAvgLines("cpcb") : renderResultBlock(results?.cpcb)}
            </div>
          </motion.div>

          {/* WAQI */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-5"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-700">WAQI</h4>
                <p className="text-xs text-gray-500 mt-1">aqicn.org</p>
              </div>
              <div className="text-xs text-gray-500">Private</div>
            </div>
            <div className="mt-4">
              {showAverages ? renderAvgLines("waqi") : renderResultBlock(results?.waqi)}
            </div>
          </motion.div>

          {/* OpenWeather */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-5"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium text-gray-700">OpenWeather</h4>
                <p className="text-xs text-gray-500 mt-1">openweathermap.org</p>
              </div>
              <div className="text-xs text-gray-500">Private</div>
            </div>
            <div className="mt-4">
              {showAverages
                ? renderAvgLines("openweather")
                : renderResultBlock(results?.openweather)}
            </div>
          </motion.div>
        </div>
{/* REAL 5-DAY CHART */}
{!showAverages && historyData && (
  <div>
    <AQIHistoryChart data={historyData} />
  </div>
)}
        <footer className="mt-8 text-xs text-gray-500"></footer>
      </div>
    </div>
  );
}
