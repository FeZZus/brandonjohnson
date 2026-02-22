import { Activity, BarChart3, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Detect council regime shifts",
    description:
      "Identify areas where approval behaviour signals a structural change in planning resistance.",
  },
  {
    icon: BarChart3,
    title: "Measure residential build momentum",
    description:
      "Track where small, medium, and large residential approvals are accelerating over time.",
  },
  {
    icon: ShieldCheck,
    title: "Validate demand absorption",
    description:
      "Use income resilience as a proxy for whether new supply can be absorbed without price compression.",
  },
];

const FeaturesSection = () => (
  <section className="border-t py-20">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
        What the platform does
      </h2>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-6">
            <f.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
            <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
