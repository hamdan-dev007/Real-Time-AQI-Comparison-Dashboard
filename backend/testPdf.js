const { extractDelhiAqiFromPdf } = require("./utils/cpcbParser");

extractDelhiAqiFromPdf("C:/Users/ahmad/Documents/RealTime_Weather_Prediction1 - Copy/backend/cpcb_pdfs/AQI_Bulletin_20251112.pdf")
  .then(aqi => {
    console.log("Extracted AQI:", aqi);
  })
  .catch(err => console.error(err));
