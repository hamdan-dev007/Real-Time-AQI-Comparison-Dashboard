// Official EPA breakpoints for AQI calculation
const breakpoints = {
  pm25: [
    { concLow: 0.0, concHigh: 12.0, aqiLow: 0, aqiHigh: 50 },
    { concLow: 12.1, concHigh: 35.4, aqiLow: 51, aqiHigh: 100 },
    { concLow: 35.5, concHigh: 55.4, aqiLow: 101, aqiHigh: 150 },
    { concLow: 55.5, concHigh: 150.4, aqiLow: 151, aqiHigh: 200 },
    { concLow: 150.5, concHigh: 250.4, aqiLow: 201, aqiHigh: 300 },
    { concLow: 250.5, concHigh: 350.4, aqiLow: 301, aqiHigh: 400 },
    { concLow: 350.5, concHigh: 500.4, aqiLow: 401, aqiHigh: 500 }
  ],

  pm10: [
    { concLow: 0, concHigh: 54, aqiLow: 0, aqiHigh: 50 },
    { concLow: 55, concHigh: 154, aqiLow: 51, aqiHigh: 100 },
    { concLow: 155, concHigh: 254, aqiLow: 101, aqiHigh: 150 },
    { concLow: 255, concHigh: 354, aqiLow: 151, aqiHigh: 200 },
    { concLow: 355, concHigh: 424, aqiLow: 201, aqiHigh: 300 },
    { concLow: 425, concHigh: 504, aqiLow: 301, aqiHigh: 400 },
    { concLow: 505, concHigh: 604, aqiLow: 401, aqiHigh: 500 }
  ],

  o3_8h: [
    { concLow: 0.000, concHigh: 0.054, aqiLow: 0, aqiHigh: 50 },
    { concLow: 0.055, concHigh: 0.070, aqiLow: 51, aqiHigh: 100 },
    { concLow: 0.071, concHigh: 0.085, aqiLow: 101, aqiHigh: 150 },
    { concLow: 0.086, concHigh: 0.105, aqiLow: 151, aqiHigh: 200 },
    { concLow: 0.106, concHigh: 0.200, aqiLow: 201, aqiHigh: 300 }
  ],

  no2: [
    { concLow: 0, concHigh: 53, aqiLow: 0, aqiHigh: 50 },
    { concLow: 54, concHigh: 100, aqiLow: 51, aqiHigh: 100 },
    { concLow: 101, concHigh: 360, aqiLow: 101, aqiHigh: 150 },
    { concLow: 361, concHigh: 649, aqiLow: 151, aqiHigh: 200 },
    { concLow: 650, concHigh: 1249, aqiLow: 201, aqiHigh: 300 },
    { concLow: 1250, concHigh: 1649, aqiLow: 301, aqiHigh: 400 },
    { concLow: 1650, concHigh: 2049, aqiLow: 401, aqiHigh: 500 }
  ],

  so2: [
    { concLow: 0, concHigh: 35, aqiLow: 0, aqiHigh: 50 },
    { concLow: 36, concHigh: 75, aqiLow: 51, aqiHigh: 100 },
    { concLow: 76, concHigh: 185, aqiLow: 101, aqiHigh: 150 },
    { concLow: 186, concHigh: 304, aqiLow: 151, aqiHigh: 200 },
    { concLow: 305, concHigh: 604, aqiLow: 201, aqiHigh: 300 },
    { concLow: 605, concHigh: 804, aqiLow: 301, aqiHigh: 400 },
    { concLow: 805, concHigh: 1004, aqiLow: 401, aqiHigh: 500 }
  ],

  co: [
    { concLow: 0.0, concHigh: 4.4, aqiLow: 0, aqiHigh: 50 },
    { concLow: 4.5, concHigh: 9.4, aqiLow: 51, aqiHigh: 100 },
    { concLow: 9.5, concHigh: 12.4, aqiLow: 101, aqiHigh: 150 },
    { concLow: 12.5, concHigh: 15.4, aqiLow: 151, aqiHigh: 200 },
    { concLow: 15.5, concHigh: 30.4, aqiLow: 201, aqiHigh: 300 },
    { concLow: 30.5, concHigh: 40.4, aqiLow: 301, aqiHigh: 400 },
    { concLow: 40.5, concHigh: 50.4, aqiLow: 401, aqiHigh: 500 }
  ]
};


// Generic AQI calculator for a pollutant
function calcAqi(conc, pollutant) {
  const table = breakpoints[pollutant];
  if (!table) return null;

  const row = table.find(r => conc >= r.concLow && conc <= r.concHigh);
  if (!row) return null;

  return Math.round(
    ((row.aqiHigh - row.aqiLow) / (row.concHigh - row.concLow)) * 
    (conc - row.concLow) + row.aqiLow
  );
}


// Main EPA AQI calculator for ALL pollutants
function computeEpaAqi(components) {
  const {
    pm2_5, pm10, o3, no2, so2, co
  } = components;

  const results = [];

  if (pm2_5 != null) results.push(calcAqi(pm2_5, "pm25"));
  if (pm10 != null)  results.push(calcAqi(pm10, "pm10"));
  if (o3 != null)    results.push(calcAqi(o3 / 1000, "o3_8h"));  // OpenWeather gives µg/m³
  if (no2 != null)   results.push(calcAqi(no2, "no2"));
  if (so2 != null)   results.push(calcAqi(so2, "so2"));
  if (co != null)    results.push(calcAqi(co, "co"));

  const valid = results.filter(x => x != null);

  return valid.length ? Math.max(...valid) : null;
}

module.exports = { computeEpaAqi };
