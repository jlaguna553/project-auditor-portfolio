// Test using process.electron to access it differently
console.log("process.type:", process.type);
console.log("Electron versions:", process.versions.electron);
// Try using the internal module directly
try {
  const { app } = process.electronBinding ? process.electronBinding("app") : {};
  console.log("electronBinding app:", !!app);
} catch(e) {
  console.log("electronBinding error:", e.message);
}

// Check if there's another way
try {
  const m = require.resolve("electron");
  console.log("electron resolves to:", m);
} catch(e) {
  console.log("resolve error:", e.message);
}
