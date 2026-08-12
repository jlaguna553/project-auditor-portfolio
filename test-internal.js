// Try all possible internal Electron API paths
const paths = [
  "electron/main",
  "electron/common", 
  "electron/renderer",
  "@electron/internal/browser/api/exports/electron",
];

for (const p of paths) {
  try {
    const m = require(p);
    console.log(`${p}:`, typeof m, m && Object.keys(m).slice(0, 5));
  } catch(e) {
    console.log(`${p} error:`, e.code || e.message.slice(0, 60));
  }
}

// Check if process._linkedBinding works (old approach)
if (typeof process._linkedBinding === "function") {
  try {
    const result = process._linkedBinding("electron_browser_app");
    console.log("_linkedBinding electron_browser_app:", typeof result);
  } catch(e) {
    console.log("_linkedBinding error:", e.message.slice(0, 60));
  }
}
