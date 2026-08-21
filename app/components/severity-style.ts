import type { FlagSeverity } from "@/lib/domain/inspection";

export const SEVERITY_COLOR: Record<FlagSeverity, string> = {
  high: "var(--risk-high)",
  medium: "var(--risk-medium)",
  low: "var(--risk-low)",
};

export const SEVERITY_DIM: Record<FlagSeverity, string> = {
  high: "var(--risk-high-dim)",
  medium: "var(--risk-medium-dim)",
  low: "var(--risk-low-dim)",
};
