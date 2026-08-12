"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import type {
  CatalogMovie,
  CatalogMovieDetails,
  CatalogMovieVideos,
} from "@/modules/catalog/catalog.types";
import {
  canSearchCatalog,
  createSearchRequestTracker,
  normalizeCatalogQuery,
} from "@/modules/catalog/organizer-search";
import {
  loadMovieSelection,
  type MovieSelection,
} from "@/modules/catalog/movie-selection";

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { items: CatalogMovie[]; kind: "results" }
  | { kind: "error"; query: string };

type SelectionError = {
  movie: CatalogMovie;
};

type SelectedMovie = MovieSelection;

const searchDebounceMs = 400;

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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, signal ? { signal } : undefined);
  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Não foi possível consultar o catálogo."));
  }

  return payload as T;
}

function SearchSkeletons() {
  return (
    <div aria-label="Carregando resultados" className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-5" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="animate-pulse" key={index}>
          <div className="aspect-[2/3] border border-rule bg-surface-secondary" />
          <div className="mt-3 h-6 w-4/5 bg-surface-secondary" />
          <div className="mt-2 h-3 w-1/3 bg-surface-secondary" />
        </div>
      ))}
    </div>
  );
}

export function OrganizerMovieSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({ kind: "idle" });
  const [isSearchRequestActive, setIsSearchRequestActive] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<SelectedMovie | null>(null);
  const [loadingMovieId, setLoadingMovieId] = useState<number | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<SelectionError | null>(null);
  const closeDialogButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef(new Map<string, CatalogMovie[]>());
  const searchRequestTrackerRef = useRef(createSearchRequestTracker());

  function closeSelectedMovie() {
    setSelectedMovie(null);
  }

  useEffect(() => {
    if (!selectedMovie) {
      return;
    }

    const previousActiveElement = document.activeElement as HTMLElement | null;
    closeDialogButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSelectedMovie();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [selectedMovie]);

  const searchMovies = useDebouncedCallback(async (rawQuery: string) => {
    const normalizedQuery = normalizeCatalogQuery(rawQuery);
    const requestId = searchRequestTrackerRef.current.begin();

    searchAbortControllerRef.current?.abort();
    searchAbortControllerRef.current = null;

    if (!canSearchCatalog(normalizedQuery)) {
      setIsSearchRequestActive(false);
      setSearchState({ kind: "idle" });
      return;
    }

    const cachedItems = searchCacheRef.current.get(normalizedQuery);

    if (cachedItems) {
      setIsSearchRequestActive(false);
      setSearchState({ items: cachedItems, kind: "results" });
      return;
    }

    const abortController = new AbortController();
    searchAbortControllerRef.current = abortController;
    setIsSearchRequestActive(true);
    setSearchState((currentState) =>
      currentState.kind === "results" ? currentState : { kind: "loading" },
    );

    try {
      const result = await getJson<{ items: CatalogMovie[] }>(
        `/api/catalog/movies?query=${encodeURIComponent(rawQuery.trim())}`,
        abortController.signal,
      );

      if (!searchRequestTrackerRef.current.isCurrent(requestId)) {
        return;
      }

      searchCacheRef.current.set(normalizedQuery, result.items);
      setSearchState({ items: result.items, kind: "results" });
    } catch (error) {
      if (isAbortError(error) || !searchRequestTrackerRef.current.isCurrent(requestId)) {
        return;
      }

      setSearchState((currentState) =>
        currentState.kind === "results" ? currentState : { kind: "error", query: rawQuery.trim() },
      );
    } finally {
      if (searchRequestTrackerRef.current.isCurrent(requestId)) {
        setIsSearchRequestActive(false);
      }
    }
  }, searchDebounceMs);

  useEffect(() => {
    return () => {
      searchMovies.cancel();
      searchAbortControllerRef.current?.abort();
    };
  }, [searchMovies]);

  function handleQueryChange(value: string) {
    searchRequestTrackerRef.current.begin();
    searchAbortControllerRef.current?.abort();
    searchAbortControllerRef.current = null;
    setIsSearchRequestActive(false);
    setQuery(value);
    searchMovies(value);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchMovies.flush();
  }

  async function selectMovie(movie: CatalogMovie) {
    if (loadingMovieId !== null) {
      return;
    }

    setLoadingMovieId(movie.externalId);
    setCreationError(null);
    setSelectionError(null);

    try {
      const selection = await loadMovieSelection({
        getDetails: () =>
          getJson<CatalogMovieDetails>(`/api/catalog/movies/${movie.externalId}`),
        getVideos: () =>
          getJson<CatalogMovieVideos>(
            `/api/catalog/movies/${movie.externalId}/videos`,
          ),
      });
      setSelectedMovie(selection);
    } catch {
      setSelectionError({ movie });
    } finally {
      setLoadingMovieId(null);
    }
  }

  async function useSelectedMovie() {
    if (!selectedMovie) {
      return;
    }

    setIsCreatingDraft(true);
    setCreationError(null);
    setSelectionError(null);

    try {
      const response = await fetch("/api/organizer/events", {
        body: JSON.stringify({ movieExternalId: selectedMovie.details.externalId }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload: unknown = await response.json();

      if (!response.ok || typeof payload !== "object" || payload === null || !("id" in payload)) {
        throw new Error(getErrorMessage(payload, "Não foi possível criar o rascunho."));
      }

      router.push(`/organizer/events/${String(payload.id)}`);
      router.refresh();
    } catch (error) {
      setCreationError(
        error instanceof Error ? error.message : "Não foi possível criar o rascunho.",
      );
    } finally {
      setIsCreatingDraft(false);
    }
  }

  const isInitialLoading = searchState.kind === "loading";
  const isRefreshing =
    searchState.kind === "results" && (isSearchRequestActive || searchMovies.isPending());

  return (
    <section aria-labelledby="movie-search-title" className="py-10 sm:py-14">
      <p className="font-code text-xs uppercase tracking-[0.2em] text-accent">
        Nova sessão · etapa 1 de 3
      </p>
      <h1 className="mt-3 font-display text-5xl leading-[0.95]" id="movie-search-title">
        Busque no TMDb e escolha o filme
      </h1>
      <p className="mt-5 max-w-2xl leading-7 text-ink-muted">
        Confirme os detalhes e o trailer antes de configurar a nova sessão.
      </p>

      <form className="mt-9 max-w-3xl" onSubmit={submitSearch}>
        <label className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted" htmlFor="movie-query">
          Buscar filmes no TMDb
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
          <button
            className="bg-accent px-5 text-sm font-semibold text-ink hover:bg-accent-hover disabled:opacity-60"
            disabled={!canSearchCatalog(query)}
            type="submit"
          >
            Buscar
          </button>
        </div>
      </form>

      <p aria-live="polite" className="mt-4 min-h-5 text-sm text-ink-muted" role="status">
        {isRefreshing ? "Atualizando resultados…" : ""}
      </p>

      {searchState.kind === "idle" ? (
        <p className="mt-6 text-ink-muted">Busque um filme para começar.</p>
      ) : null}

      {isInitialLoading ? <SearchSkeletons /> : null}

      {searchState.kind === "error" ? (
        <div className="mt-6 border-l-4 border-warning bg-surface p-4" role="status">
          <p className="text-sm text-ink">Não conseguimos consultar a TMDb agora.</p>
          <button
            className="mt-3 text-sm font-semibold underline decoration-warning decoration-2 underline-offset-4"
            onClick={() => searchMovies(searchState.query)}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {loadingMovieId !== null ? (
        <p className="mt-8 font-code text-xs uppercase tracking-[0.14em] text-ink-muted" role="status">
          Carregando detalhes do filme…
        </p>
      ) : null}

      {selectionError ? (
        <div className="mt-5 border-l-4 border-error bg-surface p-4" role="alert">
          <p className="text-sm text-error">Não foi possível carregar os detalhes deste filme.</p>
          <button
            className="mt-3 text-sm font-semibold underline decoration-error decoration-2 underline-offset-4"
            disabled={loadingMovieId !== null}
            onClick={() => selectMovie(selectionError.movie)}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {creationError ? (
        <p className="mt-5 border-l-4 border-error bg-surface p-4 text-sm text-error" role="alert">
          {creationError}
        </p>
      ) : null}

      {searchState.kind === "results" ? (
        searchState.items.length === 0 ? (
          <div className="mt-10 border-y border-rule py-12 text-center">
            <h2 className="font-display text-3xl">Nenhum filme encontrado para “{query.trim()}”</h2>
            <p className="mt-3 text-ink-muted">Tente outro título ou termo.</p>
          </div>
        ) : (
          <ul className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-5" role="list">
            {searchState.items.map((movie) => (
              <li key={movie.externalId}>
                <button
                  className="group block w-full text-left disabled:cursor-wait disabled:opacity-60"
                  disabled={loadingMovieId !== null}
                  onClick={() => selectMovie(movie)}
                  type="button"
                >
                  <Image
                    alt={`Pôster de ${movie.title}`}
                    className="aspect-[2/3] w-full border border-rule object-cover transition-transform group-hover:-translate-y-1"
                    height={600}
                    src={movie.posterUrl}
                    width={400}
                  />
                  <p className="mt-3 font-display text-2xl leading-tight">{movie.title}</p>
                  <p className="mt-1 font-code text-xs uppercase tracking-[0.12em] text-ink-muted">
                    {movie.releaseDate ? movie.releaseDate.slice(0, 4) : "Ano indisponível"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {selectedMovie ? (
        <div
          aria-labelledby="selected-movie-title"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-4 sm:p-8"
          role="dialog"
        >
          <div className="mx-auto my-6 max-w-5xl border border-rule bg-paper p-5 shadow-2xl sm:p-8">
            <div className="flex justify-end">
              <button
                aria-label="Fechar detalhes do filme"
                className="font-code text-xs uppercase tracking-[0.14em] text-ink-muted underline"
                onClick={closeSelectedMovie}
                ref={closeDialogButtonRef}
                type="button"
              >
                Fechar
              </button>
            </div>
            <div className="mt-2 grid gap-8 md:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)]">
              <Image
                alt={`Pôster de ${selectedMovie.details.title}`}
                className="w-full border border-rule object-cover"
                height={720}
                src={selectedMovie.details.posterUrl}
                width={480}
              />
              <div>
                <p className="font-code text-xs uppercase tracking-[0.18em] text-accent">Filme selecionado</p>
                <h2 className="mt-3 font-display text-4xl leading-tight" id="selected-movie-title">
                  {selectedMovie.details.title}
                </h2>
                <p className="mt-3 text-sm text-ink-muted">
                  {[selectedMovie.details.releaseDate?.slice(0, 4), selectedMovie.details.runtimeMinutes ? `${selectedMovie.details.runtimeMinutes} min` : null, selectedMovie.details.genres.join(" · ")]
                    .filter(Boolean)
                    .join(" · ") || "Informações do filme indisponíveis"}
                </p>
                <p className="mt-6 leading-7 text-ink-muted">
                  {selectedMovie.details.overview || "Sinopse indisponível para este filme."}
                </p>
              </div>
            </div>

            <section className="mt-9 border-t border-rule pt-6" aria-labelledby="trailer-title">
              <h3 className="font-display text-2xl" id="trailer-title">Trailer</h3>
              {selectedMovie.trailer ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="mt-4 aspect-video w-full border border-rule bg-ink"
                  src={`https://www.youtube-nocookie.com/embed/${selectedMovie.trailer.key}`}
                  title={selectedMovie.trailer.name}
                />
              ) : (
                <p className="mt-3 border-l-4 border-warning bg-surface p-4 text-sm text-ink-muted">
                  Trailer indisponível. Você ainda pode usar este filme na sessão.
                </p>
              )}
            </section>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="border border-rule px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-secondary"
                onClick={closeSelectedMovie}
                type="button"
              >
                Escolher outro filme
              </button>
              <button
                className="bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-hover disabled:opacity-60"
                disabled={isCreatingDraft}
                onClick={useSelectedMovie}
                type="button"
              >
                {isCreatingDraft ? "Criando rascunho…" : "Usar este filme"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
