"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const toggleOptions = ["Residential Growth", "Council Alignment", "Income Resilience"] as const;

const postcodes = [
  {
    code: "BS3",
    area: "Bedminster, Bristol",
    insight:
      "Sustained approval rate increase across mid-density residential. Council alignment score shifted from resistant to permissive over 18 months.",
    approvals: "↑ 34%",
    alignment: "↑ High",
    income: "Stable",
  },
  {
    code: "LS9",
    area: "East Leeds",
    insight:
      "Large-scale residential approvals accelerating. Planning committee objections down 60% year-on-year.",
    approvals: "↑ 28%",
    alignment: "↑ Rising",
    income: "Stable",
  },
  {
    code: "M14",
    area: "Fallowfield, Manchester",
    insight:
      "Shift from HMO resistance to purpose-built residential. Decision speeds improving quarter-on-quarter.",
    approvals: "↑ 22%",
    alignment: "↑ Moderate",
    income: "Stable",
  },
];

const HeroSection = () => {
  const [activeToggle, setActiveToggle] = useState(0);

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pt-28">
        {/* Text */}
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold leading-[1.1] text-foreground sm:text-5xl lg:text-[3.25rem]">
            Spot SME growth opportunities like never before.
          </h1>
          <p className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
            Putting the small players at the same table as the giants.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Planning decisions change before the area does. We surface the earliest signals of
            residential growth and more, to let small business owners know the best places to set
            up their next store — tailored to their business.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground text-lg">
            The kind of planning intelligence usually locked behind consultants and private
            relationships — now available to independent investors and family-run property companies.
          </p>
          <Link
            href="/insight"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Explore growth signals
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Map + Panel */}
        <div className="mt-14 overflow-hidden rounded-lg border bg-card shadow-sm lg:grid lg:grid-cols-[1fr_340px]">
          {/* Map area */}
          <div className="relative min-h-[380px] lg:min-h-[480px]">
            <img
              src="/hero-map.jpg"
              alt="Heatmap showing residential growth signals across UK regions"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Toggle overlay */}
            <div className="absolute left-4 top-4 flex gap-1 rounded-md border bg-card/90 p-1 backdrop-blur-sm">
              {toggleOptions.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setActiveToggle(i)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeToggle === i
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Side panel */}
          <div className="border-t p-5 lg:border-l lg:border-t-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Top Recommended Postcodes
            </h3>
            <div className="mt-4 space-y-4">
              {postcodes.map((pc) => (
                <div key={pc.code} className="rounded-md border bg-muted/40 p-3.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm font-medium text-foreground">{pc.code}</span>
                    <span className="text-xs text-muted-foreground">{pc.area}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pc.insight}</p>
                  <div className="mt-3 flex gap-3 text-xs font-medium">
                    <span className="text-signal-up">{pc.approvals}</span>
                    <span className="text-signal-up">{pc.alignment}</span>
                    <span className="text-signal-stable">{pc.income}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
