export type Severity = "critical" | "warning" | "info";
export type Category = "security" | "practices" | "performance";

export interface Finding {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  filePath: string;
  line: number;
  column: number;
  codeContext: string[];
  fixable: boolean;
  fixDescription?: string;
}

export interface TechStack {
  languages: string[];
  frameworks: string[];
  tools: string[];
  patterns: string[];
}

export interface AuditResult {
  projectPath: string;
  techStack: TechStack;
  findings: Finding[];
  scannedFiles: number;
  timestamp: string;
}

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

export type AuditState =
  | { phase: "idle" }
  | { phase: "scanning"; progress: number; currentFile: string; total: number }
  | { phase: "done"; result: AuditResult }
  | { phase: "error"; message: string };

declare global {
  interface Window {
    api: {
      openFolder(): Promise<string | null>;
      runAudit(projectPath: string): Promise<AuditResult>;
      onAuditProgress(
        cb: (payload: { file: string; scanned: number; total: number }) => void
      ): () => void;
      previewFix(finding: Finding, projectPath: string): Promise<FixPreview>;
      applyFix(finding: Finding, projectPath: string): Promise<FixResult>;
      openFile(filePath: string): Promise<void>;
    };
  }
}
