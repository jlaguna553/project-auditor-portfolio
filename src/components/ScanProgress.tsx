import React from "react";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  currentFile: string;
  scanned: number;
  total: number;
}

export function ScanProgress({ currentFile, scanned, total }: Props) {
  const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
  const shortFile = currentFile.split("/").slice(-2).join("/");

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
      <div className="flex items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <h2 className="text-2xl font-semibold text-white">Analizando proyecto...</h2>
      </div>

      <div className="w-full max-w-lg flex flex-col gap-3">
        <div className="flex justify-between text-sm text-slate-400">
          <span>{scanned} de {total} archivos</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs font-mono truncate">{shortFile}</p>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>Aplicando reglas de seguridad y buenas prácticas</span>
      </div>
    </div>
  );
}
