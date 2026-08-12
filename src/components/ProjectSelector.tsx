import React from "react";
import { FolderOpen, ShieldCheck, Zap, Eye } from "lucide-react";

interface Props {
  onSelect: (path: string) => void;
}

export function ProjectSelector({ onSelect }: Props) {
  async function handleClick() {
    const folder = await window.api.openFolder();
    if (folder) onSelect(folder);
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <ShieldCheck className="w-10 h-10 text-indigo-400" />
          <h1 className="text-4xl font-bold text-white tracking-tight">Project Auditor</h1>
        </div>
        <p className="text-slate-400 text-lg max-w-md">
          Detecta vulnerabilidades, malas prácticas y patrones inseguros en cualquier proyecto de código.
        </p>
      </div>

      <button
        onClick={handleClick}
        className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl text-white font-semibold text-lg transition-all duration-150 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
      >
        <FolderOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
        Seleccionar proyecto
      </button>

      <div className="grid grid-cols-3 gap-6 max-w-2xl w-full mt-4">
        {[
          { icon: ShieldCheck, title: "Seguridad", desc: "SQL Injection, XSS, secretos expuestos, CORS inseguro y más." },
          { icon: Eye, title: "Malas prácticas", desc: "console.log, any types, catch vacíos, código comentado, anidamiento excesivo." },
          { icon: Zap, title: "Corrección directa", desc: "Aplica fixes automáticos al código con un clic y backup incluido." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex flex-col gap-2 p-5 bg-slate-800/60 rounded-xl border border-slate-700/50">
            <Icon className="w-6 h-6 text-indigo-400" />
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
