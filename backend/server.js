// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

// TEMP LOG — will tell us if .env loaded
console.log("WAQI KEY:", process.env.WAQI_API_KEY);
console.log("OW KEY:", process.env.OW_API_KEY);

const connectDB = require("./utils/db");
const combinedRoute = require("./routes/combined");
const historyRoute = require("./routes/history");
const averagesRoute = require("./routes/averages");

// Start daily cron (this schedules the job automatically)
require("./cron/dailyAqi");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("AQI backend is running");
});

// Mount routes
app.use("/api/combined", combinedRoute);
app.use("/api/history", historyRoute);
app.use("/api/averages", averagesRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
