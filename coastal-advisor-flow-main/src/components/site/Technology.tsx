import { Check, Gauge, Layers3, MapPinned, Satellite, SlidersHorizontal } from "lucide-react";
import fieldAerial from "@/assets/field-aerial.jpg";
import { Reveal } from "@/components/Reveal";
import { useReveal } from "@/hooks/use-reveal";

const bullets = [
  "Sentinel-2 salinity indices refreshed every 5 days",
  "Low-cost EC probes over LoRaWAN mesh",
  "Tidal + aquifer intrusion simulation",
  "Voice advisories in regional languages",
];

const bars = [42, 61, 38, 74, 55, 88, 66, 49];

export function Technology() {
  const { ref, shown } = useReveal<HTMLDivElement>(0.25);

  return (
    <section id="technology" className="px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal from="left">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-lime">
            OUR TECHNOLOGY
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
            Satellites. Sensors.
            <br />
            <span className="text-gradient-lime">Better Decisions.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            We combine remote sensing with ground truth from village-level probes, so the
            salinity map a farmer opens is measured, not guessed.
          </p>
          <ul className="mt-7 space-y-3">
            {bullets.map((b, i) => (
              <Reveal key={b} from="left" delay={140 + i * 90}>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime/15">
                    <Check className="h-3 w-3 text-lime" />
                  </span>
                  {b}
                </li>
              </Reveal>
            ))}
          </ul>
          <a
            href="#contact"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-lime px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            Request a field pilot
          </a>
        </Reveal>

        <Reveal from="right" delay={100}>
          <div ref={ref} className="panel rounded-4xl p-4 sm:p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1 pb-4 sm:flex sm:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <MapPinned className="h-4 w-4 shrink-0 text-lime" />
                <span className="truncate text-sm font-semibold">
                  Coastal Block Overview
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                Updated 4 min ago
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[11px] text-muted-foreground">Intrusion risk</p>
                <p className="mt-1 font-display text-2xl font-bold text-warn">Medium</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-gradient-lime transition-[width] duration-1000 ease-out"
                    style={{ width: shown ? "58%" : "0%" }}
                  />
                </div>
              </div>
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[11px] text-muted-foreground">Safe irrigation window</p>
                <p className="mt-1 font-display text-2xl font-bold text-lime">36 h</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Next high tide 04:10
                </p>
              </div>
              <div className="rounded-2xl bg-surface-2 p-4">
                <p className="text-[11px] text-muted-foreground">Plots monitored</p>
                <p className="mt-1 font-display text-2xl font-bold">148</p>
                <p className="mt-2 text-[11px] text-teal">12 flagged for leaching</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={fieldAerial}
                  alt="Aerial view of coastal farm plots with salt-affected patches"
                  width={1280}
                  height={800}
                  loading="lazy"
                  className="h-52 w-full object-cover sm:h-60"
                />
                <div className="absolute inset-0 bg-gradient-hero opacity-70" />
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-[11px] backdrop-blur">
                  <Satellite className="h-3.5 w-3.5 text-teal" />
                  Salinity index overlay
                </div>
                <span className="absolute left-[38%] top-[46%] grid h-4 w-4 place-items-center">
                  <span className="absolute h-4 w-4 animate-pulse-ring rounded-full bg-warn" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warn" />
                </span>
                <span className="absolute left-[68%] top-[64%] grid h-4 w-4 place-items-center">
                  <span className="absolute h-4 w-4 animate-pulse-ring rounded-full bg-lime" />
                  <span className="h-2.5 w-2.5 rounded-full bg-lime" />
                </span>
              </div>

              <div className="rounded-2xl bg-surface-2 p-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5 text-lime" />
                  EC trend · 8 weeks
                </div>
                <div className="mt-4 flex h-28 items-end gap-2">
                  {bars.map((h, i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-t-md bg-gradient-lime ${shown ? "animate-grow-bar" : ""}`}
                      style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Layers3 className="h-3.5 w-3.5" /> 3 layers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Auto-tuned
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
