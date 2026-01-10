// backend/utils/cpcbAutoFetcher.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const https = require("https");
const { extractDelhiAqiFromPdf } = require("./cpcbParser");
const AQIHistory = require("../models/AQIHistory");

// ⚠ Dev-only: ignore bad SSL for CPCB
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// Download PDF if exists
async function downloadPdf(dateStr) {
  const url = `https://cpcb.nic.in/upload/Downloads/AQI_Bulletin_${dateStr}.pdf`;
  const savePath = path.join(
    __dirname,
    "../cpcb_pdfs",
    `AQI_Bulletin_${dateStr}.pdf`
  );

  try {
    const res = await fetch(url, {
      agent: httpsAgent,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/pdf",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://cpcb.nic.in/",
      },
    });

    if (!res.ok) {
      console.log("CPCB blocked or missing:", url, "status:", res.status);
      return null;
    }

    const buffer = await res.buffer();
    fs.writeFileSync(savePath, buffer);
    console.log("✅ Downloaded CPCB PDF:", savePath);
    return savePath;
  } catch (err) {
    console.log("PDF fetch error:", err.message);
    return null;
  }
}

/* ============================================================
   Fetch LAST 5 AVAILABLE CPCB PDFs (could include today’s PDF).
============================================================ */
async function fetchLatest5CPCB() {
  const list = [];

  for (let i = 0; i < 12 && list.length < 5; i++) {
    const date = new Date(Date.now() - i * 86400000);
    const dateStr = formatDate(date);

    const pdfPath = await downloadPdf(dateStr);
    if (!pdfPath) continue; // skip missing PDFs

    const aqi = await extractDelhiAqiFromPdf(pdfPath);
    if (aqi) {
      list.push({ date: dateStr, aqi });
    }
  }

  return list;
}

/* ============================================================
   Insert/Update DB for last 5 CPCB days
============================================================ */
async function updateDelhiHistory() {
  const items = await fetchLatest5CPCB();

  if (!items.length) {
    console.log("⚠ No CPCB PDFs found for last 12 days.");
    return null;
  }

  // UPSERT CPCB data for those 5 dates
  for (const item of items) {
    await AQIHistory.updateOne(
      { city: "Delhi", date: String(item.date) },
      { $set: { cpcb: item.aqi } },
      { upsert: true }
    );
  }

  // Keep only latest 5 entries in DB
  const docs = await AQIHistory.find({ city: "Delhi" }).sort({ date: -1 });

  if (docs.length > 5) {
    const extra = docs.slice(5);
    await AQIHistory.deleteMany({ _id: { $in: extra.map((d) => d._id) } });
  }

  return items;
}

module.exports = {
  updateCpcbHistory: updateDelhiHistory,
};
