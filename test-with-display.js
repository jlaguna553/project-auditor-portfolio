console.log("DISPLAY:", process.env.DISPLAY);
console.log("process.type:", process.type);
const e = require("electron");
console.log("electron type:", typeof e);
if (typeof e === "object") console.log("app:", !!e.app);
