# TMDB Endpoint Roadmap

Source: https://developer.themoviedb.org/openapi/tmdb-api.json

Important distinction:

- `First-class UI`: typed backend contract plus a visible frontend page/component.
- `Gateway`: available through `GET /api/tmdb/public/{tmdbPath}` after allowlist validation, but not necessarily presented in a polished UI yet.
- `Reserved`: account/session/mutation operations that should wait for explicit TMDB auth and user consent.

Current public read-only gateway coverage: 106 endpoints.

## COLLECTION (3)
Sagas o colecciones de peliculas, por ejemplo una franquicia.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/collection/{collection_id}` | Details (`collection-details`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/collection/{collection_id}/images` | Images (`collection-images`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/collection/{collection_id}/translations` | Translations (`collection-translations`) | First-class UI / typed service, or appended into a typed detail response |

## COMPANY (3)
Productoras y companias relacionadas con titulos.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/company/{company_id}` | Details (`company-details`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/company/{company_id}/alternative_names` | Alternative Names (`company-alternative-names`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/company/{company_id}/images` | Images (`company-images`) | First-class UI / typed service, or appended into a typed detail response |

## CONFIGURATION (1)
Metadatos globales como paises soportados.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/configuration/countries` | Countries (`configuration-countries`) | Gateway only for now |

## CREDIT (1)
Detalle puntual de un credito de reparto/equipo.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/credit/{credit_id}` | Details (`credit-details`) | Gateway only for now |

## DISCOVER (2)
Buscadores avanzados por filtros, fechas, genero, proveedor, rating y mas.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/discover/movie` | Movie (`discover-movie`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/discover/tv` | TV (`discover-tv`) | First-class UI / typed service, or appended into a typed detail response |

## FIND (1)
Resolver IDs externos, por ejemplo IMDb, hacia entidades TMDB.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/find/{external_id}` | Find By ID (`find-by-id`) | Gateway only for now |

## GENRE (2)
Listas de generos para peliculas y series.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/genre/movie/list` | Movie List (`genre-movie-list`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/genre/tv/list` | TV List (`genre-tv-list`) | First-class UI / typed service, or appended into a typed detail response |

## KEYWORD (2)
Palabras clave y peliculas asociadas.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/keyword/{keyword_id}` | Details (`keyword-details`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/keyword/{keyword_id}/movies` | Movies (`keyword-movies`) | First-class UI / typed service, or appended into a typed detail response |

## LIST (2)
Listas publicas TMDB v3 y estado de un item.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/list/{list_id}` | Details (`list-details`) | Gateway only for now |
| `/3/list/{list_id}/item_status` | Check Item Status (`list-check-item-status`) | Gateway only for now |

## MOVIE (20)
Listas y detalles de peliculas.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/movie/{movie_id}` | Details (`movie-details`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/alternative_titles` | Alternative Titles (`movie-alternative-titles`) | Gateway only for now |
| `/3/movie/{movie_id}/changes` | Changes (`movie-changes`) | Gateway only for now |
| `/3/movie/{movie_id}/credits` | Credits (`movie-credits`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/external_ids` | External IDs (`movie-external-ids`) | Gateway only for now |
| `/3/movie/{movie_id}/images` | Images (`movie-images`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/keywords` | Keywords (`movie-keywords`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/lists` | Lists (`movie-lists`) | Gateway only for now |
| `/3/movie/{movie_id}/recommendations` | Recommendations (`movie-recommendations`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/release_dates` | Release Dates (`movie-release-dates`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/reviews` | Reviews (`movie-reviews`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/similar` | Similar (`movie-similar`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/translations` | Translations (`movie-translations`) | Gateway only for now |
| `/3/movie/{movie_id}/videos` | Videos (`movie-videos`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/{movie_id}/watch/providers` | Watch Providers (`movie-watch-providers`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/changes` | Movie List (`changes-movie-list`) | Gateway only for now |
| `/3/movie/now_playing` | Now Playing (`movie-now-playing-list`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/popular` | Popular (`movie-popular-list`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/movie/top_rated` | Top Rated (`movie-top-rated-list`) | Gateway only for now |
| `/3/movie/upcoming` | Upcoming (`movie-upcoming-list`) | First-class UI / typed service, or appended into a typed detail response |

## NETWORK (3)
Cadenas/redes de TV.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/network/{network_id}` | Details (`network-details`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/network/{network_id}/alternative_names` | Alternative Names (`details-copy`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/network/{network_id}/images` | Images (`alternative-names-copy`) | First-class UI / typed service, or appended into a typed detail response |

## PERSON (11)
Actores, creadores y personas.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/person/{person_id}` | Details (`person-details`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/person/{person_id}/changes` | Changes (`person-changes`) | Gateway only for now |
| `/3/person/{person_id}/combined_credits` | Combined Credits (`person-combined-credits`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/person/{person_id}/external_ids` | External IDs (`person-external-ids`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/person/{person_id}/images` | Images (`person-images`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/person/{person_id}/movie_credits` | Movie Credits (`person-movie-credits`) | Gateway only for now |
| `/3/person/{person_id}/tagged_images` | Tagged Images (`person-tagged-images`) | Gateway only for now |
| `/3/person/{person_id}/translations` | Translations (`translations`) | Gateway only for now |
| `/3/person/{person_id}/tv_credits` | TV Credits (`person-tv-credits`) | Gateway only for now |
| `/3/person/changes` | People List (`changes-people-list`) | Gateway only for now |
| `/3/person/popular` | Popular (`person-popular-list`) | Gateway only for now |

## REVIEW (1)
Detalle de reviews de TMDB.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/review/{review_id}` | Details (`review-details`) | First-class UI / typed service, or appended into a typed detail response |

## SEARCH (7)
Busquedas por tipo o multi-busqueda.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/search/collection` | Collection (`search-collection`) | Gateway only for now |
| `/3/search/company` | Company (`search-company`) | Gateway only for now |
| `/3/search/keyword` | Keyword (`search-keyword`) | Gateway only for now |
| `/3/search/movie` | Movie (`search-movie`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/search/multi` | Multi (`search-multi`) | Gateway only for now |
| `/3/search/person` | Person (`search-person`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/search/tv` | TV (`search-tv`) | First-class UI / typed service, or appended into a typed detail response |

## TRENDING (4)
Tendencias por ventana de tiempo.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/trending/all/{time_window}` | All (`trending-all`) | Gateway only for now |
| `/3/trending/movie/{time_window}` | Movies (`trending-movies`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/trending/person/{time_window}` | People (`trending-people`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/trending/tv/{time_window}` | TV (`trending-tv`) | First-class UI / typed service, or appended into a typed detail response |

## TV (40)
Series, temporadas, episodios y listas de TV.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/tv/{series_id}` | Details (`tv-series-details`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/tv/{series_id}/aggregate_credits` | Aggregate Credits (`tv-series-aggregate-credits`) | Gateway only for now |
| `/3/tv/{series_id}/alternative_titles` | Alternative Titles (`tv-series-alternative-titles`) | Gateway only for now |
| `/3/tv/{series_id}/changes` | Changes (`tv-series-changes`) | Gateway only for now |
| `/3/tv/{series_id}/content_ratings` | Content Ratings (`tv-series-content-ratings`) | Gateway only for now |
| `/3/tv/{series_id}/credits` | Credits (`tv-series-credits`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/tv/{series_id}/episode_groups` | Episode Groups (`tv-series-episode-groups`) | Gateway only for now |
| `/3/tv/{series_id}/external_ids` | External IDs (`tv-series-external-ids`) | Gateway only for now |
| `/3/tv/{series_id}/images` | Images (`tv-series-images`) | Gateway only for now |
| `/3/tv/{series_id}/keywords` | Keywords (`tv-series-keywords`) | Gateway only for now |
| `/3/tv/{series_id}/lists` | Lists (`lists-copy`) | Gateway only for now |
| `/3/tv/{series_id}/recommendations` | Recommendations (`tv-series-recommendations`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/tv/{series_id}/reviews` | Reviews (`tv-series-reviews`) | Gateway only for now |
| `/3/tv/{series_id}/screened_theatrically` | Screened Theatrically (`tv-series-screened-theatrically`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}` | Details (`tv-season-details`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/aggregate_credits` | Aggregate Credits (`tv-season-aggregate-credits`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/credits` | Credits (`tv-season-credits`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/episode/{episode_number}` | Details (`tv-episode-details`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/credits` | Credits (`tv-episode-credits`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/external_ids` | External IDs (`tv-episode-external-ids`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/images` | Images (`tv-episode-images`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/translations` | Translations (`tv-episode-translations`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/episode/{episode_number}/videos` | Videos (`tv-episode-videos`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/external_ids` | External IDs (`tv-season-external-ids`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/images` | Images (`tv-season-images`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/translations` | Translations (`tv-season-translations`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/videos` | Videos (`tv-season-videos`) | Gateway only for now |
| `/3/tv/{series_id}/season/{season_number}/watch/providers` | Watch Providers (`tv-season-watch-providers`) | Gateway only for now |
| `/3/tv/{series_id}/similar` | Similar (`tv-series-similar`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/tv/{series_id}/translations` | Translations (`tv-series-translations`) | Gateway only for now |
| `/3/tv/{series_id}/videos` | Videos (`tv-series-videos`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/tv/{series_id}/watch/providers` | Watch Providers (`tv-series-watch-providers`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/tv/airing_today` | Airing Today (`tv-series-airing-today-list`) | Gateway only for now |
| `/3/tv/changes` | TV List (`changes-tv-list`) | Gateway only for now |
| `/3/tv/episode/{episode_id}/changes` | Changes (`tv-episode-changes-by-id`) | Gateway only for now |
| `/3/tv/episode_group/{tv_episode_group_id}` | Details (`tv-episode-group-details`) | Gateway only for now |
| `/3/tv/on_the_air` | On The Air (`tv-series-on-the-air-list`) | Gateway only for now |
| `/3/tv/popular` | Popular (`tv-series-popular-list`) | First-class UI / typed service, or appended into a typed detail response |
| `/3/tv/season/{season_id}/changes` | Changes (`tv-season-changes-by-id`) | Gateway only for now |
| `/3/tv/top_rated` | Top Rated (`tv-series-top-rated-list`) | Gateway only for now |

## WATCH (3)
Proveedores de streaming/compra/alquiler y regiones.

| Endpoint | Meaning | Current status |
| --- | --- | --- |
| `/3/watch/providers/movie` | Movie Providers (`watch-providers-movie-list`) | Gateway only for now |
| `/3/watch/providers/regions` | Available Regions (`watch-providers-available-regions`) | Gateway only for now |
| `/3/watch/providers/tv` | TV Providers (`watch-provider-tv-list`) | Gateway only for now |

## Implementation Phases

### Phase 1 - Discovery UX
Implemented: /discover with movie/series filters by genre, year, provider, sort and minimum rating, plus top-rated and TV airing shelves.

### Phase 2 - Rich Detail Pages
Implemented: detail pages now expose images, TMDB reviews, keywords, external links, alternative titles, translations, movie release info, and TV content ratings in a tabbed ficha extendida.

### Phase 3 - Series Depth
Implemented: series detail links to season pages, season pages list episodes, episode pages show stills, metadata, cast, crew, videos, images, translations, external links, and season watch providers. Remaining deeper TV items include aggregate credits, episode groups, screened theatrically, and change-history endpoints.

### Phase 4 - People Depth
Implemented: person pages now separate featured credits, movie credits and TV credits, plus profile images, tagged images, translations, and external profile links. Remaining person-specific item: change-history endpoints.

### Phase 5 - Expanded Entities
Implemented: movie and series detail pages now link to collection/saga, production company, network, keyword, and full TMDB review pages. Collection pages show saga parts, company pages show popular movies and related series, network pages show popular series, keyword pages show movies and series, and review pages show the full TMDB review text. Remaining expanded-entity items: public TMDB list pages, search for collection/company/keyword, and find-by-external-id flows.

### Phase 6 - TMDB Account Features
Implemented: secure TMDB user auth flow with server-side protected session storage, connection status, disconnect, remote favorites/watchlist/ratings, add/remove favorite, add/remove watchlist, add/delete rating, and sync into the local Rewndly library. Remaining account features: create/delete/update TMDB lists and guest sessions.




