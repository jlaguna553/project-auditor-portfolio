import React, { useState, useCallback } from "react";
import {
  ShieldCheck, FolderOpen, RotateCcw, FileSearch
} from "lucide-react";
import { AuditState, AuditResult, Finding } from "./types";
import { ProjectSelector } from "./components/ProjectSelector";
import { ScanProgress } from "./components/ScanProgress";
import { TechStackPanel } from "./components/TechStackPanel";
import { FindingsList } from "./components/FindingsList";
import { FindingDetail } from "./components/FindingDetail";

export default function App() {
  const [auditState, setAuditState] = useState<AuditState>({ phase: "idle" });
  const [selected, setSelected] = useState<Finding | null>(null);
  const [fixedIds, setFixedIds] = useState<Set<string>>(new Set());

  const handleSelectProject = useCallback(async (projectPath: string) => {
    setSelected(null);
    setFixedIds(new Set());
    setAuditState({ phase: "scanning", progress: 0, currentFile: "", total: 0 });

    const unsub = window.api.onAuditProgress(({ file, scanned, total }) => {
      setAuditState({ phase: "scanning", progress: scanned, currentFile: file, total });
    });

    try {
      const result = await window.api.runAudit(projectPath);
      unsub();
      setAuditState({ phase: "done", result });
      if (result.findings.length > 0) setSelected(result.findings[0]);
    } catch (e) {
      unsub();
      setAuditState({ phase: "error", message: String(e) });
    }
  }, []);

  function handleFixed(id: string) {
    setFixedIds((prev) => new Set([...prev, id]));
  }

  if (auditState.phase === "idle") {
    return (
      <div className="flex flex-col h-full">
        <TitleBar onOpen={null} />
        <ProjectSelector onSelect={handleSelectProject} />
      </div>
    );
  }

  if (auditState.phase === "scanning") {
    return (
      <div className="flex flex-col h-full">
        <TitleBar onOpen={null} />
        <ScanProgress
          currentFile={auditState.currentFile}
          scanned={auditState.progress}
          total={auditState.total}
        />
      </div>
    );
  }

  if (auditState.phase === "error") {
    return (
      <div className="flex flex-col h-full">
        <TitleBar onOpen={null} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-red-400">
          <p className="text-lg font-semibold">Error al analizar el proyecto</p>
          <p className="text-sm text-slate-400">{auditState.message}</p>
          <button
            onClick={() => setAuditState({ phase: "idle" })}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 text-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Volver
          </button>
        </div>
      </div>
    );
  }

  const { result } = auditState as { phase: "done"; result: AuditResult };
  const activeFindings = result.findings.filter((f) => !fixedIds.has(f.id));
  const selectedIndex = selected ? activeFindings.findIndex((f) => f.id === selected.id) : -1;

  function handlePrev() {
    if (selectedIndex > 0) setSelected(activeFindings[selectedIndex - 1]);
  }
  function handleNext() {
    if (selectedIndex < activeFindings.length - 1) setSelected(activeFindings[selectedIndex + 1]);
  }

  return (
    <div className="flex flex-col h-full">
      <TitleBar
        onOpen={async () => {
          const folder = await window.api.openFolder();
          if (folder) handleSelectProject(folder);
        }}
        stats={{
          critical: activeFindings.filter((f) => f.severity === "critical").length,
          warning: activeFindings.filter((f) => f.severity === "warning").length,
          info: activeFindings.filter((f) => f.severity === "info").length,
          files: result.scannedFiles,
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-700/50 overflow-hidden bg-slate-900/40">
          <TechStackPanel stack={result.techStack} projectPath={result.projectPath} />
          <div className="flex-1 overflow-hidden flex flex-col">
            <FindingsList
              findings={activeFindings}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-slate-900/20">
          {selected && selectedIndex !== -1 ? (
            <FindingDetail
              key={selected.id}
              finding={selected}
              projectPath={result.projectPath}
              total={activeFindings.length}
              index={selectedIndex}
              onPrev={handlePrev}
              onNext={handleNext}
              onFixed={handleFixed}
            />
          ) : (
            <EmptyDetail findings={activeFindings} fixed={fixedIds.size} total={result.findings.length} />
          )}
        </main>
      </div>
    </div>
  );
}

function TitleBar({
  onOpen,
  stats,
}: {
  onOpen: (() => void) | null;
  stats?: { critical: number; warning: number; info: number; files: number };
}) {
  return (
    <header className="flex items-center justify-between px-4 h-11 border-b border-slate-700/50 bg-slate-900/80 shrink-0 select-none" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-semibold text-slate-200">Project Auditor</span>
      </div>

      {stats && (
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="text-red-400 font-semibold">{stats.critical} críticos</span>
          <span className="text-yellow-400">{stats.warning} avisos</span>
          <span className="text-blue-400">{stats.info} info</span>
          <span className="text-slate-500">{stats.files} archivos</span>
        </div>
      )}

      {onOpen && (
        <button
          onClick={onOpen}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-200 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Abrir proyecto
        </button>
      )}
    </header>
  );
}

function EmptyDetail({ findings, fixed, total }: { findings: Finding[]; fixed: number; total: number }) {
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <ShieldCheck className="w-16 h-16 text-emerald-400" />
        <h2 className="text-2xl font-semibold text-white">Sin problemas detectados</h2>
        <p className="text-slate-400 max-w-md">
          El análisis estático no encontró vulnerabilidades ni malas prácticas en este proyecto.
        </p>
      </div>
    );
  }

  if (fixed > 0 && findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <ShieldCheck className="w-16 h-16 text-emerald-400" />
        <h2 className="text-2xl font-semibold text-white">¡Todos los problemas corregidos!</h2>
        <p className="text-slate-400">
          Se aplicaron {fixed} de {total} correcciones automáticas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <FileSearch className="w-12 h-12 text-slate-600" />
      <p className="text-slate-400">Selecciona un hallazgo de la lista para ver los detalles.</p>
    </div>
  );
}
