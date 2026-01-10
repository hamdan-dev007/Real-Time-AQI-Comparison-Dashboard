const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const { extractDelhiAqiFromPdf } = require("./cpcbParser");
const AQIHistory = require("../models/AQIHistory");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Clear previous records for Delhi
  await AQIHistory.deleteMany({ city: "Delhi" });
  console.log("\nClearing previous Delhi history...\n");

  const folder = path.join(__dirname, "..", "cpcb_pdfs");
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".pdf"));

  // Sort by date automatically
  files.sort();

  for (const file of files) {
    const pdfPath = path.join(folder, file);
    console.log("Parsing:", pdfPath);

    try {
      const aqi = await extractDelhiAqiFromPdf(pdfPath);

      console.log("Extracted AQI:", aqi);

      await AQIHistory.create({
        city: "Delhi",
        date: file.replace("AQI_Bulletin_", "").replace(".pdf", ""),
        cpcb: aqi,
      });

    } catch (err) {
      console.log("Import error:", err);
    }
  }

  console.log("\n🔥 DONE IMPORTING DELHI HISTORY!");
  process.exit(0);
}

run();
