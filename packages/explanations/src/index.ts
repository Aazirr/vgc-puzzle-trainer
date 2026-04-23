export interface PuzzleExplanationTemplate {
  templateType?: string;
  template_type?: string;
  fields?: Record<string, string | number | boolean | string[] | null | undefined>;
  aiText?: string;
  ai_text?: string;
}

function formatField(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (value === null || value === undefined) return "unknown";
  return String(value);
}

function field(fields: PuzzleExplanationTemplate["fields"], key: string, fallback: string) {
  return formatField(fields?.[key] ?? fallback);
}

export function renderMechanicalExplanation(explanation: PuzzleExplanationTemplate): string {
  const templateType = explanation.templateType ?? explanation.template_type;
  const fields = explanation.fields ?? {};

  if (templateType === "speed_check") {
    return [
      field(fields, "winner", "The selected action"),
      "wins the speed check.",
      field(fields, "reason", "Compare effective Speed after field effects, stat boosts, items, and priority.")
    ].join(" ");
  }

  if (templateType === "ko_threshold") {
    return [
      field(fields, "winner", "The selected action"),
      "is the deterministic KO-threshold line.",
      field(fields, "reason", "The damage range must stay fully above or fully below the target HP threshold.")
    ].join(" ");
  }

  if (templateType === "field_interaction") {
    return [
      field(fields, "winner", "The selected action"),
      "is correct because of the active field interaction.",
      field(fields, "reason", "Resolve priority, terrain, weather, and side conditions before comparing raw actions.")
    ].join(" ");
  }

  return field(fields, "reason", "Resolve the deterministic mechanics for this puzzle before selecting an action.");
}
