import { Check } from "lucide-react";

const points = [
  "Most tools show what's already expensive",
  "We show where the rules are changing",
  "Built on planning behaviour, not price history",
  "Designed for independent investors, not just institutions",
];

const DifferentiatorSection = () => (
  <section className="border-t py-20">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Not another &ldquo;hot areas&rdquo; map
        </h2>
        <ul className="mt-8 space-y-4">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
              <span className="text-base text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default DifferentiatorSection;
