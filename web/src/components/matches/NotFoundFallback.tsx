export function NotFoundFallback() {
  return (
    <main className="container mx-auto max-w-2xl py-24">
      <p className="eyebrow text-navy-950/60">NOT FOUND</p>
      <h1 className="font-display text-3xl text-navy-950 mt-2">
        We can&rsquo;t find that shortlist
      </h1>
      <p className="text-navy-950/70 mt-4">
        The match link may have expired or the token is invalid. If you just submitted
        an enquiry, please check your email for a fresh link.
      </p>
    </main>
  );
}
