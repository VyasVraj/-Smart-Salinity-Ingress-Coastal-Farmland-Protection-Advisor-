import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Advisory } from "@/components/site/Advisory";
import { Technology } from "@/components/site/Technology";
import { Impact } from "@/components/site/Impact";
import { CtaFooter } from "@/components/site/CtaFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SaltGuard — Smart Salinity Ingress & Coastal Farmland Advisor" },
      {
        name: "description",
        content:
          "Predict saltwater intrusion, plan leaching and pick salt-tolerant crops with SaltGuard's coastal farmland protection advisory.",
      },
      {
        property: "og:title",
        content: "SaltGuard — Smart Salinity Ingress & Coastal Farmland Advisor",
      },
      {
        property: "og:description",
        content:
          "Satellite and sensor-driven salinity forecasting with plot-level advice for coastal farmers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Advisory />
      <Technology />
      <Impact />
      <CtaFooter />
    </main>
  );
}
