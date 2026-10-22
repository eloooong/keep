import { AuthBrandPanel } from "@/components/AuthBrandPanel";
import { AnimatedContent } from "@/components/react-bits/AnimatedContent";
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="auth-page">
        <AuthBrandPanel />
        <section className="auth-content" aria-label="Account access">
          <AnimatedContent
            className="auth-form-entrance"
            distance={12}
            speed={0.45}
            blur={3}
          >
            {children}
          </AnimatedContent>
        </section>
      </main>
    </>
  );
}
