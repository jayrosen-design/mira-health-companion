import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Columns3, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { COLOR_SCHEMES, isColorScheme, useColorScheme, type ColorScheme } from "./ThemeProvider";

function SchemeSwatch({ theme }: { theme: ColorScheme }) {
  return <span data-theme={theme} className="scheme-swatch inline-flex shrink-0 gap-1" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="h-2.5 w-2.5 rounded-full border border-border bg-secondary" /><span className="h-2.5 w-2.5 rounded-full bg-accent" /></span>;
}

export function ColorSchemeControl({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { theme, setTheme } = useColorScheme();
  if (mobile) return <div className="my-2 border-y border-border py-2">
    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Color scheme</p>
    {COLOR_SCHEMES.map((scheme) => <Button key={scheme.id} variant="ghost" role="menuitemradio" aria-checked={theme === scheme.id} onClick={() => setTheme(scheme.id)} className="flex w-full justify-start gap-3 px-3 text-sm"><SchemeSwatch theme={scheme.id} /><span>{scheme.name}</span><span className="ml-auto w-4">{theme === scheme.id && <Check className="h-4 w-4" />}</span></Button>)}
    <Button variant="ghost" asChild className="w-full justify-start gap-3 px-3"><Link to="/compare" onClick={onNavigate}><Columns3 className="h-4 w-4" />Compare side by side</Link></Button>
  </div>;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-6 gap-1 rounded px-2 py-0.5 text-[11px] font-normal uppercase tracking-wide text-research-bar-foreground hover:bg-research-bar-foreground/10 hover:text-research-bar-foreground"><Palette className="h-3 w-3" />Color scheme<ChevronDown className="h-3 w-3" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-56 shadow-soft">
      <DropdownMenuLabel>Color scheme</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => { if (isColorScheme(value)) setTheme(value); }}>
        {COLOR_SCHEMES.map((scheme) => <DropdownMenuRadioItem key={scheme.id} value={scheme.id} className="gap-3 focus:bg-secondary focus:text-secondary-foreground"><SchemeSwatch theme={scheme.id} />{scheme.name}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="focus:bg-secondary focus:text-secondary-foreground"><Link to="/compare"><Columns3 className="h-4 w-4" />Compare side by side</Link></DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}