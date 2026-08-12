console.log("global.app:", typeof global.app);
console.log("global.BrowserWindow:", typeof global.BrowserWindow);

// Check Module._nodeModulePaths
const Module = require("module");
console.log("Module paths count:", module.paths.length);

// Force direct electron access through internal path
try {
  const internalElectron = process.binding ? process.binding("electron") : "n/a";
  console.log("process.binding electron:", internalElectron);
} catch(e) {
  console.log("process.binding error:", e.message);
}

// Try requireMainModule approach
try {
  const m = require.main;
  console.log("main module paths:", m ? m.paths.slice(0,3) : "none");
} catch(e) {}
