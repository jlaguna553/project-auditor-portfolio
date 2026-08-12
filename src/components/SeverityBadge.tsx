import React from "react";
import { Severity } from "../types";

const CONFIG: Record<Severity, { label: string; classes: string }> = {
  critical: { label: "Crítico", classes: "bg-red-500/20 text-red-400 border border-red-500/30" },
  warning:  { label: "Aviso",   classes: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" },
  info:     { label: "Info",    classes: "bg-blue-500/20 text-blue-400 border border-blue-500/30" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, classes } = CONFIG[severity];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}
