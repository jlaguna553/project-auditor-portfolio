import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { runAudit } from "./analysis/scanner";
import { applyFix, previewFix } from "./analysis/fixer";
import { Finding } from "./analysis/types";

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0f172a",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../../out/renderer/index.html"));
  }

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("dialog:openFolder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "Selecciona el proyecto a auditar",
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("audit:run", async (event, projectPath: string) => {
  return runAudit(projectPath, (file, scanned, total) => {
    event.sender.send("audit:progress", { file, scanned, total });
  });
});

ipcMain.handle("fix:preview", async (_event, finding: Finding, projectPath: string) => {
  return previewFix(finding, projectPath);
});

ipcMain.handle("fix:apply", async (_event, finding: Finding, projectPath: string) => {
  return applyFix(finding, projectPath);
});

ipcMain.handle("shell:openFile", async (_event, filePath: string) => {
  await shell.openPath(filePath);
});
