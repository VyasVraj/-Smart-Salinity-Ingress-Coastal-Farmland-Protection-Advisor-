import { ArrowUpRight, CloudRain, FlaskConical, Layers, Waves } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const cards = [
  {
    icon: Waves,
    title: "Ingress Forecasting",
    body: "Tide, river discharge and groundwater models predict saltwater advance 14 days ahead, plot by plot.",
    tone: "text-teal",
  },
  {
    icon: CloudRain,
    title: "Smart Irrigation",
    body: "Leaching schedules that flush salts using the least freshwater, timed to rainfall windows.",
    tone: "text-lime",
  },
  {
    icon: FlaskConical,
    title: "Soil Remediation",
    body: "Gypsum, biochar and organic amendment dosing based on measured EC, pH and sodium ratios.",
    tone: "text-warn",
  },
  {
    icon: Layers,
    title: "Crop Substitution",
    body: "Salt-tolerant varieties and rotations matched to each field's tolerance and market price.",
    tone: "text-salt",
  },
];

export function Advisory() {
  return (
    <section id="advisory" className="relative px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal from="left">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-lime">
              WHAT WE ADVISE
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              Protection Plans
              <br />
              for Every Coastal Plot
            </h2>
          </Reveal>
          <Reveal from="right" delay={120}>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              From aquifer to acre, SaltGuard turns salinity data into decisions a farmer
              can act on this week — and a coastline that stays farmable for decades.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c, i) => (
            <Reveal key={c.title} from="up" delay={i * 110}>
              <article className="panel group h-full rounded-3xl p-6 transition-all duration-500 hover:-translate-y-2 hover:border-lime/40">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary transition-colors group-hover:bg-lime/15">
                  <c.icon className={`h-5.5 w-5.5 ${c.tone}`} />
                </span>
                <h3 className="mt-6 text-lg font-semibold">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {c.body}
                </p>
                <span className="mt-8 grid h-9 w-9 place-items-center rounded-full border border-border transition-all group-hover:bg-gradient-lime">
                  <ArrowUpRight className="h-4 w-4 transition-colors group-hover:text-primary-foreground" />
                </span>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
