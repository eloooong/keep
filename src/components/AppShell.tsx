"use client";
import { KeepLogo } from "@/components/brand/KeepLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Glyph } from "@/components/ui/Glyph";
import { motion } from "motion/react";
import { useReducedMotion } from "@/components/react-bits/useReducedMotion";

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  return (
    <>
      <div className="workspace">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <aside className="sidebar">
          <Link href="/" className="wordmark" aria-label="Keep home">
            <KeepLogo />
          </Link>
          <div className="workspace-label">
            <span className="workspace-avatar">
              <Glyph name="folder" size={18} />
            </span>
            <span>
              Personal workspace<small>Your private collection</small>
            </span>
          </div>
          <p className="nav-label">Workspace</p>
          <nav aria-label="Main navigation">
            {[
              { href: "/", label: "All keys", icon: "vault" as const },
              {
                href: "/activity",
                label: "Activity",
                icon: "activity" as const,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? "is-active" : ""}`}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {pathname === item.href && (
                  <motion.span
                    className="nav-selection"
                    layoutId="workspace-nav-selection"
                    aria-hidden="true"
                    transition={{
                      duration: reduce ? 0 : 0.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                )}
                <Glyph name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="storage-note">
              <Glyph name="shield" size={18} />
              <span>
                Encrypted storage<small>Accessible with permission.</small>
              </span>
            </div>
            <div className="account">
              <span className="account-avatar">
                <Glyph name="user" size={18} />
              </span>
              <span className="account-email" title={email}>
                {email}
                <small>Personal account</small>
              </span>
              <form action={signOut}>
                <button
                  className="quiet-icon"
                  type="submit"
                  title="Log out"
                  aria-label="Log out"
                >
                  <Glyph name="logout" size={19} />
                </button>
              </form>
            </div>
          </div>
        </aside>
        <div className="workspace-body">
          <header className="workspace-topbar">
            <span>
              Workspace <span className="breadcrumb-slash">/</span>{" "}
              <strong>
                {pathname === "/activity" ? "Activity" : "All keys"}
              </strong>
            </span>
          </header>
          <main id="main-content" className="workspace-main">
            {children}
          </main>
          <footer className="workspace-footer">
            <span>Keep your keys. Keep your focus.</span>
            <span>Keep / Personal workspace</span>
          </footer>
        </div>
      </div>
    </>
  );
}
