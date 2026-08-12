"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import type {
  CatalogDiscoverInput,
  CatalogDiscoverResult,
  CatalogDiscoveryMovie,
  CatalogGenre,
  CatalogMovie,
  CatalogMovieDetails,
  CatalogMovieVideos,
  CatalogSearchResult,
} from "@/modules/catalog/catalog.types";
import {
  createDiscoverCacheKey,
  getCompactPageNumbers,
  getOrganizerDiscoveryYears,
  organizerDiscoverSortOptions,
  resetDiscoverPage,
} from "@/modules/catalog/organizer-discovery";
import {
  canSearchCatalog,
  createSearchRequestTracker,
  normalizeCatalogQuery,
} from "@/modules/catalog/organizer-search";
import { loadMovieSelection, type MovieSelection } from "@/modules/catalog/movie-selection";

type ResultState<T> =
  | { kind: "loading" }
  | { kind: "results"; result: T }
  | { kind: "error" };

type SelectionError = { movie: CatalogMovie };

const searchDebounceMs = 400;
const defaultDiscoverInput: CatalogDiscoverInput = {
  genreId: null,
  page: 1,
  sort: "popularity",
  year: null,
};

const trendingCache = new Map<string, CatalogDiscoveryMovie[]>();
const genresCache = new Map<string, CatalogGenre[]>();
const discoverCache = new Map<string, CatalogDiscoverResult>();
const searchCache = new Map<string, CatalogSearchResult>();
const ratingFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return fallback;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, signal ? { signal } : undefined);
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Não foi possível consultar o catálogo."));
  }

  return payload as T;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div
      aria-label="Carregando filmes"
      className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      role="status"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="animate-pulse" key={index}>
          <div className="aspect-[2/3] border border-rule bg-surface-secondary" />
          <div className="mt-3 h-5 w-4/5 bg-surface-secondary" />
          <div className="mt-2 h-3 w-2/5 bg-surface-secondary" />
        </div>
      ))}
    </div>
  );
}

function MovieCard({
  disabled,
  movie,
  onSelect,
}: {
  disabled: boolean;
  movie: CatalogMovie | CatalogDiscoveryMovie;
  onSelect: (movie: CatalogMovie) => void;
}) {
  const rating = "rating" in movie ? movie.rating : null;

  return (
    <li>
      <button
        className="group block w-full cursor-pointer text-left outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
        disabled={disabled}
        onClick={() => onSelect(movie)}
        type="button"
      >
        <Image
          alt={`Pôster de ${movie.title}`}
          className="aspect-[2/3] w-full border border-rule object-cover transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg"
          height={600}
          src={movie.posterUrl}
          width={400}
        />
        <p className="mt-3 line-clamp-2 min-h-12 font-display text-xl leading-[1.05] sm:text-2xl">
          {movie.title}
        </p>
        <p className="mt-1 flex min-h-4 items-center justify-between gap-2 font-code text-[0.68rem] uppercase tracking-[0.12em] text-ink-muted">
          <span>{movie.releaseDate?.slice(0, 4) ?? "Ano indisponível"}</span>
          {rating !== null ? <span>★ {ratingFormatter.format(rating)}</span> : null}
        </p>
      </button>
    </li>
  );
}

function MovieGrid({
  disabled,
  items,
  onSelect,
}: {
  disabled: boolean;
  items: Array<CatalogMovie | CatalogDiscoveryMovie>;
  onSelect: (movie: CatalogMovie) => void;
}) {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="list">
      {items.map((movie) => (
        <MovieCard disabled={disabled} key={movie.externalId} movie={movie} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function CatalogPagination({
  currentPage,
  onPageChange,
  totalPages,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginação do catálogo" className="mt-7 flex flex-wrap items-center justify-center gap-2">
      <button
        className="border border-rule px-4 py-2 text-sm disabled:opacity-40"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        Anterior
      </button>
      {getCompactPageNumbers(currentPage, totalPages).map((page) => (
        <button
          aria-current={page === currentPage ? "page" : undefined}
          className={`min-w-10 border px-3 py-2 text-sm ${page === currentPage ? "border-ink bg-ink text-paper" : "border-rule bg-surface"}`}
          key={page}
          onClick={() => onPageChange(page)}
          type="button"
        >
          {page}
        </button>
      ))}
      <button
        className="border border-rule px-4 py-2 text-sm disabled:opacity-40"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        Próxima
      </button>
    </nav>
  );
}

export function OrganizerMovieSearch({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState<string | null>(null);
  const [discoverInput, setDiscoverInput] = useState<CatalogDiscoverInput>(defaultDiscoverInput);
  const [searchState, setSearchState] = useState<ResultState<CatalogSearchResult>>({ kind: "loading" });
  const [discoverState, setDiscoverState] = useState<ResultState<CatalogDiscoverResult>>({ kind: "loading" });
  const [trending, setTrending] = useState<CatalogDiscoveryMovie[]>([]);
  const [trendingFailed, setTrendingFailed] = useState(false);
  const [genres, setGenres] = useState<CatalogGenre[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<MovieSelection | null>(null);
  const [loadingMovieId, setLoadingMovieId] = useState<number | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<SelectionError | null>(null);
  const closeDialogButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const discoverAbortControllerRef = useRef<AbortController | null>(null);
  const searchRequestTrackerRef = useRef(createSearchRequestTracker());

  const hasSearch = canSearchCatalog(appliedQuery ?? "");
  const hasFilters =
    discoverInput.genreId !== null ||
    discoverInput.year !== null ||
    discoverInput.sort !== defaultDiscoverInput.sort;
  const isInitialDiscovery = !hasSearch && !hasFilters;
  const displaySearchResults = hasSearch;
  const displayDiscoverResults = !hasSearch && hasFilters;

  const applyQuery = useDebouncedCallback((value: string) => {
    const normalized = normalizeCatalogQuery(value);
    setAppliedQuery(canSearchCatalog(normalized) ? normalized : null);
  }, searchDebounceMs);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      try {
        const cachedTrending = trendingCache.get("week");
        const items = cachedTrending ?? (await getJson<{ items: CatalogDiscoveryMovie[] }>("/api/catalog/trending")).items;
        if (!cachedTrending) trendingCache.set("week", items);
        if (active) setTrending(items);
      } catch {
        if (active) setTrendingFailed(true);
      }

      try {
        const cachedGenres = genresCache.get("all");
        const items = cachedGenres ?? (await getJson<{ items: CatalogGenre[] }>("/api/catalog/genres")).items;
        if (!cachedGenres) genresCache.set("all", items);
        if (active) setGenres(items);
      } catch {
        // Gêneros são refinamentos opcionais; a busca continua disponível.
      }
    }

    void loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!displaySearchResults || !appliedQuery) {
      return;
    }

    const requestId = searchRequestTrackerRef.current.begin();
    const cacheKey = [
      appliedQuery,
      discoverInput.page,
      discoverInput.genreId ?? "all",
      discoverInput.year ?? "all",
      discoverInput.sort,
    ].join(":");
    const cached = searchCache.get(cacheKey);

    if (cached) {
      void Promise.resolve().then(() => {
        if (searchRequestTrackerRef.current.isCurrent(requestId)) {
          setSearchState({ kind: "results", result: cached });
          setIsRefreshing(false);
        }
      });
      return;
    }

    const controller = new AbortController();
    searchAbortControllerRef.current?.abort();
    searchAbortControllerRef.current = controller;
    void getJson<CatalogSearchResult>(
      `/api/catalog/movies?${new URLSearchParams({
        query: appliedQuery,
        page: String(discoverInput.page),
        sort: discoverInput.sort,
        ...(discoverInput.genreId ? { genreId: String(discoverInput.genreId) } : {}),
        ...(discoverInput.year ? { year: String(discoverInput.year) } : {}),
      })}`,
      controller.signal,
    )
      .then((result) => {
        if (!searchRequestTrackerRef.current.isCurrent(requestId)) return;
        searchCache.set(cacheKey, result);
        setSearchState({ kind: "results", result });
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || !searchRequestTrackerRef.current.isCurrent(requestId)) return;
        setSearchState({ kind: "error" });
      })
      .finally(() => {
        if (searchRequestTrackerRef.current.isCurrent(requestId)) setIsRefreshing(false);
      });

    return () => controller.abort();
  }, [
    appliedQuery,
    discoverInput.genreId,
    discoverInput.page,
    discoverInput.sort,
    discoverInput.year,
    displaySearchResults,
    reloadKey,
  ]);

  useEffect(() => {
    if (!displayDiscoverResults && !isInitialDiscovery) {
      return;
    }

    const cacheKey = createDiscoverCacheKey(discoverInput);
    const cached = discoverCache.get(cacheKey);

    if (cached) {
      void Promise.resolve().then(() => {
        setDiscoverState({ kind: "results", result: cached });
        setIsRefreshing(false);
      });
      return;
    }

    const controller = new AbortController();
    discoverAbortControllerRef.current?.abort();
    discoverAbortControllerRef.current = controller;
    const params = new URLSearchParams({
      page: String(discoverInput.page),
      sort: discoverInput.sort,
    });
    if (discoverInput.genreId) params.set("genreId", String(discoverInput.genreId));
    if (discoverInput.year) params.set("year", String(discoverInput.year));

    void getJson<CatalogDiscoverResult>(`/api/catalog/discover?${params}`, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        discoverCache.set(cacheKey, result);
        setDiscoverState({ kind: "results", result });
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) setDiscoverState({ kind: "error" });
      })
      .finally(() => {
        if (discoverAbortControllerRef.current === controller) setIsRefreshing(false);
      });

    return () => controller.abort();
  }, [discoverInput, displayDiscoverResults, isInitialDiscovery, reloadKey]);

  useEffect(() => {
    if (!selectedMovie) return;
    const previousActiveElement = document.activeElement as HTMLElement | null;
    closeDialogButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedMovie(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [selectedMovie]);

  useEffect(
    () => () => {
      applyQuery.cancel();
      searchAbortControllerRef.current?.abort();
      discoverAbortControllerRef.current?.abort();
    },
    [applyQuery],
  );

  function updateDiscoverInput(
    update: CatalogDiscoverInput | ((input: CatalogDiscoverInput) => CatalogDiscoverInput),
  ) {
    setIsRefreshing(true);
    setDiscoverInput(update);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    searchRequestTrackerRef.current.begin();
    if (!canSearchCatalog(value)) {
      applyQuery.cancel();
      setAppliedQuery(null);
      return;
    }

    setIsRefreshing(true);
    updateDiscoverInput((input) => ({ ...input, page: 1 }));
    applyQuery(value);
  }

  function clearFilters() {
    updateDiscoverInput((input) => ({
      ...input,
      genreId: null,
      page: 1,
      sort: defaultDiscoverInput.sort,
      year: null,
    }));
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyQuery.flush();
  }

  async function selectMovie(movie: CatalogMovie) {
    if (loadingMovieId !== null) return;
    setLoadingMovieId(movie.externalId);
    setCreationError(null);
    setSelectionError(null);
    try {
      const selection = await loadMovieSelection({
        getDetails: () => getJson<CatalogMovieDetails>(`/api/catalog/movies/${movie.externalId}`),
        getVideos: () => getJson<CatalogMovieVideos>(`/api/catalog/movies/${movie.externalId}/videos`),
      });
      setSelectedMovie(selection);
    } catch {
      setSelectionError({ movie });
    } finally {
      setLoadingMovieId(null);
    }
  }

  async function useSelectedMovie() {
    if (!selectedMovie) return;
    setIsCreatingDraft(true);
    setCreationError(null);
    setSelectionError(null);
    try {
      const response = await fetch(
        eventId ? `/api/organizer/events/${eventId}` : "/api/organizer/events",
        {
          body: JSON.stringify({ movieExternalId: selectedMovie.details.externalId }),
          headers: { "content-type": "application/json" },
          method: eventId ? "PUT" : "POST",
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok || typeof payload !== "object" || payload === null || !("id" in payload)) {
        throw new Error(getErrorMessage(payload, "Não foi possível criar o rascunho."));
      }
      if (!eventId) router.push(`/organizer/events/${String(payload.id)}`);
      else setSelectedMovie(null);
      router.refresh();
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : "Não foi possível criar o rascunho.");
    } finally {
      setIsCreatingDraft(false);
    }
  }

  function retryCurrentResults() {
    if (displaySearchResults && appliedQuery) {
      searchCache.delete([
        appliedQuery,
        discoverInput.page,
        discoverInput.genreId ?? "all",
        discoverInput.year ?? "all",
        discoverInput.sort,
      ].join(":"));
    } else {
      discoverCache.delete(createDiscoverCacheKey(discoverInput));
    }
    setIsRefreshing(true);
    setDiscoverInput((input) => ({ ...input }));
    setReloadKey((current) => current + 1);
  }

  const resultState = displaySearchResults ? searchState : discoverState;
  const result = resultState.kind === "results" ? resultState.result : null;
  const contentHeading = displaySearchResults
    ? `Resultados para “${query.trim()}”`
    : displayDiscoverResults
      ? hasSearch
        ? `Filmes para “${query.trim()}”`
        : "Filmes do catálogo"
      : "Em alta esta semana";

  return (
    <section aria-labelledby="movie-search-title" className="py-10 sm:py-14">
      <p className="font-code text-xs uppercase tracking-[0.2em] text-accent">
        {eventId ? "Trocar filme · rascunho" : "Nova sessão · etapa 1 de 3"}
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]" id="movie-search-title">
        {eventId ? "Trocar filme" : "Escolha o filme"}
      </h1>
      <p className="mt-5 max-w-2xl leading-7 text-ink-muted">
        {eventId
          ? "Escolha outro filme para este rascunho."
          : "Busque pelo título ou explore o catálogo para criar uma nova sessão."}
      </p>

      <div className="mt-9 border-y border-rule py-6">
        <form className="max-w-3xl" onSubmit={submitSearch}>
          <label className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted" htmlFor="movie-query">
            Buscar filme
          </label>
          <div className="mt-2 flex border border-rule bg-surface">
            <input
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
              id="movie-query"
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Título, palavra-chave ou nome original"
              type="search"
              value={query}
            />
            <button className="bg-accent px-5 text-sm font-semibold text-ink hover:bg-accent-hover" type="submit">
              Buscar
            </button>
          </div>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Gênero
            <select
              className="mt-2 w-full border border-rule bg-surface px-3 py-3 text-sm"
              onChange={(event) => updateDiscoverInput((input) => resetDiscoverPage(input, {
                genreId: event.target.value ? Number(event.target.value) : null,
              }))}
              value={discoverInput.genreId ?? ""}
            >
              <option value="">Todos</option>
              {genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Ano
            <select
              className="mt-2 w-full border border-rule bg-surface px-3 py-3 text-sm"
              onChange={(event) => updateDiscoverInput((input) => resetDiscoverPage(input, {
                year: event.target.value ? Number(event.target.value) : null,
              }))}
              value={discoverInput.year ?? ""}
            >
              <option value="">Todos</option>
              {getOrganizerDiscoveryYears().map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Ordenar por
            <select
              className="mt-2 w-full border border-rule bg-surface px-3 py-3 text-sm"
              onChange={(event) => updateDiscoverInput((input) => resetDiscoverPage(input, {
                sort: event.target.value as CatalogDiscoverInput["sort"],
              }))}
              value={discoverInput.sort}
            >
              {organizerDiscoverSortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        {hasFilters ? (
          <button className="mt-4 text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4" onClick={clearFilters} type="button">
            Limpar filtros
          </button>
        ) : null}
      </div>

      <section aria-labelledby="catalog-results-title" className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">
              {isInitialDiscovery ? "Sugestões da semana" : "Catálogo TMDb"}
            </p>
            <h2 className="mt-2 font-display text-4xl" id="catalog-results-title">{contentHeading}</h2>
          </div>
          {isRefreshing ? <p aria-live="polite" className="text-sm text-ink-muted" role="status">Atualizando catálogo…</p> : null}
        </div>

        {isInitialDiscovery && trendingFailed ? (
          <p className="mt-6 border-l-4 border-warning bg-surface p-4 text-sm text-ink-muted">
            Os filmes em alta estão indisponíveis agora. Você ainda pode explorar o catálogo pelos filtros.
          </p>
        ) : null}
        {isInitialDiscovery && !trendingFailed && trending.length === 0 ? <MovieGridSkeleton count={5} /> : null}
        {isInitialDiscovery && trending.length > 0 ? (
          <MovieGrid disabled={loadingMovieId !== null} items={trending.slice(0, 5)} onSelect={selectMovie} />
        ) : null}

        {isInitialDiscovery && discoverState.kind === "results" ? (
          <div className="mt-10 border-t border-rule pt-7">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="font-display text-3xl">Catálogo popular</h3>
              <p className="text-sm text-ink-muted">Continue explorando ou refine os filtros acima.</p>
            </div>
            <MovieGrid disabled={loadingMovieId !== null} items={discoverState.result.items} onSelect={selectMovie} />
            <CatalogPagination
              currentPage={discoverState.result.page}
              onPageChange={(page) => updateDiscoverInput({ ...discoverInput, page })}
              totalPages={discoverState.result.totalPages}
            />
          </div>
        ) : null}

        {!isInitialDiscovery && resultState.kind === "loading" ? <MovieGridSkeleton /> : null}
        {!isInitialDiscovery && resultState.kind === "error" ? (
          <div className="mt-6 border-l-4 border-error bg-surface p-4" role="alert">
            <p className="text-sm text-error">Não foi possível atualizar o catálogo.</p>
            <button className="mt-3 text-sm font-semibold underline decoration-error decoration-2 underline-offset-4" onClick={retryCurrentResults} type="button">
              Tentar novamente
            </button>
          </div>
        ) : null}
        {!isInitialDiscovery && result ? (
          result.items.length === 0 ? (
            <div className="mt-7 border-y border-rule py-12 text-center">
              <p className="font-display text-3xl">Nenhum filme encontrado com esses filtros.</p>
            </div>
          ) : (
            <>
              <MovieGrid disabled={loadingMovieId !== null} items={result.items} onSelect={selectMovie} />
              <CatalogPagination
                currentPage={result.page}
                onPageChange={(page) => updateDiscoverInput({ ...discoverInput, page })}
                totalPages={result.totalPages}
              />
            </>
          )
        ) : null}
      </section>

      {loadingMovieId !== null ? <p className="mt-8 font-code text-xs uppercase tracking-[0.14em] text-ink-muted" role="status">Carregando detalhes do filme…</p> : null}
      {selectionError ? (
        <div className="mt-5 border-l-4 border-error bg-surface p-4" role="alert">
          <p className="text-sm text-error">Não foi possível carregar os detalhes deste filme.</p>
          <button className="mt-3 text-sm font-semibold underline decoration-error decoration-2 underline-offset-4" disabled={loadingMovieId !== null} onClick={() => selectMovie(selectionError.movie)} type="button">
            Tentar novamente
          </button>
        </div>
      ) : null}
      {creationError ? <p className="mt-5 border-l-4 border-error bg-surface p-4 text-sm text-error" role="alert">{creationError}</p> : null}

      {selectedMovie ? (
        <div aria-labelledby="selected-movie-title" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-4 sm:p-8" role="dialog">
          <div className="mx-auto my-6 max-w-5xl border border-rule bg-paper p-5 shadow-2xl sm:p-8">
            <div className="flex justify-end">
              <button aria-label="Fechar detalhes do filme" className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted underline" onClick={() => setSelectedMovie(null)} ref={closeDialogButtonRef} type="button">Fechar</button>
            </div>
            <div className="mt-2 grid gap-8 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
              <Image alt={`Pôster de ${selectedMovie.details.title}`} className="w-full border border-rule object-cover" height={720} src={selectedMovie.details.posterUrl} width={480} />
              <div>
                <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">Filme selecionado</p>
                <h2 className="mt-3 font-display text-4xl leading-tight" id="selected-movie-title">{selectedMovie.details.title}</h2>
                <p className="mt-3 text-sm text-ink-muted">{[selectedMovie.details.releaseDate?.slice(0, 4), selectedMovie.details.runtimeMinutes ? `${selectedMovie.details.runtimeMinutes} min` : null, selectedMovie.details.genres.join(" · ")].filter(Boolean).join(" · ") || "Informações do filme indisponíveis"}</p>
                <p className="mt-6 leading-7 text-ink-muted">{selectedMovie.details.overview || "Sinopse indisponível para este filme."}</p>
              </div>
            </div>
            <section aria-labelledby="trailer-title" className="mt-9 border-t border-rule pt-6">
              <h3 className="font-display text-2xl" id="trailer-title">Trailer</h3>
              {selectedMovie.trailer ? <iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="mt-4 aspect-video w-full border border-rule bg-ink" src={`https://www.youtube-nocookie.com/embed/${selectedMovie.trailer.key}`} title={selectedMovie.trailer.name} /> : <p className="mt-3 border-l-4 border-warning bg-surface p-4 text-sm text-ink-muted">Trailer indisponível. Você ainda pode usar este filme na sessão.</p>}
            </section>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="border border-rule px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-secondary" onClick={() => setSelectedMovie(null)} type="button">Escolher outro filme</button>
              <button className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover disabled:opacity-60" disabled={isCreatingDraft} onClick={useSelectedMovie} type="button">{isCreatingDraft ? eventId ? "Trocando filme…" : "Criando rascunho…" : "Usar este filme"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
