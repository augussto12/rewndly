import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { discoverMovies, discoverSeries, getMovieDetails, getMovieRanking, getPopularMovies, getSeriesDetails, getSeriesRanking, searchMovies, searchSeries } from '../features/public-media/services/publicMediaApi'
import type {
  CompanySummary,
  MediaCrew,
  MediaPerson,
  MediaSummary,
  MovieDetails,
  PagedResponse,
  SeriesDetails,
  WatchProvider,
} from '../features/public-media/types/publicMedia.types'
import { gameModeCollections } from '../features/public-media/utils/discoveryCollections'
import { formatExternalRating, ratingBySource } from '../features/public-media/utils/externalRatings'
import { PublicLayout } from '../layouts/PublicLayout'

type StoredGame = {
  dateKey: string
  guesses: MediaSummary[]
  solved: boolean
  completed: boolean
}

type GameStats = {
  played: number
  wins: number
  streak: number
  bestStreak: number
  lastCompletedDate: string | null
}

type GameMessage = {
  text: string
  tone: 'info' | 'success' | 'error' | 'final'
}

const maxAttempts = 5
const posterTileCount = 30
const revealPlan = [
  [8, 21],
  [2, 13, 17, 26],
  [6, 11, 18, 23, 28],
  [0, 4, 12, 16, 20, 24],
  [1, 3, 5, 9, 14, 19, 25, 27, 29],
]
const gameStorageKey = 'rewndly-poster-game'
const roundStorageKey = 'rewndly-poster-game-round'
const statsStorageKey = 'rewndly-poster-game-stats'
type GameMode = (typeof gameModeCollections)[number]['value']
type GameDetails = MovieDetails | SeriesDetails

export function PosterGamePage() {
  const dateKey = getTodayKey()
  const seed = getDaySeed(dateKey)
  const [mode, setMode] = useState<GameMode>('popular')
  const modeConfig = gameModeCollections.find((item) => item.value === mode) ?? gameModeCollections[0]
  const [roundOffset, setRoundOffset] = useState(() => readRoundOffset(dateKey, mode))
  const gameKey = `${dateKey}-${mode}-${roundOffset}`
  const modeStorageKey = `${gameStorageKey}-${mode}`
  const candidateMeta = useQuery({
    queryKey: ['poster-game-meta', mode],
    queryFn: () => getGameCandidatePage(mode, 1),
  })
  const page = useMemo(() => pickSeededPage(seed + roundOffset, candidateMeta.data?.totalPages ?? 1), [candidateMeta.data?.totalPages, roundOffset, seed])
  const { data, isError, isLoading } = useQuery({
    queryKey: ['poster-game-daily', dateKey, mode, page],
    queryFn: () => getGameCandidatePage(mode, page),
    enabled: Boolean(candidateMeta.data),
  })
  const isGameLoading = candidateMeta.isLoading || isLoading
  const isGameError = candidateMeta.isError || isError
  const gameCandidates = useMemo(() => (data?.items ?? []).filter((item) => item.posterUrl), [data?.items])
  const target = useMemo(() => pickDailyMovie(gameCandidates, seed + roundOffset), [gameCandidates, roundOffset, seed])
  const [storedGame, setStoredGame] = useState<StoredGame>(() => readStoredGame(modeStorageKey, gameKey))
  const [query, setQuery] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<MediaSummary | null>(null)
  const [message, setMessage] = useState<GameMessage | null>(null)
  const [stats, setStats] = useState<GameStats>(() => readStats())
  const normalizedQuery = query.trim()
  const guesses = storedGame.guesses
  const suggestions = useQuery({
    queryKey: ['poster-game-search', modeConfig.mediaType, normalizedQuery],
    queryFn: () => (modeConfig.mediaType === 'Series' ? searchSeries(normalizedQuery, 1) : searchMovies(normalizedQuery, 1)),
    enabled: normalizedQuery.length >= 2 && !storedGame.completed,
  })
  const targetDetails = useQuery<GameDetails>({
    queryKey: ['poster-game-details', target?.mediaType, target?.tmdbId],
    queryFn: () => getGameDetails(target!),
    enabled: Boolean(target),
    staleTime: 1000 * 60 * 30,
  })
  const guessDetails = useQueries({
    queries: guesses.map((guess) => ({
      queryKey: ['poster-game-details', guess.mediaType, guess.tmdbId],
      queryFn: () => getGameDetails(guess),
      enabled: Boolean(targetDetails.data),
      staleTime: 1000 * 60 * 30,
    })),
  })

  useEffect(() => {
    const nextRoundOffset = readRoundOffset(dateKey, mode)
    const nextGameKey = `${dateKey}-${mode}-${nextRoundOffset}`

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoundOffset(nextRoundOffset)
    setStoredGame(readStoredGame(`${gameStorageKey}-${mode}`, nextGameKey))
    setSelectedMovie(null)
    setQuery('')
    setMessage(null)
  }, [dateKey, mode])

  const isRevealed = storedGame.completed
  const revealLevel = isRevealed ? maxAttempts : guesses.length
  const revealedTileCount = isRevealed ? posterTileCount : getRevealedTiles(revealLevel).size
  const hasWon = storedGame.solved
  const progressLabel = `${guesses.length}/${maxAttempts}`
  const suggestionsList = suggestions.data?.items ?? []
  const guessResults = guesses.map((guess, index) => ({
    guess,
    detail: guessDetails[index]?.data as GameDetails | undefined,
    isLoading: Boolean(guessDetails[index]?.isLoading),
    isError: Boolean(guessDetails[index]?.isError),
  }))

  function submitGuess(movie = selectedMovie) {
    if (!target || storedGame.completed) {
      return
    }

    const fallback = suggestionsList.find((item) => normalizeTitle(item.title) === normalizeTitle(normalizedQuery)) ?? suggestionsList[0] ?? null
    const guess = movie ?? fallback

    if (!guess) {
      setMessage({ text: `Elegí ${modeConfig.mediaType === 'Series' ? 'una serie' : 'una película'} de la lista para intentar.`, tone: 'info' })
      return
    }

    if (guesses.some((item) => item.tmdbId === guess.tmdbId && item.mediaType === guess.mediaType)) {
      setMessage({ text: `Ya probaste ${modeConfig.mediaType === 'Series' ? 'esa serie' : 'esa película'}.`, tone: 'info' })
      return
    }

    const solved = guess.tmdbId === target.tmdbId && guess.mediaType === target.mediaType
    const nextGuesses = [...guesses, guess]
    const completed = solved || nextGuesses.length >= maxAttempts
    const nextGame = { dateKey: gameKey, guesses: nextGuesses, solved, completed }

    setStoredGame(nextGame)
    writeStoredGame(modeStorageKey, nextGame)
    setSelectedMovie(null)
    setQuery('')
    setMessage(
      solved
        ? { text: 'Correcto. Lo sacaste.', tone: 'success' }
        : completed
          ? { text: 'Se reveló el póster completo.', tone: 'final' }
          : { text: 'No era. Se abrió otra parte del póster.', tone: 'error' },
    )

    if (completed && !storedGame.completed) {
      const nextStats = updateStats(stats, dateKey, solved)
      setStats(nextStats)
      writeStats(nextStats)
    }
  }

  function resetLocalGame() {
    const nextGame = { dateKey: gameKey, guesses: [], solved: false, completed: false }
    setStoredGame(nextGame)
    writeStoredGame(modeStorageKey, nextGame)
    setSelectedMovie(null)
    setQuery('')
    setMessage(null)
  }

  function startAnotherMovie() {
    const nextRoundOffset = roundOffset + 1
    const nextGameKey = `${dateKey}-${mode}-${nextRoundOffset}`
    const nextGame = { dateKey: nextGameKey, guesses: [], solved: false, completed: false }

    setRoundOffset(nextRoundOffset)
    writeRoundOffset(dateKey, mode, nextRoundOffset)
    setStoredGame(nextGame)
    writeStoredGame(modeStorageKey, nextGame)
    setSelectedMovie(null)
    setQuery('')
    setMessage(null)
  }

  return (
    <PublicLayout ambient="game">
      <main className="page-shell">
        <header className="mb-8 max-w-3xl">
          <p className="kicker">Posterle</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Adiviná el póster</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            El póster arranca con apenas dos zonas visibles. Cada fallo abre nuevos cuadrantes hasta mostrarlo completo.
          </p>
        </header>

        <div className="scrollbar-cinema -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {gameModeCollections.map((option) => (
            <FilterChip key={option.value} active={mode === option.value} onClick={() => setMode(option.value)}>
              {option.label}
            </FilterChip>
          ))}
        </div>

        {isGameLoading ? <LoadingSkeleton /> : null}
        {isGameError ? <ErrorState title="No pudimos cargar el juego" /> : null}

        {!isGameLoading && !isGameError && target ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:items-start">
            <section className="surface-panel overflow-hidden p-4 sm:p-5">
              <div className="relative mx-auto aspect-[2/3] max-w-[18rem] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black">
                {target.posterUrl ? (
                  <img
                    src={target.posterUrl}
                    alt={isRevealed ? target.title : ''}
                    className={`h-full w-full object-cover transition duration-700 ${isRevealed ? 'scale-100 opacity-100' : 'scale-[1.01] opacity-95'}`}
                  />
                ) : (
                  <div className="grid h-full place-items-center px-4 text-center text-sm text-[var(--color-text-secondary)]">Sin póster</div>
                )}
                <div className={`absolute inset-0 grid grid-cols-5 grid-rows-6 gap-0.5 bg-black/55 p-0.5 transition-opacity duration-700 ${isRevealed ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                  {Array.from({ length: posterTileCount }).map((_, index) => (
                    <div
                      key={index}
                      className={`transition duration-500 ${
                        isPosterTileRevealed(index, revealLevel)
                          ? 'bg-transparent'
                          : 'border border-white/[0.035] bg-[#070914]/96 shadow-[inset_0_0_24px_rgba(255,255,255,0.025)] backdrop-blur-sm'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
                <span>{isRevealed ? 'Póster completo' : `${revealedTileCount}/${posterTileCount} zonas visibles`}</span>
                <span>{isRevealed ? target.title : 'Sin blur injusto'}</span>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-2" aria-label="Intentos">
                {Array.from({ length: maxAttempts }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full ${index < guesses.length ? (hasWon && index === guesses.length - 1 ? 'bg-emerald-300' : 'bg-violet-300') : 'bg-white/12'}`}
                  />
                ))}
              </div>
            </section>

            <section className="surface-panel p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold">{storedGame.completed ? (hasWon ? 'Ganaste' : 'Casi') : 'Tu intento'}</h2>
                </div>
                <div className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-semibold">
                  {progressLabel}
                </div>
              </div>

              {storedGame.completed ? (
                <div className="mt-5 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.045] p-4">
                  <p className="text-sm text-[var(--color-text-secondary)]">La respuesta era</p>
                  <Link to={getDetailHref(target)} className="mt-1 block text-2xl font-semibold hover:text-violet-100">
                    {target.title}
                  </Link>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {[target.releaseDate?.slice(0, 4), target.voteAverage ? `${target.voteAverage}/10` : ''].filter(Boolean).join(' / ')}
                  </p>
                </div>
              ) : (
                <form
                  className="mt-5"
                  onSubmit={(event) => {
                    event.preventDefault()
                    submitGuess()
                  }}
                >
                  <label className="block text-sm text-[var(--color-text-secondary)]">
                    {modeConfig.mediaType === 'Series' ? 'Serie' : 'Película'}
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setSelectedMovie(null)
                        setMessage(null)
                      }}
                      placeholder="Escribí el título"
                      className="field mt-2"
                    />
                  </label>

                  {suggestionsList.length > 0 ? (
                    <div className="scrollbar-cinema-visible mt-3 grid max-h-[19rem] gap-2 overflow-y-auto pr-1">
                      {suggestionsList.map((movie) => (
                        <button
                          key={`${movie.mediaType}-${movie.tmdbId}`}
                          type="button"
                          onClick={() => {
                            setSelectedMovie(movie)
                            setQuery(movie.title)
                          }}
                          className={`flex min-w-0 items-center gap-3 rounded-[var(--radius-sm)] border p-2 text-left transition ${
                            selectedMovie?.tmdbId === movie.tmdbId && selectedMovie.mediaType === movie.mediaType
                              ? 'border-violet-200/45 bg-[var(--color-accent-soft)]'
                              : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.07]'
                          }`}
                        >
                          <span className="grid h-10 w-14 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
                            {movie.releaseDate?.slice(0, 4) ?? (movie.mediaType === 'Series' ? 'Serie' : 'Película')}
                          </span>
                          <span className="min-w-0">
                            <span className="line-clamp-1 text-sm font-semibold">{movie.title}</span>
                            <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">{movie.releaseDate?.slice(0, 4) ?? (movie.mediaType === 'Series' ? 'Serie' : 'Película')}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <button type="submit" disabled={normalizedQuery.length < 2} className="primary-action mt-4 w-full">
                    Intentar
                  </button>
                </form>
              )}

              {message ? <GameStatusMessage message={message} /> : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatBox label="Racha" value={stats.streak} />
                <StatBox label="Mejor racha" value={stats.bestStreak} />
                <StatBox label="Victorias" value={`${stats.wins}/${stats.played}`} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetLocalGame}
                  className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-sm)] border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-200/45 hover:bg-red-500/15"
                >
                  Reiniciar
                </button>
                <button type="button" onClick={startAnotherMovie} className="secondary-action">
                  Otro póster
                </button>
                {storedGame.completed ? (
                  <Link to={getDetailHref(target)} className="secondary-action">
                    Ver detalle
                  </Link>
                ) : null}
              </div>

              {guesses.length > 0 ? (
                <div className="mt-6">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="kicker">Pistas</p>
                      <h3 className="mt-1 text-lg font-semibold">Comparación por intento</h3>
                    </div>
                    {targetDetails.isLoading ? <span className="text-xs text-[var(--color-text-secondary)]">Armando pistas...</span> : null}
                  </div>
                  <div className="mt-3 grid gap-3">
                    {guessResults.map((result) => (
                      <GuessComparisonCard
                        key={`${result.guess.mediaType}-${result.guess.tmdbId}`}
                        result={result}
                        target={target}
                        targetDetails={targetDetails.data}
                        isTargetLoading={targetDetails.isLoading}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>
    </PublicLayout>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.035] p-3">
      <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  )
}

function GameStatusMessage({ message }: { message: GameMessage }) {
  const toneClass = {
    info: 'border-violet-200/20 bg-violet-300/[0.08] text-violet-100',
    success: 'border-emerald-200/30 bg-emerald-400/[0.09] text-emerald-100',
    error: 'border-rose-200/25 bg-rose-400/[0.08] text-rose-100',
    final: 'border-cyan-200/25 bg-cyan-400/[0.08] text-cyan-100',
  }[message.tone]

  return (
    <p className={`mt-4 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium ${toneClass}`}>
      {message.text}
    </p>
  )
}

function GuessComparisonCard({
  result,
  target,
  targetDetails,
  isTargetLoading,
}: {
  result: { guess: MediaSummary; detail: GameDetails | undefined; isLoading: boolean; isError: boolean }
  target: MediaSummary
  targetDetails: GameDetails | undefined
  isTargetLoading: boolean
}) {
  const isCorrect = result.guess.tmdbId === target.tmdbId && result.guess.mediaType === target.mediaType

  return (
    <article className={`rounded-[var(--radius-md)] border p-3 ${isCorrect ? 'border-emerald-200/30 bg-emerald-400/[0.08]' : 'border-white/10 bg-white/[0.035]'}`}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-white">{result.guess.title}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{result.guess.releaseDate?.slice(0, 4) ?? (result.guess.mediaType === 'Series' ? 'Serie' : 'Película')}</p>
        </div>
        <span className={`shrink-0 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold ${isCorrect ? 'bg-emerald-300/15 text-emerald-100' : 'bg-white/[0.055] text-[var(--color-text-secondary)]'}`}>
          {isCorrect ? 'Correcta' : 'No'}
        </span>
      </div>

      {isTargetLoading || result.isLoading ? (
        <p className="mt-3 rounded-[var(--radius-sm)] bg-white/[0.035] px-3 py-2 text-sm text-[var(--color-text-secondary)]">Comparando datos...</p>
      ) : null}
      {result.isError ? <p className="mt-3 rounded-[var(--radius-sm)] bg-red-500/10 px-3 py-2 text-sm text-red-100">No pudimos cargar pistas para este intento.</p> : null}
      {!isTargetLoading && !result.isLoading && !result.isError && targetDetails && result.detail ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <ScalarHint hint={compareYear(result.detail, targetDetails)} />
          <ScalarHint hint={compareImdb(result.detail, targetDetails)} />
          <ScalarHint hint={compareDuration(result.detail, targetDetails)} />
          <OverlapHint label="Géneros" values={compareStrings(result.detail.genres, targetDetails.genres, 5)} />
          <OverlapHint label="Plataformas" values={compareProviders(result.detail.watchProviders, targetDetails.watchProviders)} />
          <OverlapHint label="Productoras" values={compareCompanies(result.detail.productionCompanies, targetDetails.productionCompanies)} />
          <OverlapHint label="Reparto" values={comparePeople(result.detail.cast, targetDetails.cast, 6)} />
          <OverlapHint label="Dirección" values={compareCrew(getMainCrew(result.detail), getMainCrew(targetDetails))} />
        </div>
      ) : null}
    </article>
  )
}

function ScalarHint({ hint }: { hint: ScalarComparison }) {
  const stateClass = hint.state === 'match'
    ? 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100'
    : hint.state === 'hint'
      ? 'border-sky-200/25 bg-sky-300/10 text-sky-100'
      : 'border-white/10 bg-white/[0.035] text-[var(--color-text-secondary)]'

  return (
    <div className={`min-h-20 rounded-[var(--radius-sm)] border p-3 ${stateClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-current/75">{hint.label}</p>
          <p className="mt-1 text-sm font-semibold text-white">{hint.value}</p>
        </div>
        <span className="shrink-0 rounded bg-black/20 px-2 py-1 text-xs font-semibold">{hint.badge}</span>
      </div>
      <p className="mt-2 text-xs text-current/80">{hint.note}</p>
    </div>
  )
}

function OverlapHint({ label, values }: { label: string; values: OverlapValue[] }) {
  const matches = values.filter((value) => value.match).length

  return (
    <div className={`min-h-20 rounded-[var(--radius-sm)] border p-3 ${matches > 0 ? 'border-emerald-200/25 bg-emerald-300/10' : 'border-white/10 bg-white/[0.035]'}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{label}</p>
        <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${matches > 0 ? 'bg-emerald-300/15 text-emerald-100' : 'bg-black/20 text-[var(--color-text-secondary)]'}`}>
          {matches > 0 ? `${matches} match` : 'Sin match'}
        </span>
      </div>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              key={`${label}-${value.key}`}
              className={`max-w-full truncate rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-semibold ${
                value.match ? 'border-emerald-200/30 bg-emerald-300/15 text-emerald-50' : 'border-white/10 bg-black/15 text-[var(--color-text-secondary)]'
              }`}
            >
              {value.label}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Sin dato.</p>
      )}
    </div>
  )
}

type ScalarComparison = {
  label: string
  value: string
  badge: string
  note: string
  state: 'match' | 'hint' | 'empty'
}

type OverlapValue = {
  key: string
  label: string
  match: boolean
}

function compareYear(guess: GameDetails, target: GameDetails): ScalarComparison {
  const guessYear = getYearFromDetails(guess)
  const targetYear = getYearFromDetails(target)

  return compareScalar({
    label: 'Año',
    value: guessYear ? String(guessYear) : null,
    guessValue: guessYear,
    targetValue: targetYear,
    matchTolerance: 0,
    equalText: 'Mismo año.',
    higherText: 'La correcta es más nueva.',
    lowerText: 'La correcta es más vieja.',
  })
}

function compareImdb(guess: GameDetails, target: GameDetails): ScalarComparison {
  const guessRating = ratingBySource(guess.externalRatings, 'IMDb')
  const targetRating = ratingBySource(target.externalRatings, 'IMDb')

  return compareScalar({
    label: 'IMDb',
    value: formatExternalRating(guessRating),
    guessValue: guessRating?.value ?? null,
    targetValue: targetRating?.value ?? null,
    matchTolerance: 0.1,
    equalText: 'Rating casi igual.',
    higherText: 'La correcta tiene más IMDb.',
    lowerText: 'La correcta tiene menos IMDb.',
  })
}

function compareDuration(guess: GameDetails, target: GameDetails): ScalarComparison {
  const guessValue = getDurationValue(guess)
  const targetValue = getDurationValue(target)

  return compareScalar({
    label: guess.mediaType === 'Movie' ? 'Duración' : 'Episodios',
    value: formatDurationValue(guess),
    guessValue,
    targetValue,
    matchTolerance: guess.mediaType === 'Movie' ? 5 : 0,
    equalText: guess.mediaType === 'Movie' ? 'Muy parecida.' : 'Misma cantidad.',
    higherText: guess.mediaType === 'Movie' ? 'La correcta es más larga.' : 'La correcta tiene más episodios.',
    lowerText: guess.mediaType === 'Movie' ? 'La correcta es más corta.' : 'La correcta tiene menos episodios.',
  })
}

function compareScalar({
  label,
  value,
  guessValue,
  targetValue,
  matchTolerance,
  equalText,
  higherText,
  lowerText,
}: {
  label: string
  value: string | null
  guessValue: number | null
  targetValue: number | null
  matchTolerance: number
  equalText: string
  higherText: string
  lowerText: string
}): ScalarComparison {
  if (value === null || guessValue === null || targetValue === null) {
    return { label, value: value ?? 'Sin dato', badge: '-', note: 'No hay dato suficiente.', state: 'empty' }
  }

  if (Math.abs(targetValue - guessValue) <= matchTolerance) {
    return { label, value, badge: 'OK', note: equalText, state: 'match' }
  }

  return {
    label,
    value,
    badge: targetValue > guessValue ? 'Sube' : 'Baja',
    note: targetValue > guessValue ? higherText : lowerText,
    state: 'hint',
  }
}

function compareStrings(guessValues: string[], targetValues: string[], limit: number): OverlapValue[] {
  const targetSet = new Set(targetValues.map(normalizeTitle))
  return guessValues.slice(0, limit).map((value) => ({
    key: normalizeTitle(value),
    label: value,
    match: targetSet.has(normalizeTitle(value)),
  }))
}

function comparePeople(guessValues: MediaPerson[], targetValues: MediaPerson[], limit: number): OverlapValue[] {
  const targetIds = new Set(targetValues.slice(0, 12).map((person) => person.tmdbId))
  return guessValues.slice(0, limit).map((person) => ({
    key: String(person.tmdbId),
    label: person.name,
    match: targetIds.has(person.tmdbId),
  }))
}

function compareCompanies(guessValues: CompanySummary[], targetValues: CompanySummary[]): OverlapValue[] {
  const targetIds = new Set(targetValues.map((company) => company.tmdbId))
  return guessValues.slice(0, 5).map((company) => ({
    key: String(company.tmdbId),
    label: company.name,
    match: targetIds.has(company.tmdbId),
  }))
}

function compareProviders(guessValues: WatchProvider[], targetValues: WatchProvider[]): OverlapValue[] {
  const targetIds = new Set(targetValues.map((provider) => provider.providerId))
  const uniqueGuess = uniqueBy(guessValues.filter((provider) => provider.type === 'Streaming'), (provider) => provider.providerId)
  const fallback = uniqueGuess.length > 0 ? uniqueGuess : uniqueBy(guessValues, (provider) => provider.providerId)

  return fallback.slice(0, 5).map((provider) => ({
    key: String(provider.providerId),
    label: provider.name,
    match: targetIds.has(provider.providerId),
  }))
}

function compareCrew(guessValues: MediaCrew[], targetValues: MediaCrew[]): OverlapValue[] {
  const targetIds = new Set(targetValues.map((person) => person.tmdbId))
  return guessValues.slice(0, 4).map((person) => ({
    key: `${person.tmdbId}-${person.job ?? ''}`,
    label: person.job ? `${person.name} (${person.job})` : person.name,
    match: targetIds.has(person.tmdbId),
  }))
}

function getMainCrew(detail: GameDetails) {
  const crew = detail.crew ?? []
  const preferredJobs = detail.mediaType === 'Movie'
    ? ['Director', 'Screenplay', 'Writer']
    : ['Creator', 'Executive Producer', 'Director', 'Writer']
  const preferred = crew.filter((member) => preferredJobs.includes(member.job ?? ''))
  return preferred.length > 0 ? preferred : crew.slice(0, 4)
}

function getYearFromDetails(detail: GameDetails) {
  const date = detail.mediaType === 'Movie' ? detail.releaseDate : detail.firstAirDate
  const year = Number(date?.slice(0, 4))
  return Number.isFinite(year) ? year : null
}

function getDurationValue(detail: GameDetails) {
  return detail.mediaType === 'Movie' ? detail.runtimeMinutes : detail.numberOfEpisodes
}

function formatDurationValue(detail: GameDetails) {
  if (detail.mediaType === 'Movie') {
    return formatRuntime(detail.runtimeMinutes)
  }

  if (!detail.numberOfEpisodes) {
    return null
  }

  return `${detail.numberOfEpisodes} eps.`
}

function formatRuntime(minutes: number | null) {
  if (!minutes) {
    return null
  }

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h${rest > 0 ? ` ${rest}m` : ''}` : `${rest}m`
}

function uniqueBy<TItem>(items: TItem[], keySelector: (item: TItem) => string | number) {
  const seen = new Set<string | number>()
  return items.filter((item) => {
    const key = keySelector(item)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

async function getGameDetails(item: MediaSummary): Promise<GameDetails> {
  return item.mediaType === 'Series' ? await getSeriesDetails(item.tmdbId) : await getMovieDetails(item.tmdbId)
}

async function getGameCandidatePage(mode: GameMode, page: number): Promise<PagedResponse<MediaSummary>> {
  const config = gameModeCollections.find((item) => item.value === mode) ?? gameModeCollections[0]

  if (config.rankingKey) {
    const ranking = config.mediaType === 'Series'
      ? await getSeriesRanking(config.rankingKey, page, 24)
      : await getMovieRanking(config.rankingKey, page, 24)

    return {
      items: ranking.items.map((item) => item.media),
      page: ranking.page,
      totalPages: ranking.totalPages,
      totalResults: ranking.totalResults,
      hasMore: ranking.hasMore,
    }
  }

  if (config.filters) {
    const { mediaType, ...filters } = config.filters
    return mediaType === 'Series' ? discoverSeries(filters, page) : discoverMovies(filters, page)
  }

  return getPopularMovies(page)
}

function getDetailHref(item: MediaSummary) {
  return item.mediaType === 'Series' ? `/series/${item.tmdbId}` : `/movies/${item.tmdbId}`
}

function pickDailyMovie(items: MediaSummary[], seed: number) {
  const candidates = items.filter((item) => item.posterUrl)
  return candidates[seed % Math.max(candidates.length, 1)] ?? items[0] ?? null
}

function pickSeededPage(seed: number, totalPages: number) {
  const pageCount = Math.max(totalPages, 1)
  const mixedSeed = Math.imul(seed + 1, 2_654_435_761) >>> 0
  return (mixedSeed % pageCount) + 1
}

function getRevealedTiles(level: number) {
  return new Set(revealPlan.slice(0, level + 1).flat())
}

function isPosterTileRevealed(index: number, level: number) {
  return getRevealedTiles(level).has(index)
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getDaySeed(dateKey: string) {
  const start = Date.UTC(2024, 0, 1)
  const today = Date.parse(`${dateKey}T00:00:00.000Z`)
  return Math.max(0, Math.floor((today - start) / 86_400_000))
}

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase()
}

function readStoredGame(storageKey: string, dateKey: string): StoredGame {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '') as StoredGame
    if (parsed.dateKey === dateKey) {
      return parsed
    }
  } catch {
    // Ignore old or malformed local data.
  }

  return { dateKey, guesses: [], solved: false, completed: false }
}

function writeStoredGame(storageKey: string, game: StoredGame) {
  localStorage.setItem(storageKey, JSON.stringify(game))
}

function readRoundOffset(dateKey: string, mode: GameMode) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${roundStorageKey}-${mode}`) ?? '') as { dateKey?: string; offset?: number }
    if (parsed.dateKey === dateKey && Number.isFinite(parsed.offset)) {
      return parsed.offset ?? 0
    }
  } catch {
    // Ignore old or malformed local data.
  }

  return 0
}

function writeRoundOffset(dateKey: string, mode: GameMode, offset: number) {
  localStorage.setItem(`${roundStorageKey}-${mode}`, JSON.stringify({ dateKey, offset }))
}

function readStats(): GameStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(statsStorageKey) ?? '') as GameStats
    return {
      played: parsed.played ?? 0,
      wins: parsed.wins ?? 0,
      streak: parsed.streak ?? 0,
      bestStreak: parsed.bestStreak ?? 0,
      lastCompletedDate: parsed.lastCompletedDate ?? null,
    }
  } catch {
    return { played: 0, wins: 0, streak: 0, bestStreak: 0, lastCompletedDate: null }
  }
}

function writeStats(stats: GameStats) {
  localStorage.setItem(statsStorageKey, JSON.stringify(stats))
}

function updateStats(stats: GameStats, dateKey: string, solved: boolean): GameStats {
  if (stats.lastCompletedDate === dateKey) {
    return stats
  }

  const yesterday = new Date(`${dateKey}T00:00:00.000Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)
  const nextStreak = solved ? (stats.lastCompletedDate === yesterdayKey ? stats.streak + 1 : 1) : 0

  return {
    played: stats.played + 1,
    wins: stats.wins + (solved ? 1 : 0),
    streak: nextStreak,
    bestStreak: Math.max(stats.bestStreak, nextStreak),
    lastCompletedDate: dateKey,
  }
}
