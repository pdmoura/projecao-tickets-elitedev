type PageSkeletonProps = {
  cards?: number;
  detail?: boolean;
};

export function PageSkeleton({ cards = 3, detail = false }: PageSkeletonProps) {
  return (
    <main aria-busy="true" aria-label="Carregando conteúdo" className="min-h-screen bg-paper px-6 py-8 text-ink sm:px-10 lg:px-16" role="status">
      <p className="sr-only">Carregando conteúdo</p>
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-10 border-b border-rule" />
        {detail ? (
          <div className="mt-12 grid gap-8 md:grid-cols-[minmax(13rem,20rem)_minmax(0,1fr)]">
            <div className="aspect-[2/3] bg-surface-secondary" />
            <div className="space-y-5 pt-2">
              <div className="h-3 w-28 bg-surface-secondary" />
              <div className="h-14 max-w-2xl bg-surface-secondary" />
              <div className="h-20 max-w-xl bg-surface-secondary" />
              <div className="grid grid-cols-2 gap-px bg-rule"><div className="h-20 bg-surface" /><div className="h-20 bg-surface" /></div>
            </div>
          </div>
        ) : (
          <>
            <section className="space-y-5 py-14">
              <div className="h-3 w-32 bg-surface-secondary" />
              <div className="h-14 max-w-2xl bg-surface-secondary" />
              <div className="h-6 max-w-xl bg-surface-secondary" />
            </section>
            <section className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-6 pb-16">
              {Array.from({ length: cards }, (_, index) => <div className="border border-rule bg-surface p-4" key={index}><div className="aspect-[2/3] bg-surface-secondary" /><div className="mt-5 h-7 w-4/5 bg-surface-secondary" /><div className="mt-3 h-4 w-2/5 bg-surface-secondary" /></div>)}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
