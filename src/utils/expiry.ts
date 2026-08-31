export const SOON_DAYS = 7;

export function expiryStatus(
  expiresAt: string | null
): "none" | "soon" | "expired" {
  if (!expiresAt) return "none";
  const now = new Date();
  const exp = new Date(expiresAt);
  if (Number.isNaN(exp.getTime())) return "none";
  if (exp <= now) return "expired";
  const soon = new Date(now);
  soon.setDate(soon.getDate() + SOON_DAYS);
  if (exp <= soon) return "soon";
  return "none";
}

export function formatExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}
