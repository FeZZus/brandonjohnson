const actionCards = [
  {
    code: "BS3",
    area: "Bedminster, Bristol",
    rationale:
      "Council approval rates have crossed the permissive threshold. Mid-density residential applications are being processed 40% faster than 12 months ago.",
    approvals: "↑ 34%",
    alignment: "↑ High",
    income: "Stable",
  },
  {
    code: "LS9",
    area: "East Leeds",
    rationale:
      "Planning committee objections have dropped sharply. Two large-scale residential schemes approved in Q3 with minimal conditions attached.",
    approvals: "↑ 28%",
    alignment: "↑ Rising",
    income: "Stable",
  },
  {
    code: "SE18",
    area: "Woolwich, London",
    rationale:
      "Crossrail completion and regeneration zone status driving sustained shift in council stance. Small-lot approvals trending upward.",
    approvals: "↑ 19%",
    alignment: "↑ Moderate",
    income: "Stable",
  },
];

const SignalToActionSection = () => (
  <section className="border-t bg-card py-20">
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
          From signal to action
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Instead of static reports, the platform ranks the most promising postcodes in real time and surfaces live property listings — allowing users to act before growth becomes obvious.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actionCards.map((card) => (
          <div
            key={card.code}
            className="rounded-lg border bg-background p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-semibold text-foreground">{card.code}</span>
              <span className="text-xs text-muted-foreground">{card.area}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.rationale}</p>
            <div className="mt-4 flex gap-4 border-t pt-3 text-xs font-medium">
              <div>
                <span className="text-muted-foreground">Approvals </span>
                <span className="text-signal-up">{card.approvals}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Alignment </span>
                <span className="text-signal-up">{card.alignment}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Income </span>
                <span className="text-signal-stable">{card.income}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SignalToActionSection;
