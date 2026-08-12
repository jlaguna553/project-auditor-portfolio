const path = require("path");
const asarPath = path.join(__dirname, "node_modules/electron/dist/resources/default_app.asar");

try {
  // Try requiring from asar 
  const loaded = require(asarPath + "/main.js");
  console.log("asar main:", loaded);
} catch(e) {
  console.log("asar error:", e.message);
}

// Check what's in the resources dir
const { readdirSync } = require("fs");
try {
  const files = readdirSync(path.join(__dirname, "node_modules/electron/dist/resources/"));
  console.log("resources:", files);
} catch(e) {
  console.log("readdir error:", e.message);
}
