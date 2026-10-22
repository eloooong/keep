import { Glyph, type GlyphName } from "@/components/ui/Glyph";

const categories: Record<string, GlyphName> = {
  ai: "ai",
  analytics: "analytics",
  dev: "code",
  development: "code",
  email: "mail",
  payments: "payment",
};

export function KeyProviderIcon({
  name,
  category,
}: {
  name: string;
  category: string | null;
}) {
  const icon: GlyphName = /\bgithub\b/i.test(name)
    ? "github"
    : /\bopenai\b/i.test(name)
      ? "openai"
      : /\bstripe\b/i.test(name)
        ? "stripe"
        : (categories[category?.trim().toLowerCase() ?? ""] ?? "keys");
  return (
    <span className="provider-mark" aria-hidden="true">
      <Glyph name={icon} size={21} />
    </span>
  );
}
