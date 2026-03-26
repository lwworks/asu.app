import { Logo } from "@/components/visuals/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  ArrowRight,
  Check,
  Clock,
  Building2,
  Users,
  WifiOff,
  Zap,
  Shield,
} from "lucide-react";

export const Route = createFileRoute({
  component: HomepagePage,
});

function HomepagePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
        <Logo className="h-5 text-foreground" />
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="/anmelden">Anmelden</a>
          </Button>
          <Button size="sm" asChild>
            <a href="/registrieren">Kostenlos starten</a>
          </Button>
        </nav>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="bg-foreground text-background py-32 px-6">
      <div className="mx-auto max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-1.5 text-sm">
          <span className="size-2 rounded-full bg-primary" />
          Echtzeit-Synchronisierung für alle Endgeräte
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]">
          Atemschutz&shy;überwachung.{" "}
          <span className="text-primary">Digital.</span>
        </h1>
        <p className="text-lg text-background/65 max-w-2xl mx-auto leading-relaxed">
          ASÜ.APP digitalisiert die Einsatzdokumentation für Feuerwehren und
          Hilfsorganisationen – in Echtzeit synchronisiert, offline-fähig und
          intuitiv bedienbar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button size="lg" asChild>
            <a href="/registrieren">
              Kostenlos starten <ArrowRight />
            </a>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-background hover:bg-background/10 hover:text-background"
            asChild
          >
            <a href="/anmelden">Zur Anmeldung</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const features = [
  {
    icon: Zap,
    title: "Echtzeitsynchronisierung",
    description:
      "Alle Geräte im Einsatz bleiben automatisch synchronisiert – ohne manuelles Aktualisieren.",
  },
  {
    icon: WifiOff,
    title: "Offline-fähig",
    description:
      "ASÜ.APP funktioniert auch ohne Internetverbindung und synchronisiert sich, sobald die Verbindung wiederhergestellt ist.",
  },
  {
    icon: Shield,
    title: "Einsatzverwaltung",
    description:
      "Einsätze anlegen, dokumentieren und abschließen – vollständig und nachvollziehbar.",
  },
  {
    icon: Users,
    title: "Truppüberwachung",
    description:
      "Trupps in Echtzeit verfolgen: Status, Eintrittzeit, Luftvorrat und Protokoll auf einen Blick.",
  },
  {
    icon: Clock,
    title: "Personalverwaltung",
    description:
      "Kräfte mit Ausbildungsnachweisen, G26-Untersuchungen und Qualifikationen verwalten.",
  },
  {
    icon: Building2,
    title: "Mehrmandantenfähig",
    description:
      "Eine App für mehrere Organisationen – ideal für Kreisfeuerwehren und übergeordnete Verbände.",
  },
];

function Features() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Alles, was moderne ASÜ braucht
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Von der Einsatzerstellung bis zum Abschlussbericht – ASÜ.APP
            begleitet euch durch jeden Einsatz.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="space-y-3 p-6 rounded-xl border border-border bg-card"
            >
              <div className="size-10 rounded-lg bg-foreground flex items-center justify-center">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const plans = [
  {
    name: "Basis",
    price: "Kostenlos",
    period: null,
    description: "Für kleine Einheiten, die den digitalen Einstieg wagen.",
    features: [
      "1 Organisation",
      "Bis zu 5 aktive Nutzer",
      "Einsatz- und Truppverwaltung",
      "Personalverwaltung",
      "7 Tage Einsatzhistorie",
    ],
    cta: "Jetzt starten",
    href: "/registrieren",
    highlighted: false,
  },
  {
    name: "Standard",
    price: "29 €",
    period: "/ Monat",
    description: "Für aktive Feuerwehren mit regelmäßigen Einsätzen.",
    features: [
      "1 Organisation",
      "Unbegrenzte Nutzer",
      "Einsatz- und Truppverwaltung",
      "Personalverwaltung",
      "Vollständige Einsatzhistorie",
      "Einsatzberichte als PDF",
      "Priorität-Support",
    ],
    cta: "14 Tage kostenlos testen",
    href: "/registrieren",
    highlighted: true,
  },
  {
    name: "Verband",
    price: "Auf Anfrage",
    period: null,
    description: "Für Kreisfeuerwehren und Verbände mit mehreren Einheiten.",
    features: [
      "Mehrere Organisationen",
      "Unbegrenzte Nutzer",
      "Alle Standard-Funktionen",
      "Benutzerdefinierte Felder",
      "Dedizierter Support",
      "SLA-Garantie",
    ],
    cta: "Kontakt aufnehmen",
    href: "mailto:hallo@asu.app",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section className="py-24 px-6 bg-muted/40">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Einfache Preise
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Transparent und fair – ohne versteckte Kosten.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-xl border p-8 space-y-8",
                plan.highlighted
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border"
              )}
            >
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    plan.highlighted
                      ? "text-background/60"
                      : "text-muted-foreground"
                  )}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span
                      className={cn(
                        "text-sm",
                        plan.highlighted
                          ? "text-background/60"
                          : "text-muted-foreground"
                      )}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm",
                    plan.highlighted
                      ? "text-background/65"
                      : "text-muted-foreground"
                  )}
                >
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                asChild
              >
                <a href={plan.href}>{plan.cta}</a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo className="h-4 text-foreground" />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ASÜ.APP – Alle Rechte vorbehalten
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">
            Datenschutz
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Impressum
          </a>
        </div>
      </div>
    </footer>
  );
}
