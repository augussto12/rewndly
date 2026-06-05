# TMDB Coverage

Source: https://developer.themoviedb.org/openapi/tmdb-api.json

TMDB v3 currently exposes 152 operations in the official OpenAPI file:

- 135 GET operations
- 12 POST operations
- 5 DELETE operations

## Implemented As First-Class UI

These endpoints are consumed through typed backend contracts and visible frontend screens:

- Public home lists: trending movies, now playing, popular movies, upcoming movies, trending series, popular series, trending people.
- Discovery: filterable movie/series discovery, top rated movies, top rated series, airing today series, on the air series, movie providers, and TV providers.
- Search: movies, TV series, people.
- Movie details with `append_to_response=credits,videos,watch/providers,recommendations,similar`.
- TV series details with `append_to_response=credits,videos,watch/providers,recommendations,similar`.
- Rich detail metadata: images, keywords, TMDB reviews, external IDs, translations, alternative titles, movie release dates, and TV content ratings.
- Series depth: season summaries on series detail, season detail pages, episode detail pages, season/episode credits, videos, images, external IDs, translations, and season watch providers.
- Person details with `append_to_response=combined_credits,images,external_ids`.
- People depth: separated movie credits, TV credits, profile images, tagged images, translations, and external profile links.
- Expanded entities: collection/saga pages, company pages, network pages, keyword pages, and TMDB review detail pages.
- Movie and TV details now link to collections, production companies, networks, keywords, and full TMDB reviews where available.
- TMDB account integration: authenticated Rewndly users can connect a TMDB account, store the TMDB session server-side, sync favorites/watchlist/ratings into the local library, and update TMDB favorite/watchlist/rating state from media detail pages.
- Genre lists for movies and TV.

## Implemented As Safe Read-Only Gateway

The backend exposes a controlled read-only gateway:

- `GET /api/tmdb/catalog`
- `GET /api/tmdb/public/{tmdbPath}`

The gateway is generated from the official OpenAPI file and allowlists 106 public GET endpoints. It rejects:

- arbitrary external URLs
- paths outside the OpenAPI allowlist
- `api_key` and `session_id` query parameters from clients
- account/auth/session/account state endpoints
- POST and DELETE operations

This lets the app consume lower-priority TMDB endpoints without adding a custom controller for every single one immediately.

## Exposed Only Behind Rewndly Auth

These require an authenticated Rewndly user plus a connected TMDB session stored server-side:

- Account favorites/watchlist/rated lists
- Add/delete ratings
- Create/delete TMDB sessions
- Add favorite / add to watchlist

Those operations mutate TMDB state or expose account-scoped data, so they stay out of the anonymous public gateway and are only available through `/api/me/tmdb/*`.

## Still Reserved

- Create/delete/update TMDB lists
- Guest session rated content
