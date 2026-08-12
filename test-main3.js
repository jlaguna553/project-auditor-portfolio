// Try to use electron via its package index but bypass require cache
delete require.cache[require.resolve("electron")];
// Manually load the core
const Module = require("module");
const origLoad = Module._load;

Module._load = function(request, ...args) {
  console.log("Loading:", request);
  return origLoad.apply(this, [request, ...args]);
};

// What's in electron index.js?
const electronIndex = require("./node_modules/electron/index.js");
console.log("electron index type:", typeof electronIndex);
console.log("electron index:", electronIndex);
