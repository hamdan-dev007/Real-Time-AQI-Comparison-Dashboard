const mongoose = require("mongoose");

const DailyAqiSchema = new mongoose.Schema({
  date: {
    type: String, // e.g., "2025-11-12"
    required: true,
  },
  cities: [
    {
      city: String, // Delhi, Mumbai, etc.
      cpcb: Number,
      waqi: Number,
      openweather: Number,
    },
  ],
});

module.exports = mongoose.model("DailyAqi", DailyAqiSchema);
