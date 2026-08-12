/**
 * Bootstrap script: patches Module._load so require("electron") returns
 * Electron's built-in API object instead of the npm helper package.
 */
const Module = require("module");
const path = require("path");
const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron") {
    // Access electron through the built-in path to bypass npm package resolution
    try {
      const result = originalLoad.call(this, path.join(__dirname, "node_modules", "electron", "dist", "resources", "default_app.asar", "main.js"), parent, false);
      if (result && result.app) return result;
    } catch {}
    // Fallback: try the native binding
    return originalLoad.call(this, request, parent, isMain);
  }
  return originalLoad.call(this, request, parent, isMain);
};

// Load the actual main bundle
require("./out/main/index.js");
