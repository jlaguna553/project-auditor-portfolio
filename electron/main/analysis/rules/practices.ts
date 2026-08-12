import { Rule, RuleMatch } from "../types";

function getLines(code: string): string[] {
  return code.split("\n");
}

function contextAround(lines: string[], lineIndex: number, radius = 2): string[] {
  const start = Math.max(0, lineIndex - radius);
  const end = Math.min(lines.length - 1, lineIndex + radius);
  return lines.slice(start, end + 1).map((l, i) => {
    const num = start + i + 1;
    const marker = start + i === lineIndex ? "→" : " ";
    return `${marker} ${String(num).padStart(4)}: ${l}`;
  });
}

function matchPattern(
  code: string,
  pattern: RegExp,
  extensions: string[],
  filePath: string
): RuleMatch[] {
  const ext = filePath.split(".").pop() ?? "";
  if (!extensions.includes(ext)) return [];

  const lines = getLines(code);
  const matches: RuleMatch[] = [];
  lines.forEach((line, idx) => {
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      matches.push({
        line: idx + 1,
        column: m.index + 1,
        matchedText: m[0],
        context: contextAround(lines, idx),
      });
    }
  });
  return matches;
}

export const practiceRules: Rule[] = [
  {
    id: "console-log",
    title: "console.log en código de producción",
    description:
      "Los console.log exponen información interna en la consola del navegador o servidor, pueden filtrar datos sensibles y degradan el rendimiento en producción.",
    severity: "warning",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      if (filePath.includes(".test.") || filePath.includes(".spec.") || filePath.includes("__tests__")) return [];
      const pattern = /\bconsole\.(log|warn|error|info|debug)\s*\(/g;
      return matchPattern(code, pattern, this.extensions, filePath);
    },
    fix(code, match) {
      return code.replace(/\bconsole\.(log|warn|error|info|debug)\s*\([^)]*\)\s*;?\n?/g, "");
    },
    fixDescription: "Elimina los console.log o reemplázalos por un logger estructurado (winston, pino) que pueda desactivarse en producción.",
  },
  {
    id: "empty-catch",
    title: "Bloque catch vacío",
    description:
      "Un catch vacío silencia errores sin registrarlos ni manejarlos. Esto hace que los fallos sean invisibles y muy difíciles de depurar.",
    severity: "warning",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx", "java", "php"],
    detect(code, filePath) {
      const pattern = /catch\s*\([^)]*\)\s*\{\s*\}/g;
      return matchPattern(code, pattern, this.extensions, filePath);
    },
    fix(code, match) {
      return code.replace(
        /catch\s*\(([^)]*)\)\s*\{\s*\}/g,
        "catch ($1) { console.error('Error no manejado:', $1); }"
      );
    },
    fixDescription: "Al menos registra el error en el catch. Idealmente, propaga el error o toma una acción de recuperación explícita.",
  },
  {
    id: "todo-comment",
    title: "Comentario TODO / FIXME / HACK pendiente",
    description:
      "Comentarios TODO/FIXME/HACK indican deuda técnica o código incompleto que fue dejado para después. Deben rastrearse en un sistema de issues, no en el código.",
    severity: "info",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx", "py", "java", "php", "rb", "go", "rs"],
    detect(code, filePath) {
      const pattern = /\/\/\s*(?:TODO|FIXME|HACK|XXX|BUG)\b.*/gi;
      return matchPattern(code, pattern, this.extensions, filePath);
    },
    fix: undefined,
    fixDescription: "Crea un issue en tu gestor de proyectos (GitHub Issues, Jira, Linear) y reemplaza el comentario por una referencia al issue.",
  },
  {
    id: "any-type",
    title: "Uso de tipo 'any' en TypeScript",
    description:
      "El tipo 'any' desactiva las verificaciones de TypeScript en ese punto. Su uso masivo elimina los beneficios de tener un lenguaje tipado.",
    severity: "warning",
    category: "practices",
    extensions: ["ts", "tsx"],
    detect(code, filePath) {
      const pattern = /:\s*any\b(?!\[\])/g;
      return matchPattern(code, pattern, this.extensions, filePath);
    },
    fix: undefined,
    fixDescription: "Define un tipo o interface específico. Si el tipo es genuinamente desconocido usa 'unknown' y agrega validación de tipo antes de usarlo.",
  },
  {
    id: "no-error-handling",
    title: "await sin manejo de errores",
    description:
      "Una llamada async/await sin try/catch puede lanzar excepciones no capturadas que crashean el proceso o devuelven respuestas inesperadas al usuario.",
    severity: "warning",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const lines = getLines(code);
      const ext = filePath.split(".").pop() ?? "";
      if (!this.extensions.includes(ext)) return [];
      const matches: RuleMatch[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\bawait\b/.test(line)) {
          const block = lines.slice(Math.max(0, i - 5), i + 1).join("\n");
          if (!/try\s*\{/.test(block)) {
            matches.push({
              line: i + 1,
              column: line.indexOf("await") + 1,
              matchedText: "await",
              context: contextAround(lines, i),
            });
          }
        }
      }
      return matches.slice(0, 3);
    },
    fix: undefined,
    fixDescription: "Envuelve el await en un bloque try/catch o usa un wrapper de manejo de errores:\n  const [err, data] = await to(asyncCall());\n  if (err) { /* manejar */ }",
  },
  {
    id: "magic-number",
    title: "Número mágico en el código",
    description:
      "Literales numéricos sin nombre hacen el código difícil de entender y mantener. El valor 86400 significa algo para quien lo escribió, no para quien lo lee.",
    severity: "info",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx", "py"],
    detect(code, filePath) {
      const pattern = /(?<![.\d])\b(?!0\b|1\b|2\b|-1\b)\d{3,}\b(?!\s*[,\]\)]?\s*\/\/)/g;
      return matchPattern(code, pattern, this.extensions, filePath);
    },
    fix: undefined,
    fixDescription: "Extrae el número a una constante con nombre descriptivo:\n  const MAX_RETRY_ATTEMPTS = 3;\n  const SESSION_TTL_SECONDS = 86400;",
  },
  {
    id: "long-function",
    title: "Función excesivamente larga",
    description:
      "Funciones de más de 60 líneas son difíciles de leer, probar y mantener. Generalmente indican que la función hace demasiadas cosas (violación de Single Responsibility).",
    severity: "info",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const ext = filePath.split(".").pop() ?? "";
      if (!this.extensions.includes(ext)) return [];
      const lines = getLines(code);
      const matches: RuleMatch[] = [];
      let inFunction = false;
      let funcStart = 0;
      let depth = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!inFunction && /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(.*\)\s*=>|\w+\s*\([^)]*\)\s*\{)/.test(line)) {
          inFunction = true;
          funcStart = i;
          depth = 0;
        }
        if (inFunction) {
          depth += (line.match(/\{/g) || []).length;
          depth -= (line.match(/\}/g) || []).length;
          if (depth <= 0 && i > funcStart) {
            const length = i - funcStart + 1;
            if (length > 60) {
              matches.push({
                line: funcStart + 1,
                column: 1,
                matchedText: `función de ${length} líneas`,
                context: contextAround(lines, funcStart),
              });
            }
            inFunction = false;
          }
        }
      }
      return matches;
    },
    fix: undefined,
    fixDescription: "Divide la función en subfunciones más pequeñas con responsabilidades únicas. Apunta a funciones de máximo 30-40 líneas.",
  },
  {
    id: "commented-code",
    title: "Bloque de código comentado",
    description:
      "Código comentado es ruido que confunde a los lectores: ¿está desactivado temporalmente? ¿es código de referencia? ¿se puede borrar? El control de versiones (git) guarda el historial.",
    severity: "info",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx", "py"],
    detect(code, filePath) {
      const lines = getLines(code);
      const ext = filePath.split(".").pop() ?? "";
      if (!this.extensions.includes(ext)) return [];
      const matches: RuleMatch[] = [];
      let commentBlock = 0;
      let blockStart = -1;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trimStart();
        const isCodeComment = /^\/\/\s*(?:const|let|var|function|class|if|for|while|return|import|export)/.test(trimmed) ||
          /^#\s*(?:def|class|if|for|while|return|import)/.test(trimmed);
        if (isCodeComment) {
          if (commentBlock === 0) blockStart = i;
          commentBlock++;
        } else {
          if (commentBlock >= 3) {
            matches.push({
              line: blockStart + 1,
              column: 1,
              matchedText: `${commentBlock} líneas de código comentado`,
              context: contextAround(lines, blockStart, 1),
            });
          }
          commentBlock = 0;
          blockStart = -1;
        }
      }
      return matches;
    },
    fix: undefined,
    fixDescription: "Elimina el código comentado. Si necesitas recuperarlo, está en git history. Si es código de referencia, muévelo a documentación.",
  },
  {
    id: "deep-nesting",
    title: "Anidamiento excesivo",
    description:
      "Más de 4 niveles de anidamiento hace el código muy difícil de seguir y probar. Suele indicar lógica compleja que puede simplificarse con early returns o extracción de funciones.",
    severity: "info",
    category: "practices",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const ext = filePath.split(".").pop() ?? "";
      if (!this.extensions.includes(ext)) return [];
      const lines = getLines(code);
      const matches: RuleMatch[] = [];
      for (let i = 0; i < lines.length; i++) {
        const indent = lines[i].match(/^(\s*)/)?.[1].length ?? 0;
        const level = Math.floor(indent / 2);
        if (level >= 5) {
          matches.push({
            line: i + 1,
            column: 1,
            matchedText: `anidamiento nivel ${level}`,
            context: contextAround(lines, i),
          });
        }
      }
      return matches.slice(0, 2);
    },
    fix: undefined,
    fixDescription: "Usa early returns / guard clauses para reducir anidamiento. Extrae bloques profundos a funciones separadas.",
  },
  {
    id: "missing-semicolon-inconsistency",
    title: "Uso inconsistente de punto y coma",
    description:
      "El código mezcla líneas con y sin punto y coma final. Esto indica falta de estilo uniforme y puede causar errores de ASI (Automatic Semicolon Insertion) en casos borde.",
    severity: "info",
    category: "practices",
    extensions: ["js", "jsx"],
    detect(code, filePath) {
      const ext = filePath.split(".").pop() ?? "";
      if (!this.extensions.includes(ext)) return [];
      const lines = getLines(code);
      const withSemicolon = lines.filter(l => /[a-zA-Z0-9)'"]\s*;/.test(l)).length;
      const withoutSemicolon = lines.filter(l => /[a-zA-Z0-9)'"]\s*$/.test(l) && !/^\s*\/\//.test(l)).length;
      if (withSemicolon > 5 && withoutSemicolon > 5 && Math.abs(withSemicolon - withoutSemicolon) < Math.min(withSemicolon, withoutSemicolon)) {
        return [{
          line: 1,
          column: 1,
          matchedText: `${withSemicolon} líneas con ; y ${withoutSemicolon} sin ;`,
          context: [lines[0]],
        }];
      }
      return [];
    },
    fix: undefined,
    fixDescription: "Configura ESLint con la regla 'semi' y un formateador como Prettier para mantener consistencia automáticamente.",
  },
];
