import { promises as fs } from "fs";
import path from "path";
import { FixResult, Issue } from "./types";

const FIX_RULES: Record<string, (filePath: string, content: string) => string | null> = {
  "js-eval": (filePath, content) => {
    if (content.includes("eval(")) {
      return content.replace(/eval\(/g, "safeEval(");
    }
    return null;
  },
  "py-shell-true": (filePath, content) => {
    if (content.includes("shell=True")) {
      return content.replace(/shell=True/g, "shell=False");
    }
    return null;
  },
  "docker-root-user": (filePath, content) => {
    if (content.includes("USER root")) {
      return content.replace(/USER root/g, "USER node");
    }
    return null;
  }
};

export async function applyFix(issue: Issue, projectRoot: string): Promise<FixResult> {
  const filePath = path.isAbsolute(issue.path) ? issue.path : path.join(projectRoot, issue.path);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const fixer = FIX_RULES[issue.id];
    if (!fixer) {
      return { issueId: issue.id, applied: false, message: "No hay regla de arreglo automático para este problema." };
    }

    const fixed = fixer(filePath, content);
    if (!fixed || fixed === content) {
      return { issueId: issue.id, applied: false, message: "No se detectó un cambio aplicable en el archivo." };
    }

    await fs.writeFile(filePath, fixed, "utf8");
    return { issueId: issue.id, applied: true, message: `Se aplicó la corrección al archivo ${issue.path}.` };
  } catch (error) {
    return { issueId: issue.id, applied: false, message: `Error al aplicar la corrección: ${error instanceof Error ? error.message : String(error)}` };
  }
}
