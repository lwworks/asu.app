import { Logo } from "@/components/visuals/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/auth";
import {
  ArrowRight,
  Check,
  Clock,
  Building2,
  Users,
  WifiOff,
  Zap,
  Shield,
  AlertTriangleIcon,
  ChevronRight,
  FileText,
  Flame,
  Gauge,
  MonitorSmartphone,
} from "lucide-react";

export const Route = createFileRoute({
  component: HomepagePage,
});

function HomepagePage() {
  return (
    <div className="min-h-screen bg-[oklch(0.141_0.005_285.823)] text-[oklch(0.985_0_0)]">
      <Navbar />
      <Hero />
      <ProductPreview />
      <ProblemStatement />
      <Features />
      <HowItWorks />
      <ImageBreak />
      <Compliance />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

function Navbar() {
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[oklch(0.141_0.005_285.823)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 flex h-16 items-center justify-between">
        <Logo className="h-5 text-white" />
        <nav className="flex items-center gap-2">
          {!isLoading && user ? (
            <Button size="sm" asChild>
              <a href="/">
                Zur Atemschutzüberwachung <ArrowRight />
              </a>
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10"
                asChild
              >
                <a href="/anmelden">Anmelden</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/registrieren">Kostenlos starten</a>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  const { user, isLoading } = useAuth();

  return (
    <section className="relative overflow-hidden pt-24 pb-16 px-6">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(241,255,0,0.08)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70">
          <span className="size-2 rounded-full bg-[#F1FF00] animate-pulse" />
          Echtzeit-Synchronisierung für alle Endgeräte
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.08]">
          Atemschutz&shy;überwachung.{" "}
          <span className="text-[#F1FF00]">Digital.</span>
        </h1>
        <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
          ASÜ.APP digitalisiert die Einsatzdokumentation für Feuerwehren und
          Hilfsorganisationen – in Echtzeit synchronisiert, offline-fähig und
          intuitiv bedienbar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {!isLoading && user ? (
            <Button size="lg" asChild>
              <a href="/">
                Zur Atemschutzüberwachung <ArrowRight />
              </a>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <a href="/registrieren">
                  Kostenlos starten <ArrowRight />
                </a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white/60 hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="/anmelden">Zur Anmeldung</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Product Preview – Fake app screenshot built with styled components
// ---------------------------------------------------------------------------

function ProductPreview() {
  return (
    <section className="relative px-6 pb-24">
      {/* Fade from section above */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent to-transparent" />

      <div className="mx-auto max-w-6xl">
        {/* Browser chrome frame */}
        <div className="rounded-xl border border-white/10 bg-[oklch(0.18_0.005_285.8)] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 h-10 bg-[oklch(0.16_0.005_285.8)] border-b border-white/10">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-white/10" />
              <div className="size-3 rounded-full bg-white/10" />
              <div className="size-3 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-xs text-white/30 bg-white/5 rounded px-3 py-0.5">
                app.asu.app
              </div>
            </div>
            <div className="w-[54px]" />
          </div>

          {/* App header */}
          <div className="border-b border-white/10 px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center gap-3 text-sm text-white/50">
                <Logo className="h-3.5 text-white" />
                <ChevronRight className="size-3 text-white/30" />
                <span className="text-white/70">FF Musterstadt</span>
                <ChevronRight className="size-3 text-white/30" />
                <span className="text-white/70">Wohnungsbrand Musterstraße 12</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-[#F1FF00]" />
                <span className="text-xs text-white/70">26.03.2026 14:32:08</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs -mb-px pb-2.5">
              <span className="text-white/40">Übersicht</span>
              <span className="text-white border-b border-[#F1FF00] pb-2.5">
                Trupps
              </span>
              <span className="text-white/40">Export</span>
            </div>
          </div>

          {/* App content – squad cards */}
          <div className="p-6 flex gap-4 overflow-hidden">
            {/* Squad 1 – Active */}
            <MockSquadCard
              name="Angriffstrupp"
              status="active"
              statusLabel="Aktiv"
              members={[
                { name: "Schmidt, M.", role: "TF", pressure: "280" },
                { name: "Weber, K.", pressure: "300" },
              ]}
              duration="12:34"
              pressure={210}
              critical={false}
            />

            {/* Squad 2 – Active, lower pressure */}
            <MockSquadCard
              name="Sicherungstrupp"
              status="active"
              statusLabel="Aktiv"
              members={[
                { name: "Fischer, T.", role: "TF", pressure: "300" },
                { name: "Braun, L.", pressure: "290" },
              ]}
              duration="24:51"
              pressure={85}
              critical={false}
            />

            {/* Squad 3 – Critical */}
            <MockSquadCard
              name="2. Angriffstrupp"
              status="critical"
              statusLabel="Aktiv"
              members={[
                { name: "Müller, A.", role: "TF", pressure: "260" },
                { name: "Koch, S.", pressure: "240" },
              ]}
              duration="31:17"
              pressure={45}
              critical={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockSquadCard({
  name,
  status,
  statusLabel,
  members,
  duration,
  pressure,
  critical,
}: {
  name: string;
  status: "active" | "critical" | "standby";
  statusLabel: string;
  members: { name: string; role?: string; pressure: string }[];
  duration: string;
  pressure: number;
  critical: boolean;
}) {
  return (
    <div className="w-80 shrink-0 rounded-xl border border-white/10 bg-[oklch(0.21_0.006_285.885)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <span className="font-semibold text-sm text-white">{name}</span>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded font-medium",
            critical
              ? "bg-red-500/15 text-red-400"
              : status === "active"
                ? "bg-[#F1FF00]/15 text-[#F1FF00]"
                : "bg-white/10 text-white/50"
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Members */}
      <div className="divide-y divide-white/5">
        {members.map((m) => (
          <div
            key={m.name}
            className="flex items-center justify-between px-5 py-2.5 text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-white/90">{m.name}</span>
              {m.role && (
                <span className="text-[10px] font-bold bg-white/10 text-white/50 px-1.5 py-0.5 rounded">
                  {m.role}
                </span>
              )}
            </div>
            <span className="font-mono text-xs text-white/40">
              {m.pressure} bar
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
        <div className="px-5 py-3.5">
          <div className="text-2xl font-mono text-white">{duration}</div>
          <div className="text-[10px] uppercase tracking-wider text-white/35 mt-0.5">
            im Einsatz
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "text-2xl font-mono",
                critical ? "text-red-400" : "text-[#F1FF00]"
              )}
            >
              {pressure}
            </div>
            {critical && (
              <AlertTriangleIcon className="size-5 text-red-400" />
            )}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-white/35 mt-0.5">
            Restdruck
          </div>
        </div>
      </div>

      {/* Pressure bar */}
      <div className="relative w-full h-2 border-y border-white/10 bg-white/5">
        <div
          className={cn(
            "h-full transition-all",
            critical ? "bg-red-400" : "bg-[#F1FF00]"
          )}
          style={{ width: `${(pressure / 300) * 100}%` }}
        />
        <div className="absolute inset-y-0 left-1/6 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-2/3 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-5/6 w-px bg-white/10" />
      </div>

      {/* Pressure labels */}
      <div className="flex text-[9px] uppercase text-white/20 font-medium tracking-wider text-center px-6 py-1">
        <div className="w-1/5 shrink-0">50</div>
        <div className="w-1/5 shrink-0">100</div>
        <div className="w-1/5 shrink-0">150</div>
        <div className="w-1/5 shrink-0">200</div>
        <div className="w-1/5 shrink-0">250</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Problem Statement
// ---------------------------------------------------------------------------

function ProblemStatement() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70">
              <Flame className="size-4 text-[#F1FF00]" />
              Das Problem
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Zettel, Stoppuhr und Klemmbrett waren gestern
            </h2>
            <div className="space-y-4 text-white/50 leading-relaxed">
              <p>
                Noch immer setzen viele Feuerwehren auf handschriftliche
                Atemschutzüberwachung: Papiervordrucke, analoge Stoppuhren und
                manuelle Druckwerte-Notizen. Im Einsatz bedeutet das Stress,
                Fehleranfälligkeit und unvollständige Dokumentation.
              </p>
              <p>
                Verlorene Zettel, unleserliche Einträge und fehlende Nachweise
                sind die Folge – und im Ernstfall ein echtes Sicherheitsrisiko
                für die eingesetzten Kräfte.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              {
                title: "Fehlerhafte Dokumentation",
                description:
                  "Handschriftliche Protokolle sind unleserlich, unvollständig oder gehen im Einsatzgeschehen verloren.",
              },
              {
                title: "Kein Echtzeitüberblick",
                description:
                  "Der Atemschutzüberwacher hat nur lokale Informationen – andere Führungskräfte sind blind.",
              },
              {
                title: "Nachweispflicht gefährdet",
                description:
                  "Ohne lückenlose Dokumentation fehlen die Nachweise für Unfallversicherung und Aufsichtsbehörden.",
              },
              {
                title: "Aufwändige Nachbereitung",
                description:
                  "Einsatzberichte müssen im Nachhinein mühsam aus handschriftlichen Notizen rekonstruiert werden.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2"
              >
                <h3 className="font-semibold text-white text-sm">
                  {item.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
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
  {
    icon: Gauge,
    title: "Drucküberwachung",
    description:
      "Restdruck und Einsatzzeiten im Blick behalten – mit automatischen Warnungen bei kritischen Werten.",
  },
  {
    icon: FileText,
    title: "Einsatzberichte",
    description:
      "Vollständige Einsatzberichte automatisch generieren – exportierbar als PDF für die Nachweisführung.",
  },
  {
    icon: MonitorSmartphone,
    title: "Jedes Endgerät",
    description:
      "Ob Tablet, Smartphone oder Desktop – ASÜ.APP funktioniert plattformübergreifend im Browser.",
  },
];

function Features() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Alles, was moderne ASÜ braucht
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Von der Einsatzerstellung bis zum Abschlussbericht – ASÜ.APP
            begleitet euch durch jeden Einsatz.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group space-y-3 p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <feature.icon className="size-5 text-[#F1FF00]" />
              </div>
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">
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
// How It Works
// ---------------------------------------------------------------------------

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Konto erstellen",
      description:
        "Registrierung in unter einer Minute. Organisation anlegen und Kameraden per Einladungslink hinzufügen.",
    },
    {
      step: "02",
      title: "Personal anlegen",
      description:
        "Einsatzkräfte mit Qualifikationen, G26-Terminen und Ausbildungsnachweisen hinterlegen.",
    },
    {
      step: "03",
      title: "Einsatz starten",
      description:
        "Einsatz anlegen, Trupps zusammenstellen und Atemschutzüberwachung in Echtzeit starten.",
    },
    {
      step: "04",
      title: "Dokumentieren & exportieren",
      description:
        "Alle Daten werden automatisch protokolliert – nach dem Einsatz als PDF-Bericht exportieren.",
    },
  ];

  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            In vier Schritten startklar
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Kein aufwändiges Setup, keine Schulung nötig – ASÜ.APP ist sofort
            einsatzbereit.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.step} className="relative space-y-4">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -translate-x-4" />
              )}
              <div className="text-4xl font-bold text-[#F1FF00]/20">
                {step.step}
              </div>
              <h3 className="font-semibold text-white text-lg">
                {step.title}
              </h3>
              <p className="text-sm text-white/40 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Image Break – Firefighter action shot
// ---------------------------------------------------------------------------

function ImageBreak() {
  return (
    <section className="relative h-[480px] overflow-hidden">
      <img
        src="/img/atemschutz-platzhalter.jpg"
        alt="Atemschutzgeräteträger im Einsatz"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.141_0.005_285.823)] via-[oklch(0.141_0.005_285.823)]/60 to-[oklch(0.141_0.005_285.823)]/30" />
      <div className="absolute inset-0 flex items-end px-6 pb-16">
        <div className="mx-auto max-w-6xl w-full">
          <blockquote className="max-w-2xl space-y-4">
            <p className="text-2xl font-semibold leading-snug sm:text-3xl">
              &bdquo;Sicherheit beginnt mit Übersicht – digitale
              Atemschutzüberwachung rettet Leben.&ldquo;
            </p>
            <p className="text-white/50 text-sm">
              Entwickelt in enger Zusammenarbeit mit aktiven
              Feuerwehrangehörigen
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Compliance / FwDV 7
// ---------------------------------------------------------------------------

function Compliance() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70">
              <Shield className="size-4 text-[#F1FF00]" />
              Normenkonform
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Dokumentation gemäß FwDV&nbsp;7
            </h2>
            <p className="text-white/50 leading-relaxed">
              Die Feuerwehr-Dienstvorschrift 7 regelt den Atemschutzeinsatz in
              Deutschland und schreibt eine lückenlose Überwachung und
              Dokumentation vor. ASÜ.APP unterstützt euch dabei, diese
              Anforderungen digital und zuverlässig zu erfüllen.
            </p>
            <ul className="space-y-3">
              {[
                "Lückenlose Protokollierung aller Truppeinsätze",
                "Zeitstempel für Vornahme, Druckmeldungen und Rückzug",
                "Automatische Einsatzberichte mit allen relevanten Daten",
                "Nachweis gegenüber Unfallversicherungsträgern",
                "DSGVO-konforme Datenhaltung in Deutschland",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-white/70"
                >
                  <Check className="size-4 mt-0.5 shrink-0 text-[#F1FF00]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "100%", label: "Offline-fähig" },
              { value: "<1 Min", label: "Setup-Zeit" },
              { value: "FwDV 7", label: "Konform" },
              { value: "DSGVO", label: "Datenschutz" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-xl border border-white/10 bg-white/[0.02] text-center space-y-2"
              >
                <div className="text-3xl font-bold text-[#F1FF00]">
                  {stat.value}
                </div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
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
    <section className="py-24 px-6 border-t border-white/5">
      <div className="mx-auto max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Einfache Preise
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Transparent und fair – ohne versteckte Kosten.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-xl border p-8 space-y-8",
                plan.highlighted
                  ? "bg-[#F1FF00] text-black border-[#F1FF00] shadow-[0_0_60px_-12px_rgba(241,255,0,0.3)]"
                  : "bg-white/[0.02] border-white/10"
              )}
            >
              <div className="space-y-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    plan.highlighted ? "text-black/50" : "text-white/40"
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
                        plan.highlighted ? "text-black/50" : "text-white/40"
                      )}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm",
                    plan.highlighted ? "text-black/60" : "text-white/40"
                  )}
                >
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <Check
                      className={cn(
                        "size-4 mt-0.5 shrink-0",
                        plan.highlighted ? "text-black/70" : "text-[#F1FF00]"
                      )}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant={plan.highlighted ? "default" : "outline"}
                className={cn(
                  "w-full",
                  plan.highlighted
                    ? "bg-black text-[#F1FF00] hover:bg-black/80"
                    : "border-white/15 text-white hover:bg-white/10 bg-transparent"
                )}
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
// FAQ
// ---------------------------------------------------------------------------

const faqs = [
  {
    question: "Brauche ich spezielle Hardware?",
    answer:
      "Nein. ASÜ.APP läuft im Browser auf jedem Tablet, Smartphone oder Desktop. Ihr braucht nur ein internetfähiges Gerät – und dank Offline-Modus funktioniert die App auch ohne aktive Verbindung.",
  },
  {
    question: "Ist ASÜ.APP auch offline einsetzbar?",
    answer:
      "Ja. Alle Daten werden lokal auf dem Gerät gespeichert und automatisch synchronisiert, sobald wieder eine Internetverbindung besteht. Einsätze können vollständig offline durchgeführt werden.",
  },
  {
    question: "Entspricht ASÜ.APP der FwDV 7?",
    answer:
      "ASÜ.APP unterstützt euch bei der Einhaltung der Feuerwehr-Dienstvorschrift 7. Alle Truppeinsätze werden mit Zeitstempeln, Druckmeldungen und Statusänderungen lückenlos protokolliert.",
  },
  {
    question: "Wie funktioniert die Synchronisierung zwischen Geräten?",
    answer:
      "ASÜ.APP nutzt Event-Sourcing mit Echtzeit-Synchronisierung. Alle Änderungen werden sofort auf alle verbundenen Geräte eurer Organisation übertragen – ohne manuelles Aktualisieren.",
  },
  {
    question: "Kann ich ASÜ.APP mit mehreren Feuerwehren nutzen?",
    answer:
      "Ja. Die App ist mehrmandantenfähig – ihr könnt zwischen mehreren Organisationen wechseln. Ideal für Kreisfeuerwehren oder Kameraden, die in mehreren Wehren aktiv sind.",
  },
  {
    question: "Wo werden meine Daten gespeichert?",
    answer:
      "Alle Daten werden DSGVO-konform in Deutschland verarbeitet und gespeichert. Die lokale Speicherung auf euren Geräten sorgt zusätzlich für maximale Verfügbarkeit.",
  },
];

function Faq() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="mx-auto max-w-3xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Häufige Fragen
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Alles, was ihr vor dem Start wissen müsst.
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-3"
            >
              <h3 className="font-semibold text-white">{faq.question}</h3>
              <p className="text-sm text-white/45 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA Section
// ---------------------------------------------------------------------------

function Cta() {
  const { user, isLoading } = useAuth();

  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-4xl text-center space-y-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Bereit für digitale Atemschutzüberwachung?
        </h2>
        <p className="text-white/45 text-lg max-w-xl mx-auto">
          Startet jetzt kostenlos und überzeugt euch selbst. Keine
          Kreditkarte nötig, keine Verpflichtungen.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {!isLoading && user ? (
            <Button size="lg" asChild>
              <a href="/">
                Zur Atemschutzüberwachung <ArrowRight />
              </a>
            </Button>
          ) : (
            <>
              <Button size="lg" asChild>
                <a href="/registrieren">
                  Kostenlos starten <ArrowRight />
                </a>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white/60 hover:bg-white/10 hover:text-white"
                asChild
              >
                <a href="mailto:hallo@asu.app">Fragen? Schreibt uns</a>
              </Button>
            </>
          )}
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
    <footer className="border-t border-white/10 py-12 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo className="h-4 text-white/40" />
        <p className="text-sm text-white/30">
          © {new Date().getFullYear()} ASÜ.APP – Alle Rechte vorbehalten
        </p>
        <div className="flex gap-6 text-sm text-white/30">
          <a href="#" className="hover:text-white transition-colors">
            Datenschutz
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Impressum
          </a>
        </div>
      </div>
    </footer>
  );
}
