// Test if Electron can be accessed via its internal module system
// In Electron, there should be a way to access the electron module
// even if require('electron') is overridden

console.log("process.type:", process.type);
console.log("process.versions:", JSON.stringify(process.versions, null, 2));

// Check if electron's internal binding is available
if (typeof process.electronBinding !== "undefined") {
  console.log("electronBinding available");
} else {
  console.log("electronBinding NOT available");
}

// Electron v9+ uses process.type
// Check all ways to detect we're in Electron main process
console.log("Is Electron:", !!process.versions.electron);
