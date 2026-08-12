import { promises as fs } from "fs";
import path from "path";
import { getRuleById } from "./rules/index";
import { Finding } from "./types";

export interface FixPreview {
  before: string;
  after: string;
  canApply: boolean;
  message: string;
}

export interface FixResult {
  applied: boolean;
  message: string;
  backupPath?: string;
}

export async function previewFix(
  finding: Finding,
  projectPath: string
): Promise<FixPreview> {
  const rule = getRuleById(finding.ruleId);
  if (!rule?.fix) {
    return { before: "", after: "", canApply: false, message: "Esta regla no tiene corrección automática." };
  }

  const fullPath = path.join(projectPath, finding.filePath);
  let content: string;
  try {
    content = await fs.readFile(fullPath, "utf8");
  } catch {
    return { before: "", after: "", canApply: false, message: "No se pudo leer el archivo." };
  }

  const lines = content.split("\n");
  const lineIdx = finding.line - 1;
  const matchedLine = lines[lineIdx] ?? "";
  const fakeMatch = {
    line: finding.line,
    column: finding.column,
    matchedText: finding.codeContext.join("") ?? "",
    context: finding.codeContext,
  };

  let fixed: string | null = null;
  try {
    fixed = rule.fix(content, fakeMatch);
  } catch {
    return { before: "", after: "", canApply: false, message: "Error al calcular la corrección." };
  }

  if (!fixed || fixed === content) {
    return {
      before: content.split("\n").slice(Math.max(0, lineIdx - 3), lineIdx + 4).join("\n"),
      after: "",
      canApply: false,
      message: "La corrección automática no encontró cambios aplicables en este archivo.",
    };
  }

  const beforeLines = content.split("\n").slice(Math.max(0, lineIdx - 3), lineIdx + 4).join("\n");
  const fixedLines = fixed.split("\n").slice(Math.max(0, lineIdx - 3), lineIdx + 4).join("\n");

  return {
    before: beforeLines,
    after: fixedLines,
    canApply: true,
    message: "La corrección puede aplicarse automáticamente.",
  };
}

export async function applyFix(
  finding: Finding,
  projectPath: string
): Promise<FixResult> {
  const rule = getRuleById(finding.ruleId);
  if (!rule?.fix) {
    return { applied: false, message: "Esta regla no tiene corrección automática." };
  }

  const fullPath = path.join(projectPath, finding.filePath);
  let content: string;
  try {
    content = await fs.readFile(fullPath, "utf8");
  } catch {
    return { applied: false, message: "No se pudo leer el archivo." };
  }

  const fakeMatch = {
    line: finding.line,
    column: finding.column,
    matchedText: "",
    context: finding.codeContext,
  };

  let fixed: string | null;
  try {
    fixed = rule.fix(content, fakeMatch);
  } catch (e) {
    return { applied: false, message: `Error al calcular la corrección: ${e}` };
  }

  if (!fixed || fixed === content) {
    return { applied: false, message: "No se detectó ningún cambio aplicable." };
  }

  const backupPath = fullPath + ".audit-backup";
  try {
    await fs.writeFile(backupPath, content, "utf8");
    await fs.writeFile(fullPath, fixed, "utf8");
    return {
      applied: true,
      message: `Corrección aplicada. Backup guardado en ${finding.filePath}.audit-backup`,
      backupPath,
    };
  } catch (e) {
    return { applied: false, message: `Error al escribir el archivo: ${e}` };
  }
}
