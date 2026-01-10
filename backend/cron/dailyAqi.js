// backend/cron/dailyAqi.js
const cron = require("node-cron");
const fetch = require("node-fetch");
const AQIHistory = require("../models/AQIHistory");

const { updateCpcbHistory } = require("../utils/cpcbAutoFetcher");
const { updateWaqiHistory } = require("../utils/waqiAutoFetcher");
const { updateOwHistory } = require("../utils/owAutoFetcher");

const API_BASE = "http://localhost:5000";

// --- Format date YYYYMMDD ---
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/* ============================================================
   Save today’s WAQI + OW live AQI so next day it becomes history
============================================================ */
async function saveTodayWaqiOw() {
  console.log("🌙 Saving WAQI + OpenWeather for today...");

  try {
    const url = `${API_BASE}/api/combined?city=delhi`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      console.log("❌ Failed to fetch combined API");
      return;
    }

    const today = formatDate(new Date());

    await AQIHistory.updateOne(
      { city: "Delhi", date: today },
      {
        $set: {
          waqi: data.results.waqi?.aqi ?? null,
          openweather: data.results.openweather?.aqi ?? null,
        },
      },
      { upsert: true }
    );

    console.log("✅ Saved WAQI + OW for today:", today);

  } catch (err) {
    console.log("⚠ Error saving WAQI/OW:", err.message);
  }
}

/* ============================================================
   MAIN CRON — runs 12:10 AM India time
============================================================ */
cron.schedule(
  "10 0 * * *",
  async () => {
    console.log("⏱ Running daily AQI cron (12:10 AM)...");

    try {
      await updateCpcbHistory();    // Real CPCB data (5-day)
      await saveTodayWaqiOw();      // Store WAQI + OW live value
      console.log("✅ Daily AQI cron completed.");
    } catch (err) {
      console.error("❌ Cron failed:", err);
    }
  },
  { timezone: "Asia/Kolkata" }
);

console.log("⏱ Daily AQI cron scheduled for 12:10 AM IST.");
