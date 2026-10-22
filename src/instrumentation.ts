export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { isDemoMode } = await import("./utils/demo/isDemo");
    if (isDemoMode()) return;
    const { getSupabaseConfig } = await import("./utils/config");
    const { getEncryptionKey } = await import("./utils/crypto");
    getSupabaseConfig();
    getEncryptionKey();
  }
}
