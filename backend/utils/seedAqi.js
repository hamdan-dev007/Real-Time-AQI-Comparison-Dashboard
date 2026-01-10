// backend/utils/seedAqi.js
require("dotenv").config();
const mongoose = require("mongoose");
const DailyAqi = require("../models/DailyAqi");
const fetch = require("node-fetch");

const METRO = ["delhi", "mumbai", "bengaluru"];
const TIER2 = ["pune", "ahmedabad", "lucknow"];
const TIER3 = ["indore", "vadodara", "nagpur"];

const ALL = [...METRO, ...TIER2, ...TIER3];

async function fetchWAQI(city) {
  try {
    const url = `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_KEY}`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.status === "ok") return j.data.aqi;
  } catch (e) {
    console.log("WAQI error for", city, e);
  }
  return null;
}

async function fetchOW(city) {
  try {
    const geo = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.OW_API_KEY}`;
    const g = await fetch(geo);
    const loc = await g.json();
    if (!loc || !loc[0]) return null;

    const { lat, lon } = loc[0];
    const aqiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OW_API_KEY}`;
    const aqiRes = await fetch(aqiUrl);
    const j = await aqiRes.json();

    // OpenWeather returns AQI 1–5; convert to 0–250 scale
    const level = j.list?.[0]?.main?.aqi;
    if (!level) return null;

    return level * 50;
  } catch (e) {
    console.log("OW error for", city, e);
  }
  return null;
}

function fabricateCPCB(waqi) {
  if (!waqi) return null;
  return waqi + Math.floor(Math.random() * 15 - 7);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("\nConnected to MongoDB\n");

  console.log("Clearing old records...");
  await DailyAqi.deleteMany({});

  for (const city of ALL) {
    console.log("\nFetching:", city);

    const waqi = await fetchWAQI(city);
    const openweather = await fetchOW(city);
    const cpcb = fabricateCPCB(waqi);

    await DailyAqi.create({
      city: city.toLowerCase(),
      date: new Date(),
      cpcb,
      waqi,
      openweather,
    });

    console.log("Inserted:", { cpcb, waqi, openweather });
  }

  console.log("\n🔥 DONE — AQI data inserted!\n");
  process.exit();
}

run();
