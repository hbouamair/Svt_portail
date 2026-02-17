/**
 * Validation des notes (alignée avec la contrainte en base : check (note >= 0 and note <= 20))
 */
export const NOTE_MIN = 0;
export const NOTE_MAX = 20;

export function isValidNote(value: unknown): value is number {
  return (
    typeof value === "number" &&
    !Number.isNaN(value) &&
    value >= NOTE_MIN &&
    value <= NOTE_MAX
  );
}

/** Retourne un message d'erreur si la note est invalide, sinon null */
export function validateNote(value: unknown): string | null {
  if (value === "" || value === undefined || value === null) return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n)) return "Veuillez entrer un nombre.";
  if (n < NOTE_MIN || n > NOTE_MAX) return `La note doit être entre ${NOTE_MIN} et ${NOTE_MAX}.`;
  return null;
}
