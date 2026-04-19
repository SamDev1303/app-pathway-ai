interface MatchesHeroProps {
  firstName: string;
}

export function MatchesHero({ firstName }: MatchesHeroProps) {
  return (
    <header className="mt-10 mb-8">
      <p className="eyebrow text-navy-950/60">YOUR SHORTLIST · ATLAS AI</p>
      <h1 className="font-display text-4xl md:text-5xl text-navy-950 mt-2">
        Your top matches
      </h1>
      <p className="text-navy-950/70 mt-3 max-w-xl">
        {firstName}, here are the Australian universities that best match your profile.
      </p>
    </header>
  );
}
