import { DEMO_USER } from "./demoUser";

/**
 * Browser-safe mock auth — no Node imports, safe for client components.
 * Any credentials "work" in demo mode.
 */
export function createMockBrowserAuth() {
  return {
    async getUser() {
      return { data: { user: DEMO_USER }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    async signInWithPassword() {
      return {
        data: { user: DEMO_USER, session: { token_type: "bearer" } },
        error: null,
      };
    },
    async signUp() {
      return {
        data: { user: DEMO_USER, session: { token_type: "bearer" } },
        error: null,
      };
    },
    async signInWithOAuth() {
      if (typeof window !== "undefined") {
        window.location.assign(new URL("/", window.location.origin));
      }
      return { data: null, error: null };
    },
    async resetPasswordForEmail() {
      return { data: {}, error: null };
    },
    async updateUser() {
      return { data: { user: DEMO_USER }, error: null };
    },
  };
}
