// backend/utils/waqiAutoFetcher.js
const fetch = require("node-fetch");
const AQIHistory = require("../models/AQIHistory");

const WAQI_KEY = process.env.WAQI_API_KEY;

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function fetchWaqiAQI() {
  const url = `https://api.waqi.info/feed/Delhi/?token=${WAQI_KEY}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    return typeof json?.data?.aqi === "number" ? json.data.aqi : null;
  } catch {
    return null;
  }
}

async function updateWaqiHistory() {
  const today = new Date();
  const dateStr = formatDate(today);
  const aqi = await fetchWaqiAQI();

  await AQIHistory.updateOne(
    { city: "Delhi", date: dateStr },
    { $set: { waqi: aqi } },
    { upsert: true }
  );

  return aqi;
}

module.exports = { updateWaqiHistory };
