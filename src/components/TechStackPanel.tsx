import React from "react";
import { Code2, Layers, Wrench, GitBranch } from "lucide-react";
import { TechStack } from "../types";

interface Props {
  stack: TechStack;
  projectPath: string;
}

function Section({ icon: Icon, title, items, color }: {
  icon: typeof Code2; title: string; items: string[]; color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="px-2 py-0.5 text-xs rounded bg-slate-700/60 text-slate-300 border border-slate-600/40">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TechStackPanel({ stack, projectPath }: Props) {
  const folderName = projectPath.split("/").pop() ?? projectPath;

  return (
    <div className="flex flex-col gap-4 p-4 border-b border-slate-700/50">
      <div>
        <p className="text-xs text-slate-500 mb-0.5">Proyecto</p>
        <p className="text-sm font-semibold text-white truncate" title={projectPath}>{folderName}</p>
        <p className="text-xs text-slate-500 truncate">{projectPath}</p>
      </div>
      <Section icon={Code2} title="Lenguajes" items={stack.languages} color="text-blue-400" />
      <Section icon={Layers} title="Frameworks" items={stack.frameworks} color="text-violet-400" />
      <Section icon={Wrench} title="Herramientas" items={stack.tools} color="text-emerald-400" />
      <Section icon={GitBranch} title="Arquitectura" items={stack.patterns} color="text-orange-400" />
    </div>
  );
}
