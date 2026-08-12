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
  ruleId: string,
  filePath: string
): RuleMatch[] {
  const ext = filePath.split(".").pop() ?? "";
  if (!extensions.includes(ext)) return [];

  const lines = getLines(code);
  const matches: RuleMatch[] = [];
  lines.forEach((line, idx) => {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
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

export const securityRules: Rule[] = [
  {
    id: "hardcoded-secret",
    title: "Secreto o credencial hardcodeada",
    description:
      "Se encontró una posible clave, contraseña o token directamente en el código fuente. Esto expone credenciales sensibles a cualquiera que acceda al repositorio.",
    severity: "critical",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx", "py", "go", "java", "php", "rb", "env"],
    detect(code, filePath) {
      const pattern =
        /(?:password|passwd|pwd|secret|api[_-]?key|apikey|token|auth[_-]?token|access[_-]?key|private[_-]?key)\s*[=:]\s*['"`]([^'"`\s]{6,})['"`]/gi;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code.replace(
        /(\b(?:password|passwd|pwd|secret|api[_-]?key|apikey|token|auth[_-]?token|access[_-]?key|private[_-]?key)\s*[=:]\s*)(['"`])[^'"`\s]{6,}(['"`])/gi,
        "$1$2process.env.SECRET_VALUE$3"
      );
    },
    fixDescription: "Reemplaza el valor hardcodeado por una referencia a variable de entorno (process.env.SECRET_VALUE). Renombra la variable según corresponda.",
  },
  {
    id: "sql-injection",
    title: "Posible inyección SQL",
    description:
      "Se detecta una consulta SQL construida por concatenación de strings. Si alguna variable proviene de entrada del usuario, esto permite ataques de SQL Injection.",
    severity: "critical",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx", "py", "php", "java", "rb"],
    detect(code, filePath) {
      const pattern =
        /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\s+.*?\+\s*(?:req\.|request\.|params\.|query\.|body\.|input|user|id|name|email)/gi;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return null;
    },
    fixDescription:
      "Usa consultas parametrizadas (prepared statements). Ejemplo:\n  db.query('SELECT * FROM users WHERE id = ?', [userId])\nen lugar de concatenar strings.",
  },
  {
    id: "xss-innerhtml",
    title: "XSS: uso de innerHTML con variable",
    description:
      "Se asigna innerHTML usando una variable. Si esta variable contiene datos del usuario o externos sin sanitizar, permite ataques de Cross-Site Scripting (XSS).",
    severity: "critical",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx", "html"],
    detect(code, filePath) {
      const pattern = /\.innerHTML\s*=\s*(?!['"`])[a-zA-Z_$`]/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code.replace(
        /\.innerHTML\s*=\s*([^;'"]+);/g,
        ".textContent = $1;"
      );
    },
    fixDescription: "Reemplaza .innerHTML por .textContent para contenido de texto plano, o usa DOMPurify.sanitize() si necesitas HTML.",
  },
  {
    id: "eval-usage",
    title: "Uso de eval()",
    description:
      "eval() ejecuta código arbitrario en el contexto actual. Permite inyección de código si la entrada no es completamente controlada y dificulta las optimizaciones del motor JS.",
    severity: "critical",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const pattern = /\beval\s*\(/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code.replace(/\beval\s*\(/g, "/* INSEGURO — reemplazar eval */ (");
    },
    fixDescription: "Elimina eval(). Alternativas: JSON.parse() para datos JSON, Function() con mucha precaución, o reestructura la lógica para evitarlo.",
  },
  {
    id: "command-injection",
    title: "Posible inyección de comandos",
    description:
      "Se detecta una llamada a exec/spawn/execSync con una variable. Si esa variable viene del usuario, permite ejecutar comandos arbitrarios en el servidor.",
    severity: "critical",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const pattern =
        /(?:exec|execSync|spawn|spawnSync|execFile)\s*\(\s*(?:[`'"][^`'"]*\$\{|[a-zA-Z_$])/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix: undefined,
    fixDescription:
      "Valida y escapa todos los inputs antes de pasarlos a comandos del sistema. Usa listas blancas (allowlists) y prefiere APIs nativas de Node.js sobre shell commands.",
  },
  {
    id: "path-traversal",
    title: "Posible Path Traversal",
    description:
      "Se usa una variable (posiblemente del usuario) directamente en operaciones de sistema de archivos. Esto puede permitir leer o escribir archivos fuera del directorio permitido.",
    severity: "critical",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const pattern =
        /(?:readFile|writeFile|readFileSync|writeFileSync|createReadStream|createWriteStream|unlink|mkdir|rmdir)\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.|path\.join\s*\([^)]*(?:req\.|params\.|query\.))/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix: undefined,
    fixDescription:
      "Usa path.resolve() y verifica que el path resultante esté dentro del directorio base esperado:\n  const safe = path.resolve(BASE_DIR, userInput);\n  if (!safe.startsWith(BASE_DIR)) throw new Error('Forbidden');",
  },
  {
    id: "weak-crypto",
    title: "Criptografía débil (MD5 / SHA1)",
    description:
      "MD5 y SHA1 son algoritmos rotos para propósitos criptográficos. No deben usarse para hashing de contraseñas ni firmas digitales.",
    severity: "warning",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx", "py", "java", "php", "rb"],
    detect(code, filePath) {
      const pattern = /(?:createHash|hashlib\.new|MessageDigest\.getInstance)\s*\(\s*['"`](?:md5|sha1)['"`]\s*\)/gi;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code
        .replace(/['"`]md5['"`]/gi, "'sha256'")
        .replace(/['"`]sha1['"`]/gi, "'sha256'");
    },
    fixDescription: "Para hashing de contraseñas usa bcrypt, argon2 o scrypt. Para integridad de datos usa SHA-256 o superior.",
  },
  {
    id: "insecure-random",
    title: "Math.random() en contexto de seguridad",
    description:
      "Math.random() no es criptográficamente seguro. Usarlo para tokens, IDs de sesión o claves produce valores predecibles que pueden ser forzados.",
    severity: "warning",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const pattern =
        /(?:token|secret|key|session|password|salt|nonce|csrf)\s*[=:]\s*[^;]*Math\.random\(\)/gi;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code.replace(
        /Math\.random\(\)/g,
        "crypto.getRandomValues(new Uint32Array(1))[0] / 0xFFFFFFFF"
      );
    },
    fixDescription: "Usa crypto.randomBytes() en Node.js o crypto.getRandomValues() en el navegador para valores criptográficamente seguros.",
  },
  {
    id: "cors-wildcard",
    title: "CORS con wildcard (*)",
    description:
      "Configurar CORS con '*' permite que cualquier origen acceda a la API. En APIs autenticadas esto anula la protección de cookies SameSite y permite CSRF.",
    severity: "warning",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const pattern = /(?:origin|Access-Control-Allow-Origin)\s*[=:]\s*['"`]\*['"`]/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code.replace(
        /((?:origin|Access-Control-Allow-Origin)\s*[=:]\s*)(['"`])\*(['"`])/g,
        "$1$2process.env.ALLOWED_ORIGIN$3"
      );
    },
    fixDescription: "Define una lista de orígenes permitidos explícitamente y valida el header Origin contra ella.",
  },
  {
    id: "http-not-https",
    title: "URL usando HTTP en lugar de HTTPS",
    description:
      "Las URLs HTTP transmiten datos sin cifrar. En producción, todas las comunicaciones deben usar HTTPS para evitar ataques man-in-the-middle.",
    severity: "warning",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx", "py", "java", "php", "rb", "go"],
    detect(code, filePath) {
      const pattern = /['"`]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[a-zA-Z]/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code.replace(
        /(['"`])http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/g,
        "$1https://"
      );
    },
    fixDescription: "Reemplaza http:// por https:// en todas las URLs de producción.",
  },
  {
    id: "debug-mode",
    title: "Modo debug activado en código",
    description:
      "Flags de debug expuestos en producción pueden filtrar información sensible (stack traces, configuración interna) y activar rutas de código no protegidas.",
    severity: "warning",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx", "py", "env"],
    detect(code, filePath) {
      const pattern = /(?:DEBUG\s*=\s*True|debug\s*:\s*true|NODE_ENV\s*=\s*['"`]development['"`])/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix(code, match) {
      return code
        .replace(/DEBUG\s*=\s*True/g, "DEBUG = False")
        .replace(/debug\s*:\s*true/g, "debug: false");
    },
    fixDescription: "Controla el modo debug mediante variables de entorno y asegúrate de que sea false en producción.",
  },
  {
    id: "prototype-pollution",
    title: "Posible contaminación de prototipo",
    description:
      "Asignar propiedades a Object.prototype o usar __proto__ directamente puede contaminar el prototipo global, afectando a todos los objetos en la aplicación.",
    severity: "warning",
    category: "security",
    extensions: ["js", "ts", "jsx", "tsx"],
    detect(code, filePath) {
      const pattern = /(?:__proto__|Object\.prototype)\s*(?:\[|\.).*?=(?!=)/g;
      return matchPattern(code, pattern, this.extensions, this.id, filePath);
    },
    fix: undefined,
    fixDescription: "Usa Object.create(null) para objetos sin prototipo. Valida y rechaza keys como '__proto__', 'constructor', 'prototype' en inputs externos.",
  },
];
