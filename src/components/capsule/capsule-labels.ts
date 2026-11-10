/** Plain names for capsule categories and entry types stored as enums. */
export const CAPSULE_CATEGORY_LABELS: Record<string, string> = {
  CONVOCATION: "Graduation",
  BATCH_MEMORIES: "Batch memories",
  PREDICTIONS: "Predictions",
};

export const CAPSULE_ENTRY_LABELS: Record<string, string> = {
  LETTER: "Letter",
  PREDICTION: "Prediction",
  PHOTO: "Photo",
};

export function capsuleCategoryLabel(category: string | null | undefined): string {
  if (!category) return "Capsule";
  return (
    CAPSULE_CATEGORY_LABELS[category] ??
    category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, " ")
  );
}

export function formatCapsuleDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
