const mongoose = require("mongoose");
const AQIHistory = require("./models/AQIHistory");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const docs = await AQIHistory.find({});
  for (const d of docs) {
    if (typeof d.date !== "string") {
      console.log("Fixing:", d.date);
      d.date = String(d.date);
      await d.save();
    }
  }

  console.log("DONE FIXING DATES");
  process.exit();
}

run();
