// backend/models/AQIHistory.js
const mongoose = require("mongoose");

const AQIHistorySchema = new mongoose.Schema({
  city: { type: String, required: true },
  date: { type: String, required: true }, // YYYYMMDD
  cpcb: { type: Number, default: null },
  waqi: { type: Number, default: null },
  openweather: { type: Number, default: null },
});

module.exports = mongoose.model("AQIHistory", AQIHistorySchema);
