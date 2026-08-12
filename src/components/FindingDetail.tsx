import React, { useState, useEffect } from "react";
import {
  ShieldAlert, AlertTriangle, Info, FileCode, Wrench,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  ExternalLink, Loader2, RotateCcw
} from "lucide-react";
import { Finding, FixPreview, FixResult } from "../types";
import { SeverityBadge } from "./SeverityBadge";
import { CodeViewer } from "./CodeViewer";

interface Props {
  finding: Finding;
  projectPath: string;
  total: number;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onFixed: (id: string) => void;
}

type FixState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "preview"; data: FixPreview }
  | { status: "applying" }
  | { status: "applied"; msg: string }
  | { status: "error"; msg: string };

export function FindingDetail({ finding, projectPath, total, index, onPrev, onNext, onFixed }: Props) {
  const [fixState, setFixState] = useState<FixState>({ status: "idle" });

  useEffect(() => {
    setFixState({ status: "idle" });
  }, [finding.id]);

  async function handlePreview() {
    setFixState({ status: "loading" });
    try {
      const preview = await window.api.previewFix(finding, projectPath);
      setFixState({ status: "preview", data: preview });
    } catch (e) {
      setFixState({ status: "error", msg: String(e) });
    }
  }

  async function handleApply() {
    setFixState({ status: "applying" });
    try {
      const result = await window.api.applyFix(finding, projectPath);
      if (result.applied) {
        setFixState({ status: "applied", msg: result.message });
        onFixed(finding.id);
      } else {
        setFixState({ status: "error", msg: result.message });
      }
    } catch (e) {
      setFixState({ status: "error", msg: String(e) });
    }
  }

  const Icon =
    finding.severity === "critical" ? ShieldAlert :
    finding.severity === "warning" ? AlertTriangle : Info;

  const iconColor =
    finding.severity === "critical" ? "text-red-400" :
    finding.severity === "warning" ? "text-yellow-400" : "text-blue-400";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <SeverityBadge severity={finding.severity} />
          <span className="text-slate-500 text-sm">
            {finding.category === "security" ? "Seguridad" : "Prácticas"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs">{index + 1} / {total}</span>
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            disabled={index === total - 1}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
        {/* Title + file location */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">{finding.title}</h2>
          <button
            onClick={() => window.api.openFile(projectPath + "/" + finding.filePath)}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-sm font-mono transition-colors group"
          >
            <FileCode className="w-4 h-4" />
            {finding.filePath}
            <span className="text-slate-500">:{finding.line}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Description */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/40">
          <p className="text-slate-300 text-sm leading-relaxed">{finding.description}</p>
        </div>

        {/* Code context */}
        {finding.codeContext.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Código afectado</h3>
            <CodeViewer lines={finding.codeContext} label={`${finding.filePath}:${finding.line}`} />
          </div>
        )}

        {/* Fix section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-300">Solución sugerida</h3>
            {finding.fixable && (
              <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                Auto-fix disponible
              </span>
            )}
          </div>

          {finding.fixDescription && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/40">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{finding.fixDescription}</pre>
            </div>
          )}

          {finding.fixable && (
            <div className="flex flex-col gap-3">
              {fixState.status === "idle" && (
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-200 transition-colors self-start"
                >
                  <Wrench className="w-4 h-4" />
                  Ver preview del fix
                </button>
              )}

              {fixState.status === "loading" && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculando corrección...
                </div>
              )}

              {fixState.status === "preview" && (
                <div className="flex flex-col gap-3">
                  {fixState.data.canApply ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-red-400 font-semibold mb-1.5">Antes</p>
                          <pre className="text-xs font-mono bg-red-950/30 border border-red-800/30 rounded-lg p-3 overflow-x-auto text-red-200 whitespace-pre">
                            {fixState.data.before}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-400 font-semibold mb-1.5">Después</p>
                          <pre className="text-xs font-mono bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-3 overflow-x-auto text-emerald-200 whitespace-pre">
                            {fixState.data.after}
                          </pre>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleApply}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aplicar corrección
                        </button>
                        <button
                          onClick={() => setFixState({ status: "idle" })}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-300">{fixState.data.message}</p>
                    </div>
                  )}
                </div>
              )}

              {fixState.status === "applying" && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aplicando corrección...
                </div>
              )}

              {fixState.status === "applied" && (
                <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-300">{fixState.msg}</p>
                </div>
              )}

              {fixState.status === "error" && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{fixState.msg}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
