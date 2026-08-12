import React from "react";

interface Props {
  lines: string[];
  highlightLine?: number;
  label?: string;
}

function parseLine(raw: string): { isHighlight: boolean; lineNum: string; content: string } {
  const match = raw.match(/^([→ ])\s+(\d+): (.*)$/);
  if (match) {
    return { isHighlight: match[1] === "→", lineNum: match[2], content: match[3] };
  }
  return { isHighlight: false, lineNum: "", content: raw };
}

function tokenize(code: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  const patterns: Array<{ re: RegExp; cls: string }> = [
    { re: /\/\/.*$/g, cls: "text-slate-500" },
    { re: /#.*$/g, cls: "text-slate-500" },
    { re: /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, cls: "text-emerald-400" },
    { re: /\b(const|let|var|function|class|return|import|export|from|async|await|if|else|for|while|try|catch|throw|new|typeof|instanceof|void|null|undefined|true|false|this|super|extends|implements|interface|type|enum)\b/g, cls: "text-violet-400" },
    { re: /\b\d+(\.\d+)?\b/g, cls: "text-yellow-400" },
    { re: /\b[A-Z][a-zA-Z0-9_]*\b/g, cls: "text-blue-300" },
  ];

  let result = code;
  const parts: Array<{ text: string; cls?: string }> = [];

  let i = 0;
  while (i < result.length) {
    let matched = false;
    for (const { re, cls } of patterns) {
      re.lastIndex = i;
      const m = re.exec(result);
      if (m && m.index === i) {
        parts.push({ text: m[0], cls });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (parts.length && !parts[parts.length - 1].cls) {
        parts[parts.length - 1].text += result[i];
      } else {
        parts.push({ text: result[i] });
      }
      i++;
    }
  }

  return parts.map((p, idx) =>
    p.cls ? (
      <span key={idx} className={p.cls}>{p.text}</span>
    ) : (
      p.text
    )
  );
}

export function CodeViewer({ lines, label }: Props) {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-slate-700/50">
      {label && (
        <div className="px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/50 text-xs text-slate-400 font-mono">
          {label}
        </div>
      )}
      <div className="overflow-x-auto bg-slate-900/60">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((raw, idx) => {
              const { isHighlight, lineNum, content } = parseLine(raw);
              return (
                <tr
                  key={idx}
                  className={isHighlight ? "bg-red-500/10" : ""}
                >
                  <td className={`select-none text-right pr-3 pl-3 py-0 text-xs w-10 ${isHighlight ? "text-red-400" : "text-slate-600"}`}>
                    {isHighlight ? "→" : ""}{lineNum}
                  </td>
                  <td className={`py-0 pr-4 text-xs font-mono whitespace-pre ${isHighlight ? "text-slate-100" : "text-slate-400"}`}>
                    {tokenize(content)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
