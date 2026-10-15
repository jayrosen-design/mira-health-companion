import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { COLOR_SCHEMES } from "@/components/ThemeProvider";
import { ColorSchemeControl } from "@/components/ColorSchemeControl";
import { ParentVaccineTalkLogo } from "@/components/mira/BrandIdentity";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  head: () => ({ meta: [
    { title: "Color scheme comparison · Parent Vaccine Talk" },
    { name: "description", content: "Compare Warm Sage, UF Health, and SPARC C-LEAR color schemes for Parent Vaccine Talk side by side." },
    { property: "og:title", content: "Color scheme comparison · Parent Vaccine Talk" },
    { property: "og:description", content: "Three live phone views of Parent Vaccine Talk in Warm Sage, UF Health, and SPARC C-LEAR." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function ComparePage() {
  return <div className="min-h-screen bg-background">
    <div className="border-b border-border bg-research-bar text-research-bar-foreground"><div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-1.5"><ColorSchemeControl /><Link to="/" className="inline-flex items-center gap-1 text-[11px] uppercase"><ArrowLeft className="h-3 w-3" />Back to chat</Link></div></div>
    <main className="mx-auto max-w-7xl px-4 py-8"><ParentVaccineTalkLogo /><h1 className="mt-4 font-display text-2xl text-heading">Color scheme comparison</h1>
      <div className="mt-6 flex flex-wrap justify-center gap-6">
        {COLOR_SCHEMES.map((scheme) => <section key={scheme.id} className="w-[390px] max-w-full"><h2 className="mb-3 font-display text-xl text-heading">{scheme.name}</h2><div className="overflow-x-auto"><iframe title={`${scheme.name} phone preview`} src={`/?theme=${scheme.id}`} width="390" height="844" className="block h-[844px] w-[390px] border border-border bg-card shadow-soft" /></div></section>)}
      </div>
    </main>
  </div>;
}