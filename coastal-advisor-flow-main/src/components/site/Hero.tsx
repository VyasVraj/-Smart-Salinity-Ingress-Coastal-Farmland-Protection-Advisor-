import { ArrowRight, Droplets, Play, Sprout, Thermometer } from "lucide-react";
import heroCoast from "@/assets/hero-coast.jpg";
import { Reveal } from "@/components/Reveal";
import { useCountUp, useReveal, useScrollY } from "@/hooks/use-reveal";

const stats = [
  { value: 18400, suffix: "+", label: "Farmers advised", decimals: 0 },
  { value: 92, suffix: "k ha", label: "Coastline monitored", decimals: 0 },
  { value: 37, suffix: "%", label: "Salt damage avoided", decimals: 0 },
  { value: 2.4, suffix: " dS/m", label: "Avg. EC reduction", decimals: 1 },
];

function Stat({
  value,
  suffix,
  label,
  decimals,
  active,
}: (typeof stats)[number] & { active: boolean }) {
  const n = useCountUp(value, active);
  return (
    <div className="min-w-0">
      <p className="font-display text-2xl font-bold sm:text-3xl">
        {n >= 1000
          ? `${(n / 1000).toFixed(1)}k`
          : n.toFixed(decimals)}
        <span className="text-lime">{suffix}</span>
      </p>
      <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

const readings = [
  { icon: Droplets, label: "Soil salinity (EC)", value: "3.1 dS/m", tone: "text-warn" },
  { icon: Thermometer, label: "Groundwater depth", value: "4.2 m", tone: "text-teal" },
  { icon: Sprout, label: "Crop stress index", value: "Low", tone: "text-lime" },
];

export function Hero() {
  const y = useScrollY();
  const { ref, shown } = useReveal<HTMLDivElement>(0.2);

  return (
    <section id="top" className="relative overflow-hidden px-3 pt-24 sm:px-6 sm:pt-28">
      <div className="grain relative mx-auto flex min-h-[640px] max-w-7xl flex-col justify-end overflow-hidden rounded-4xl lg:min-h-[86svh]">
        <img
          src={heroCoast}
          alt="Farmer reviewing salinity data on a tablet above coastal paddy fields at sunrise"
          width={1920}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `translateY(${y * 0.1}px) scale(1.1)` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />

        <div className="relative flex flex-col gap-8 p-5 pt-40 sm:p-10 sm:pt-56">

          <div className="max-w-2xl">
            <Reveal from="left">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-lime backdrop-blur">
                <span className="relative grid h-2 w-2 place-items-center">
                  <span className="absolute h-2 w-2 animate-pulse-ring rounded-full bg-lime" />
                  <span className="h-2 w-2 rounded-full bg-lime" />
                </span>
                SALINITY INGRESS EARLY WARNING
              </span>
            </Reveal>
            <Reveal from="up" delay={120}>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                Guarding Soil.
                <br />
                <span className="text-gradient-lime">Growing Coastlines.</span>
              </h1>
            </Reveal>
            <Reveal from="up" delay={220}>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                SaltGuard fuses satellite imagery, tidal models and in-field sensors to
                predict saltwater intrusion before it reaches the root zone — then tells
                each farmer exactly what to irrigate, plant and amend.
              </p>
            </Reveal>
            <Reveal from="up" delay={320}>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#advisory"
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-lime px-6 py-3 text-sm font-semibold text-primary-foreground glow transition-transform duration-200 hover:scale-105"
                >
                  Explore Advisory
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#technology"
                  className="inline-flex items-center gap-3 rounded-full border border-border px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-secondary"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-border">
                    <Play className="h-3.5 w-3.5" />
                  </span>
                  How it works
                </a>
              </div>
            </Reveal>
          </div>

          <div
            ref={ref}
            className="panel grid grid-cols-2 gap-6 rounded-3xl p-5 sm:grid-cols-4 sm:p-6"
          >
            {stats.map((s) => (
              <Stat key={s.label} {...s} active={shown} />
            ))}
          </div>
        </div>

        <Reveal
          from="right"
          delay={400}
          className="absolute right-4 top-24 hidden w-64 lg:block"
        >
          <div className="panel animate-float rounded-3xl p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-lime">Live field probe</span>
              <span className="text-muted-foreground">Kutch · P-14</span>
            </div>
            <ul className="mt-4 space-y-3">
              {readings.map((r) => (
                <li key={r.label} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary">
                    <r.icon className={`h-4 w-4 ${r.tone}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {r.label}
                    </span>
                    <span className={`block text-sm font-semibold ${r.tone}`}>
                      {r.value}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
