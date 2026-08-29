import { Reveal } from "@/components/Reveal";

const steps = [
  {
    step: "01",
    title: "Map",
    body: "We baseline soil EC, groundwater and elevation across the block.",
  },
  {
    step: "02",
    title: "Monitor",
    body: "Probes and satellites track salt movement through the season.",
  },
  {
    step: "03",
    title: "Warn",
    body: "Farmers get an SMS or voice alert before intrusion peaks.",
  },
  {
    step: "04",
    title: "Recover",
    body: "Leaching, amendment and crop plans restore yields plot by plot.",
  },
];

const marquee = [
  "Mangrove buffers",
  "Salt-tolerant paddy",
  "Tidal sluice timing",
  "Aquifer recharge",
  "Gypsum dosing",
  "Drip + mulch",
  "Bund repair",
  "Agro-advisory SMS",
];

export function Impact() {
  return (
    <section id="impact" className="overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal from="up">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-lime">
            HOW IT WORKS
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
            Four steps from salt stress to steady harvest
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.step} from="scale" delay={i * 120}>
              <div className="panel h-full rounded-3xl p-6 transition-transform duration-500 hover:-translate-y-1.5">
                <p className="font-display text-4xl font-extrabold text-lime/25">
                  {s.step}
                </p>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="relative mt-20 flex w-full overflow-hidden border-y border-border py-5">
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {[...marquee, ...marquee].map((m, i) => (
            <span
              key={`${m}-${i}`}
              className="flex items-center gap-10 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              {m}
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
