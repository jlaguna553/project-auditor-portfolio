export type Severity = "critical" | "warning" | "info";
export type Category = "security" | "practices" | "performance";

export interface RuleMatch {
  line: number;
  column: number;
  matchedText: string;
  context: string[];
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: Category;
  extensions: string[];
  detect(code: string, filePath: string): RuleMatch[];
  fix?(code: string, match: RuleMatch): string | null;
  fixDescription?: string;
}

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
