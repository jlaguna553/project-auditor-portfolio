import { Issue, ProjectSummary } from "./types";

export function printSummary(summary: ProjectSummary): void {
  console.log("\n=== Auditor de Proyecto: Resumen ===\n");
  console.log(`Carpeta escaneada: ${summary.root}`);
  console.log(`Tecnologías detectadas: ${summary.technologies.join(", ") || "Ninguna"}`);
  console.log(`Patrones de arquitectura: ${summary.architecturePatterns.join(", ") || "Ninguno"}`);
  console.log(`Indicadores clave: ${summary.indicators.join(", ") || "Ninguno"}`);
}

export function printIssueList(issues: Issue[]): void {
  if (issues.length === 0) {
    console.log("\nNo se encontraron vulnerabilidades ni malas prácticas en este análisis.");
    return;
  }

  console.log(`\n=== Vulnerabilidades / Mejora sugeridas (${issues.length}) ===\n`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`);
    console.log(`   Archivo: ${issue.path}${issue.line ? `:${issue.line}` : ""}`);
    console.log(`   Recomendación: ${issue.recommendation}`);
    console.log(`   ID: ${issue.id}`);
    console.log("   ---");
  });
}

export function printIssueDetails(issue: Issue): void {
  console.log(`\n=== Detalle: ${issue.title} ===\n`);
  console.log(`ID: ${issue.id}`);
  console.log(`Severidad: ${issue.severity}`);
  console.log(`Archivo: ${issue.path}${issue.line ? `:${issue.line}` : ""}`);
  console.log(`\nDescripción:\n${issue.description}`);
  console.log(`\nRecomendación:\n${issue.recommendation}`);
  console.log(`\nFix automatizable: ${issue.fixable ? "Sí" : "No"}`);
}
