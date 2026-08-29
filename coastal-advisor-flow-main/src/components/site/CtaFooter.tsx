import { ArrowRight, Waves } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export function CtaFooter() {
  return (
    <section id="contact" className="px-4 pb-10 sm:px-6">
      <Reveal from="up">
        <div className="grain panel mx-auto max-w-6xl overflow-hidden rounded-4xl p-8 sm:p-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold leading-tight sm:text-5xl">
                Together, let&apos;s hold the line
                <br />
                <span className="text-gradient-lime">against the salt.</span>
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                Join farmer collectives, panchayats and coastal research teams using
                SaltGuard to keep farmland productive as seas rise.
              </p>
            </div>

            <form
              className="panel rounded-3xl p-5"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Request advisory access"
            >
              <label
                className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground"
                htmlFor="village"
              >
                YOUR VILLAGE OR BLOCK
              </label>
              <input
                id="village"
                placeholder="e.g. Sundarban, Block 4"
                className="mt-2 w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-lime"
              />
              <label
                className="mt-4 block text-[11px] font-semibold tracking-[0.18em] text-muted-foreground"
                htmlFor="phone"
              >
                MOBILE NUMBER
              </label>
              <input
                id="phone"
                inputMode="tel"
                placeholder="+91 00000 00000"
                className="mt-2 w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-lime"
              />
              <button
                type="submit"
                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-lime py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Get my salinity report
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>
      </Reveal>

      <footer className="mx-auto mt-10 grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border py-8 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-lime">
            <Waves className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="truncate text-sm font-semibold">
            SaltGuard · Coastal Farmland Protection Advisor
          </span>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SaltGuard
        </p>
      </footer>
    </section>
  );
}
