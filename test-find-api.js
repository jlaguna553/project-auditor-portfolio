console.log("Looking for electron APIs in process...");
const keys = Object.getOwnPropertyNames(process).filter(k => {
  try { return typeof process[k] === "function" || typeof process[k] === "object"; } catch { return false; }
});

// Check all global objects that might have Electron APIs
const internalApiKeys = keys.filter(k => k.toLowerCase().includes("electron") || k.toLowerCase().includes("app") || k.toLowerCase().includes("browser"));
console.log("process keys with electron/app/browser:", internalApiKeys);

// Try to enumerate global
const globalKeys = Object.getOwnPropertyNames(global).filter(k => !['global', 'process', 'Buffer', 'setImmediate', 'clearImmediate', 'URL', 'URLSearchParams', 'TextDecoder', 'TextEncoder', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'console', 'require', 'module', 'exports', '__filename', '__dirname'].includes(k));
console.log("Interesting global keys:", globalKeys.slice(0, 30));
