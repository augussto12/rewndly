using System.Text.Json;
using System.Text.Json.Serialization;

namespace Rewndly.Infrastructure.ExternalServices.Tmdb;

public sealed record TmdbSearchResponseDto<T>(
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("results")] IReadOnlyList<T> Results,
    [property: JsonPropertyName("total_pages")] int TotalPages,
    [property: JsonPropertyName("total_results")] int TotalResults);

public sealed record TmdbMovieDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("original_title")] string? OriginalTitle,
    [property: JsonPropertyName("tagline")] string? Tagline,
    [property: JsonPropertyName("homepage")] string? Homepage,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("backdrop_path")] string? BackdropPath,
    [property: JsonPropertyName("release_date")] string? ReleaseDate,
    [property: JsonPropertyName("runtime")] int? Runtime,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage,
    [property: JsonPropertyName("genre_ids")] IReadOnlyList<int>? GenreIds,
    [property: JsonPropertyName("genres")] IReadOnlyList<TmdbGenreDto>? Genres,
    [property: JsonPropertyName("belongs_to_collection")] TmdbCollectionSummaryDto? BelongsToCollection,
    [property: JsonPropertyName("production_companies")] IReadOnlyList<TmdbCompanySummaryDto>? ProductionCompanies,
    [property: JsonPropertyName("credits")] TmdbCreditsDto? Credits,
    [property: JsonPropertyName("videos")] TmdbVideosResponseDto? Videos,
    [property: JsonPropertyName("watch/providers")] TmdbWatchProvidersResponseDto? WatchProviders,
    [property: JsonPropertyName("recommendations")] TmdbSearchResponseDto<TmdbMovieDto>? Recommendations,
    [property: JsonPropertyName("similar")] TmdbSearchResponseDto<TmdbMovieDto>? Similar,
    [property: JsonPropertyName("images")] TmdbImagesResponseDto? Images,
    [property: JsonPropertyName("keywords")] TmdbKeywordsResponseDto? Keywords,
    [property: JsonPropertyName("reviews")] TmdbSearchResponseDto<TmdbReviewDto>? Reviews,
    [property: JsonPropertyName("release_dates")] TmdbReleaseDatesResponseDto? ReleaseDates,
    [property: JsonPropertyName("external_ids")] TmdbExternalIdsDto? ExternalIds,
    [property: JsonPropertyName("translations")] TmdbTranslationsResponseDto? Translations,
    [property: JsonPropertyName("alternative_titles")] TmdbAlternativeTitlesResponseDto? AlternativeTitles);

public sealed record TmdbSeriesDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("original_name")] string? OriginalName,
    [property: JsonPropertyName("homepage")] string? Homepage,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("backdrop_path")] string? BackdropPath,
    [property: JsonPropertyName("first_air_date")] string? FirstAirDate,
    [property: JsonPropertyName("last_air_date")] string? LastAirDate,
    [property: JsonPropertyName("number_of_seasons")] int? NumberOfSeasons,
    [property: JsonPropertyName("number_of_episodes")] int? NumberOfEpisodes,
    [property: JsonPropertyName("status")] string? Status,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage,
    [property: JsonPropertyName("genre_ids")] IReadOnlyList<int>? GenreIds,
    [property: JsonPropertyName("genres")] IReadOnlyList<TmdbGenreDto>? Genres,
    [property: JsonPropertyName("production_companies")] IReadOnlyList<TmdbCompanySummaryDto>? ProductionCompanies,
    [property: JsonPropertyName("networks")] IReadOnlyList<TmdbNetworkSummaryDto>? Networks,
    [property: JsonPropertyName("credits")] TmdbCreditsDto? Credits,
    [property: JsonPropertyName("videos")] TmdbVideosResponseDto? Videos,
    [property: JsonPropertyName("watch/providers")] TmdbWatchProvidersResponseDto? WatchProviders,
    [property: JsonPropertyName("recommendations")] TmdbSearchResponseDto<TmdbSeriesDto>? Recommendations,
    [property: JsonPropertyName("similar")] TmdbSearchResponseDto<TmdbSeriesDto>? Similar,
    [property: JsonPropertyName("images")] TmdbImagesResponseDto? Images,
    [property: JsonPropertyName("keywords")] TmdbKeywordsResponseDto? Keywords,
    [property: JsonPropertyName("reviews")] TmdbSearchResponseDto<TmdbReviewDto>? Reviews,
    [property: JsonPropertyName("content_ratings")] TmdbContentRatingsResponseDto? ContentRatings,
    [property: JsonPropertyName("external_ids")] TmdbExternalIdsDto? ExternalIds,
    [property: JsonPropertyName("translations")] TmdbTranslationsResponseDto? Translations,
    [property: JsonPropertyName("alternative_titles")] TmdbAlternativeTitlesResponseDto? AlternativeTitles,
    [property: JsonPropertyName("seasons")] IReadOnlyList<TmdbSeasonDto>? Seasons);

public sealed record TmdbGenreDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name);

public sealed record TmdbGenresResponseDto(
    [property: JsonPropertyName("genres")] IReadOnlyList<TmdbGenreDto> Genres);

public sealed record TmdbImageOptions(
    string ImageBaseUrl,
    string PosterSize,
    string BackdropSize);

public sealed record TmdbCreditsDto(
    [property: JsonPropertyName("cast")] IReadOnlyList<TmdbCastMemberDto>? Cast,
    [property: JsonPropertyName("crew")] IReadOnlyList<TmdbCrewMemberDto>? Crew);

public sealed record TmdbCastMemberDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("character")] string? Character,
    [property: JsonPropertyName("profile_path")] string? ProfilePath,
    [property: JsonPropertyName("order")] int? Order);

public sealed record TmdbCrewMemberDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("job")] string? Job,
    [property: JsonPropertyName("department")] string? Department,
    [property: JsonPropertyName("profile_path")] string? ProfilePath);

public sealed record TmdbVideosResponseDto(
    [property: JsonPropertyName("results")] IReadOnlyList<TmdbVideoDto> Results);

public sealed record TmdbVideoDto(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("key")] string Key,
    [property: JsonPropertyName("site")] string Site,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("official")] bool Official);

public sealed record TmdbWatchProvidersResponseDto(
    [property: JsonPropertyName("results")] IReadOnlyDictionary<string, TmdbCountryWatchProvidersDto> Results);

public sealed record TmdbCountryWatchProvidersDto(
    [property: JsonPropertyName("flatrate")] IReadOnlyList<TmdbWatchProviderDto>? Flatrate,
    [property: JsonPropertyName("rent")] IReadOnlyList<TmdbWatchProviderDto>? Rent,
    [property: JsonPropertyName("buy")] IReadOnlyList<TmdbWatchProviderDto>? Buy);

public sealed record TmdbWatchProviderDto(
    [property: JsonPropertyName("provider_id")] int ProviderId,
    [property: JsonPropertyName("provider_name")] string ProviderName,
    [property: JsonPropertyName("logo_path")] string? LogoPath,
    [property: JsonPropertyName("display_priority")] int DisplayPriority);

public sealed record TmdbWatchProviderListResponseDto(
    [property: JsonPropertyName("results")] IReadOnlyList<TmdbWatchProviderDto> Results);

public sealed record TmdbImagesResponseDto(
    [property: JsonPropertyName("backdrops")] IReadOnlyList<TmdbImageDto>? Backdrops,
    [property: JsonPropertyName("posters")] IReadOnlyList<TmdbImageDto>? Posters,
    [property: JsonPropertyName("logos")] IReadOnlyList<TmdbImageDto>? Logos);

public sealed record TmdbImageDto(
    [property: JsonPropertyName("file_path")] string? FilePath,
    [property: JsonPropertyName("width")] int? Width,
    [property: JsonPropertyName("height")] int? Height,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage);

public sealed record TmdbKeywordsResponseDto(
    [property: JsonPropertyName("keywords")] IReadOnlyList<TmdbKeywordDto>? Keywords,
    [property: JsonPropertyName("results")] IReadOnlyList<TmdbKeywordDto>? Results);

public sealed record TmdbKeywordDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name);

public sealed record TmdbCollectionSummaryDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("backdrop_path")] string? BackdropPath);

public sealed record TmdbCollectionDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("backdrop_path")] string? BackdropPath,
    [property: JsonPropertyName("parts")] IReadOnlyList<TmdbMovieDto>? Parts,
    [property: JsonPropertyName("images")] TmdbImagesResponseDto? Images,
    [property: JsonPropertyName("translations")] TmdbTranslationsResponseDto? Translations);

public sealed record TmdbCompanySummaryDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("logo_path")] string? LogoPath,
    [property: JsonPropertyName("origin_country")] string? OriginCountry);

public sealed record TmdbCompanyDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("headquarters")] string? Headquarters,
    [property: JsonPropertyName("homepage")] string? Homepage,
    [property: JsonPropertyName("logo_path")] string? LogoPath,
    [property: JsonPropertyName("origin_country")] string? OriginCountry,
    [property: JsonPropertyName("parent_company")] TmdbCompanySummaryDto? ParentCompany,
    [property: JsonPropertyName("alternative_names")] TmdbEntityAliasesResponseDto? AlternativeNames,
    [property: JsonPropertyName("images")] TmdbImagesResponseDto? Images);

public sealed record TmdbNetworkSummaryDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("logo_path")] string? LogoPath,
    [property: JsonPropertyName("origin_country")] string? OriginCountry);

public sealed record TmdbNetworkDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("headquarters")] string? Headquarters,
    [property: JsonPropertyName("homepage")] string? Homepage,
    [property: JsonPropertyName("logo_path")] string? LogoPath,
    [property: JsonPropertyName("origin_country")] string? OriginCountry,
    [property: JsonPropertyName("alternative_names")] TmdbEntityAliasesResponseDto? AlternativeNames,
    [property: JsonPropertyName("images")] TmdbImagesResponseDto? Images);

public sealed record TmdbEntityAliasesResponseDto(
    [property: JsonPropertyName("results")] IReadOnlyList<TmdbEntityAliasDto>? Results);

public sealed record TmdbEntityAliasDto(
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("type")] string? Type);

public sealed record TmdbReviewDto(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("author")] string Author,
    [property: JsonPropertyName("author_details")] TmdbReviewAuthorDto? AuthorDetails,
    [property: JsonPropertyName("content")] string? Content,
    [property: JsonPropertyName("created_at")] string? CreatedAt,
    [property: JsonPropertyName("url")] string? Url);

public sealed record TmdbReviewAuthorDto(
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("avatar_path")] string? AvatarPath,
    [property: JsonPropertyName("rating")] decimal? Rating);

public sealed record TmdbReleaseDatesResponseDto(
    [property: JsonPropertyName("results")] IReadOnlyList<TmdbCountryReleaseDatesDto>? Results);

public sealed record TmdbCountryReleaseDatesDto(
    [property: JsonPropertyName("iso_3166_1")] string Country,
    [property: JsonPropertyName("release_dates")] IReadOnlyList<TmdbReleaseDateDto>? ReleaseDates);

public sealed record TmdbReleaseDateDto(
    [property: JsonPropertyName("certification")] string? Certification,
    [property: JsonPropertyName("release_date")] string? ReleaseDate,
    [property: JsonPropertyName("type")] int? Type);

public sealed record TmdbContentRatingsResponseDto(
    [property: JsonPropertyName("results")] IReadOnlyList<TmdbContentRatingDto>? Results);

public sealed record TmdbContentRatingDto(
    [property: JsonPropertyName("iso_3166_1")] string Country,
    [property: JsonPropertyName("rating")] string? Rating);

public sealed record TmdbExternalIdsDto(
    [property: JsonPropertyName("imdb_id")] string? ImdbId,
    [property: JsonPropertyName("facebook_id")] string? FacebookId,
    [property: JsonPropertyName("instagram_id")] string? InstagramId,
    [property: JsonPropertyName("twitter_id")] string? TwitterId,
    [property: JsonPropertyName("wikidata_id")] string? WikidataId);

public sealed record TmdbTranslationsResponseDto(
    [property: JsonPropertyName("translations")] IReadOnlyList<TmdbTranslationDto>? Translations);

public sealed record TmdbTranslationDto(
    [property: JsonPropertyName("iso_639_1")] string LanguageCode,
    [property: JsonPropertyName("iso_3166_1")] string? CountryCode,
    [property: JsonPropertyName("english_name")] string? EnglishName,
    [property: JsonPropertyName("name")] string? Name);

public sealed record TmdbAlternativeTitlesResponseDto(
    [property: JsonPropertyName("titles")] IReadOnlyList<TmdbAlternativeTitleDto>? Titles,
    [property: JsonPropertyName("results")] IReadOnlyList<TmdbAlternativeTitleDto>? Results);

public sealed record TmdbAlternativeTitleDto(
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("iso_3166_1")] string? Country,
    [property: JsonPropertyName("type")] string? Type);

public sealed record TmdbSeasonDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("season_number")] int SeasonNumber,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("air_date")] string? AirDate,
    [property: JsonPropertyName("episode_count")] int? EpisodeCount,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage,
    [property: JsonPropertyName("episodes")] IReadOnlyList<TmdbEpisodeDto>? Episodes,
    [property: JsonPropertyName("credits")] TmdbCreditsDto? Credits,
    [property: JsonPropertyName("videos")] TmdbVideosResponseDto? Videos,
    [property: JsonPropertyName("watch/providers")] TmdbWatchProvidersResponseDto? WatchProviders,
    [property: JsonPropertyName("images")] TmdbImagesResponseDto? Images,
    [property: JsonPropertyName("external_ids")] TmdbExternalIdsDto? ExternalIds,
    [property: JsonPropertyName("translations")] TmdbTranslationsResponseDto? Translations);

public sealed record TmdbEpisodeDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("episode_number")] int EpisodeNumber,
    [property: JsonPropertyName("season_number")] int SeasonNumber,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("still_path")] string? StillPath,
    [property: JsonPropertyName("air_date")] string? AirDate,
    [property: JsonPropertyName("runtime")] int? Runtime,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage,
    [property: JsonPropertyName("credits")] TmdbCreditsDto? Credits,
    [property: JsonPropertyName("videos")] TmdbVideosResponseDto? Videos,
    [property: JsonPropertyName("images")] TmdbImagesResponseDto? Images,
    [property: JsonPropertyName("external_ids")] TmdbExternalIdsDto? ExternalIds,
    [property: JsonPropertyName("translations")] TmdbTranslationsResponseDto? Translations);

public sealed record TmdbPersonDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("biography")] string? Biography,
    [property: JsonPropertyName("birthday")] string? Birthday,
    [property: JsonPropertyName("deathday")] string? Deathday,
    [property: JsonPropertyName("place_of_birth")] string? PlaceOfBirth,
    [property: JsonPropertyName("known_for_department")] string? KnownForDepartment,
    [property: JsonPropertyName("profile_path")] string? ProfilePath,
    [property: JsonPropertyName("homepage")] string? Homepage,
    [property: JsonPropertyName("imdb_id")] string? ImdbId,
    [property: JsonPropertyName("popularity")] decimal? Popularity,
    [property: JsonPropertyName("known_for")] IReadOnlyList<TmdbMixedMediaDto>? KnownFor,
    [property: JsonPropertyName("combined_credits")] TmdbCombinedCreditsDto? CombinedCredits,
    [property: JsonPropertyName("movie_credits")] TmdbCombinedCreditsDto? MovieCredits,
    [property: JsonPropertyName("tv_credits")] TmdbCombinedCreditsDto? TvCredits,
    [property: JsonPropertyName("images")] TmdbPersonImagesResponseDto? Images,
    [property: JsonPropertyName("tagged_images")] TmdbSearchResponseDto<TmdbTaggedImageDto>? TaggedImages,
    [property: JsonPropertyName("external_ids")] TmdbExternalIdsDto? ExternalIds,
    [property: JsonPropertyName("translations")] TmdbTranslationsResponseDto? Translations);

public sealed record TmdbPersonImagesResponseDto(
    [property: JsonPropertyName("profiles")] IReadOnlyList<TmdbImageDto>? Profiles);

public sealed record TmdbTaggedImageDto(
    [property: JsonPropertyName("file_path")] string? FilePath,
    [property: JsonPropertyName("width")] int? Width,
    [property: JsonPropertyName("height")] int? Height,
    [property: JsonPropertyName("media")] TmdbMixedMediaDto? Media);

public sealed record TmdbCombinedCreditsDto(
    [property: JsonPropertyName("cast")] IReadOnlyList<TmdbMixedMediaDto>? Cast,
    [property: JsonPropertyName("crew")] IReadOnlyList<TmdbMixedMediaDto>? Crew);

public sealed record TmdbMixedMediaDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("media_type")] string? MediaType,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("overview")] string? Overview,
    [property: JsonPropertyName("poster_path")] string? PosterPath,
    [property: JsonPropertyName("backdrop_path")] string? BackdropPath,
    [property: JsonPropertyName("release_date")] string? ReleaseDate,
    [property: JsonPropertyName("first_air_date")] string? FirstAirDate,
    [property: JsonPropertyName("vote_average")] decimal? VoteAverage,
    [property: JsonPropertyName("genre_ids")] IReadOnlyList<int>? GenreIds,
    [property: JsonPropertyName("popularity")] decimal? Popularity);

public sealed record TmdbRequestTokenDto(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("expires_at")] string? ExpiresAt,
    [property: JsonPropertyName("request_token")] string RequestToken);

public sealed record TmdbCreateSessionRequestDto(
    [property: JsonPropertyName("request_token")] string RequestToken);

public sealed record TmdbSessionDto(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("session_id")] string SessionId);

public sealed record TmdbDeleteSessionRequestDto(
    [property: JsonPropertyName("session_id")] string SessionId);

public sealed record TmdbAccountDetailsDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("avatar")] TmdbAccountAvatarDto? Avatar);

public sealed record TmdbAccountAvatarDto(
    [property: JsonPropertyName("tmdb")] TmdbAccountAvatarPathDto? Tmdb);

public sealed record TmdbAccountAvatarPathDto(
    [property: JsonPropertyName("avatar_path")] string? AvatarPath);

public sealed record TmdbAccountStateDto(
    [property: JsonPropertyName("favorite")] bool Favorite,
    [property: JsonPropertyName("watchlist")] bool Watchlist,
    [property: JsonPropertyName("rated")] JsonElement Rated);

public sealed record TmdbAccountActionDto(
    [property: JsonPropertyName("media_type")] string MediaType,
    [property: JsonPropertyName("media_id")] int MediaId,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [property: JsonPropertyName("favorite")] bool? Favorite,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [property: JsonPropertyName("watchlist")] bool? Watchlist);

public sealed record TmdbRatingDto(
    [property: JsonPropertyName("value")] decimal Value);

public sealed record TmdbActionResultDto(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("status_code")] int StatusCode,
    [property: JsonPropertyName("status_message")] string? StatusMessage);
