// Test direct electron require from project dir
const electron = require("electron");
console.log("type:", typeof electron);
console.log("is string:", typeof electron === "string");
if (typeof electron === "string") {
  console.log("ERROR: got path string, npm package took over:", electron);
} else {
  console.log("app:", !!electron.app);
}
process.exit(0);
