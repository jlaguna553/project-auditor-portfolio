import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, Info, ChevronRight, Search, Filter } from "lucide-react";
import { Finding, Severity, Category } from "../types";
import { SeverityBadge } from "./SeverityBadge";

interface Props {
  findings: Finding[];
  selected: Finding | null;
  onSelect: (f: Finding) => void;
}

const SEVERITY_ICON: Record<Severity, React.ComponentType<{ className?: string }>> = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_ORDER: Severity[] = ["critical", "warning", "info"];

export function FindingsList({ findings, selected, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<Severity | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");

  const counts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    warning: findings.filter((f) => f.severity === "warning").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  const filtered = findings.filter((f) => {
    if (filterSeverity !== "all" && f.severity !== filterSeverity) return false;
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.title.toLowerCase().includes(q) || f.filePath.toLowerCase().includes(q);
    }
    return true;
  });

  const grouped = SEVERITY_ICON;

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-700/50 flex flex-col gap-2">
        <div className="flex gap-1.5">
          {(["all", "critical", "warning", "info"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`flex-1 text-xs py-1 rounded font-medium transition-colors ${
                filterSeverity === s
                  ? s === "all" ? "bg-slate-600 text-white" :
                    s === "critical" ? "bg-red-500/30 text-red-300" :
                    s === "warning" ? "bg-yellow-500/30 text-yellow-300" :
                    "bg-blue-500/30 text-blue-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {s === "all" ? `Todo (${findings.length})` :
               s === "critical" ? `Crítico (${counts.critical})` :
               s === "warning" ? `Aviso (${counts.warning})` :
               `Info (${counts.info})`}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {(["all", "security", "practices"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c as Category | "all")}
              className={`flex-1 text-xs py-1 rounded transition-colors ${
                filterCategory === c
                  ? "bg-slate-600 text-white font-medium"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {c === "all" ? "Todas" : c === "security" ? "Seguridad" : "Prácticas"}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 bg-slate-800 border border-slate-600/50 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm gap-2">
            <Filter className="w-5 h-5" />
            Sin resultados
          </div>
        ) : (
          filtered.map((finding) => {
            const Icon = SEVERITY_ICON[finding.severity];
            const isSelected = selected?.id === finding.id;
            return (
              <button
                key={finding.id}
                onClick={() => onSelect(finding)}
                className={`w-full text-left px-3 py-3 border-b border-slate-700/30 flex items-start gap-2.5 transition-colors group ${
                  isSelected
                    ? "bg-indigo-600/20 border-l-2 border-l-indigo-500"
                    : "hover:bg-slate-800/60 border-l-2 border-l-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    finding.severity === "critical" ? "text-red-400" :
                    finding.severity === "warning" ? "text-yellow-400" : "text-blue-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 leading-tight line-clamp-2">{finding.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate font-mono">
                    {finding.filePath}:{finding.line}
                  </p>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors ${isSelected ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"}`} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
