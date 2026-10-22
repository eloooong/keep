export const authProviders = [
  { id: "google", name: "Google" },
  { id: "github", name: "GitHub" },
] as const;

export type AuthProvider = (typeof authProviders)[number]["id"];

export function getEnabledAuthProviders(
  configured = process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "",
): AuthProvider[] {
  const enabled = new Set(configured.split(",").map((name) => name.trim()));
  return authProviders.filter(({ id }) => enabled.has(id)).map(({ id }) => id);
}
