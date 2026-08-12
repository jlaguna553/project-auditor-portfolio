import { securityRules } from "./security";
import { practiceRules } from "./practices";
import { Rule } from "../types";

export const allRules: Rule[] = [...securityRules, ...practiceRules];

export function getRuleById(id: string): Rule | undefined {
  return allRules.find((r) => r.id === id);
}
