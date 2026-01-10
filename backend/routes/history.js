// backend/routes/history.js
const express = require("express");
const router = express.Router();
const AQIHistory = require("../models/AQIHistory");

const { updateCpcbHistory } = require("../utils/cpcbAutoFetcher");
const { updateWaqiHistory } = require("../utils/waqiAutoFetcher");
const { updateOwHistory } = require("../utils/owAutoFetcher");

function pretty(dateStr) {
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return new Date(`${y}-${m}-${d}`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

router.get("/delhi", async (req, res) => {
  try {
    // Update today values
    await updateCpcbHistory();
    await updateWaqiHistory();
    await updateOwHistory();

    // Fetch latest 5 days
    const docs = await AQIHistory.find({ city: "Delhi" })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Return sorted oldest → newest
    const days = docs
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        date: pretty(d.date),
        cpcb: d.cpcb ?? null,
        waqi: d.waqi ?? null,
        openweather: d.openweather ?? null,
      }));

    res.json({ ok: true, city: "Delhi", days });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
