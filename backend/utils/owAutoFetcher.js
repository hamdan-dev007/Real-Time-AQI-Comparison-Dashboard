// backend/utils/owAutoFetcher.js
const fetch = require("node-fetch");
const AQIHistory = require("../models/AQIHistory");

const OPENWEATHER_KEY = process.env.OW_API_KEY;

// EPA AQI conversion breakpoints
const pm25Break = [
  [0, 12, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 350.4, 301, 400],
  [350.5, 500.4, 401, 500],
];

function calcAQI(C, breakpoints) {
  for (const bp of breakpoints) {
    const [Clow, Chigh, Ilow, Ihigh] = bp;
    if (C >= Clow && C <= Chigh) {
      return Math.round(((Ihigh - Ilow) / (Chigh - Clow)) * (C - Clow) + Ilow);
    }
  }
  return null;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

async function fetchOWAQI() {
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=28.6139&lon=77.2090&appid=${OPENWEATHER_KEY}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    const c = json?.list?.[0]?.components;

    if (!c) return null;

    const pm25 = calcAQI(c.pm2_5, pm25Break);
    return pm25;
  } catch {
    return null;
  }
}

async function updateOwHistory() {
  const today = new Date();
  const dateStr = formatDate(today);
  const aqi = await fetchOWAQI();

  await AQIHistory.updateOne(
    { city: "Delhi", date: dateStr },
    { $set: { openweather: aqi } },
    { upsert: true }
  );

  return aqi;
}

module.exports = { updateOwHistory };
