import { contextBridge, ipcRenderer } from "electron";
import type { Finding, AuditResult } from "../main/analysis/types";
import type { FixPreview, FixResult } from "../main/analysis/fixer";

export type ProgressPayload = { file: string; scanned: number; total: number };

contextBridge.exposeInMainWorld("api", {
  openFolder: (): Promise<string | null> => ipcRenderer.invoke("dialog:openFolder"),

  runAudit: (projectPath: string): Promise<AuditResult> =>
    ipcRenderer.invoke("audit:run", projectPath),

  onAuditProgress: (cb: (payload: ProgressPayload) => void) => {
    const handler = (_: unknown, payload: ProgressPayload) => cb(payload);
    ipcRenderer.on("audit:progress", handler);
    return () => ipcRenderer.removeListener("audit:progress", handler);
  },

  previewFix: (finding: Finding, projectPath: string): Promise<FixPreview> =>
    ipcRenderer.invoke("fix:preview", finding, projectPath),

  applyFix: (finding: Finding, projectPath: string): Promise<FixResult> =>
    ipcRenderer.invoke("fix:apply", finding, projectPath),

  openFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke("shell:openFile", filePath),
});
