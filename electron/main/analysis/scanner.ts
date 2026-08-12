import { promises as fs } from "fs";
import path from "path";
import { allRules } from "./rules/index";
import { detectTechStack } from "./detector";
import { AuditResult, Finding } from "./types";

const IGNORED_DIRS = new Set([
  "node_modules", ".git", ".next", ".nuxt", "dist", "build", "out",
  ".cache", ".turbo", ".vscode", ".idea", "coverage", "__pycache__",
  ".mypy_cache", ".pytest_cache", "vendor", "target", "bin", "obj",
  ".dart_tool", "ios", "android", ".gradle",
]);

const MAX_FILE_SIZE = 500 * 1024;
const MAX_FILES = 1000;

const SUPPORTED_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "py", "java", "php", "rb", "go",
  "rs", "cs", "cpp", "c", "h", "html", "env",
]);

async function walkDirectory(
  dir: string,
  files: string[] = [],
  count = { n: 0 }
): Promise<string[]> {
  if (count.n >= MAX_FILES) return files;
  let entries: { name: string; isDirectory: () => boolean }[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (count.n >= MAX_FILES) break;
    if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(full, files, count);
    } else {
      const ext = entry.name.split(".").pop() ?? "";
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        files.push(full);
        count.n++;
      }
    }
  }
  return files;
}

export async function runAudit(
  projectPath: string,
  onProgress?: (file: string, scanned: number, total: number) => void
): Promise<AuditResult> {
  const [techStack, files] = await Promise.all([
    detectTechStack(projectPath),
    walkDirectory(projectPath),
  ]);

  const findings: Finding[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    onProgress?.(filePath, i + 1, total);

    let content: string;
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > MAX_FILE_SIZE) continue;
      content = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }

    const relativePath = path.relative(projectPath, filePath);

    for (const rule of allRules) {
      let matches;
      try {
        matches = rule.detect(content, filePath);
      } catch {
        continue;
      }

      for (const match of matches) {
        findings.push({
          id: `${rule.id}::${relativePath}::${match.line}`,
          ruleId: rule.id,
          title: rule.title,
          description: rule.description,
          severity: rule.severity,
          category: rule.category,
          filePath: relativePath,
          line: match.line,
          column: match.column,
          codeContext: match.context,
          fixable: !!rule.fix,
          fixDescription: rule.fixDescription,
        });
      }
    }
  }

  findings.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return {
    projectPath,
    techStack,
    findings,
    scannedFiles: total,
    timestamp: new Date().toISOString(),
  };
}
