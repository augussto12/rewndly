namespace Rewndly.Application.Modules.Public;

public sealed record PublicHomeResponse(
    IReadOnlyList<MediaSummaryResponse> TrendingMovies,
    IReadOnlyList<MediaSummaryResponse> NowPlayingMovies,
    IReadOnlyList<MediaSummaryResponse> PopularMovies,
    IReadOnlyList<MediaSummaryResponse> UpcomingMovies,
    IReadOnlyList<MediaSummaryResponse> TrendingSeries,
    IReadOnlyList<MediaSummaryResponse> PopularSeries,
    IReadOnlyList<PersonSummaryResponse> TrendingPeople);

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int Page,
    int TotalPages,
    int TotalResults,
    bool HasMore);

public sealed record MediaSummaryResponse(
    int TmdbId,
    string Title,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    DateOnly? ReleaseDate,
    decimal? VoteAverage,
    IReadOnlyList<string> Genres,
    string MediaType);

public sealed record MovieDetailsResponse(
    int TmdbId,
    string Title,
    string? OriginalTitle,
    string? Tagline,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    DateOnly? ReleaseDate,
    int? RuntimeMinutes,
    decimal? VoteAverage,
    IReadOnlyList<string> Genres,
    string? Homepage,
    CollectionSummaryResponse? Collection,
    IReadOnlyList<CompanySummaryResponse> ProductionCompanies,
    IReadOnlyList<MediaPersonResponse> Cast,
    IReadOnlyList<MediaCrewResponse> Crew,
    IReadOnlyList<MediaVideoResponse> Videos,
    IReadOnlyList<WatchProviderResponse> WatchProviders,
    IReadOnlyList<MediaSummaryResponse> Recommendations,
    IReadOnlyList<MediaSummaryResponse> Similar,
    IReadOnlyList<MediaImageResponse> Images,
    IReadOnlyList<MediaKeywordResponse> Keywords,
    IReadOnlyList<MediaReviewResponse> TmdbReviews,
    IReadOnlyList<MediaExternalLinkResponse> ExternalLinks,
    IReadOnlyList<MediaAlternativeTitleResponse> AlternativeTitles,
    IReadOnlyList<MediaTranslationResponse> Translations,
    IReadOnlyList<MovieReleaseInfoResponse> ReleaseInfo,
    IReadOnlyList<ExternalRatingResponse> ExternalRatings,
    DateTimeOffset? RatingsCachedAt,
    string MediaType);

public sealed record SeriesDetailsResponse(
    int TmdbId,
    string Name,
    string? OriginalName,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    DateOnly? FirstAirDate,
    DateOnly? LastAirDate,
    int? NumberOfSeasons,
    int? NumberOfEpisodes,
    string? Status,
    decimal? VoteAverage,
    IReadOnlyList<string> Genres,
    string? Homepage,
    IReadOnlyList<CompanySummaryResponse> ProductionCompanies,
    IReadOnlyList<NetworkSummaryResponse> Networks,
    IReadOnlyList<MediaPersonResponse> Cast,
    IReadOnlyList<MediaCrewResponse> Crew,
    IReadOnlyList<MediaVideoResponse> Videos,
    IReadOnlyList<WatchProviderResponse> WatchProviders,
    IReadOnlyList<MediaSummaryResponse> Recommendations,
    IReadOnlyList<MediaSummaryResponse> Similar,
    IReadOnlyList<MediaImageResponse> Images,
    IReadOnlyList<MediaKeywordResponse> Keywords,
    IReadOnlyList<MediaReviewResponse> TmdbReviews,
    IReadOnlyList<MediaExternalLinkResponse> ExternalLinks,
    IReadOnlyList<MediaAlternativeTitleResponse> AlternativeTitles,
    IReadOnlyList<MediaTranslationResponse> Translations,
    IReadOnlyList<SeriesContentRatingResponse> ContentRatings,
    IReadOnlyList<SeasonSummaryResponse> Seasons,
    IReadOnlyList<ExternalRatingResponse> ExternalRatings,
    DateTimeOffset? RatingsCachedAt,
    string MediaType);

public sealed record ExternalRatingsResponse(
    IReadOnlyList<ExternalRatingResponse> Ratings,
    DateTimeOffset? CachedAt);

public sealed record ExternalRatingsBatchRequest(
    IReadOnlyList<ExternalRatingsBatchItemRequest> Items);

public sealed record ExternalRatingsBatchItemRequest(
    string MediaType,
    int TmdbId);

public sealed record ExternalRatingsBatchItemResponse(
    string MediaType,
    int TmdbId,
    IReadOnlyList<ExternalRatingResponse> Ratings,
    DateTimeOffset? CachedAt);

public sealed record ExternalRatingResponse(
    string Source,
    string Label,
    decimal Value,
    decimal Scale,
    int? Votes);

public sealed record RankedMediaSummaryResponse(
    MediaSummaryResponse Media,
    int Rank,
    string Source,
    decimal? Score,
    decimal? ScoreScale);

public sealed record MediaRankingResponse(
    IReadOnlyList<RankedMediaSummaryResponse> Items,
    int Page,
    int TotalPages,
    int TotalResults,
    bool HasMore,
    string RankingKey,
    string Source,
    DateTimeOffset? CachedAt,
    bool IsStale);

public sealed record GenreResponse(
    int TmdbId,
    string Name);

public sealed record WatchProviderOptionResponse(
    int ProviderId,
    string Name,
    string? LogoUrl);

public sealed record MediaPersonResponse(
    int TmdbId,
    string Name,
    string? Role,
    string? ProfileUrl);

public sealed record MediaCrewResponse(
    int TmdbId,
    string Name,
    string? Job,
    string? Department,
    string? ProfileUrl);

public sealed record MediaVideoResponse(
    string Name,
    string Key,
    string Site,
    string Type,
    bool Official);

public sealed record WatchProviderResponse(
    int ProviderId,
    string Name,
    string? LogoUrl,
    string Type);

public sealed record MediaImageResponse(
    string Url,
    int? Width,
    int? Height,
    string Type);

public sealed record MediaKeywordResponse(
    int TmdbId,
    string Name);

public sealed record CollectionSummaryResponse(
    int TmdbId,
    string Name,
    string? PosterUrl,
    string? BackdropUrl);

public sealed record CollectionDetailsResponse(
    int TmdbId,
    string Name,
    string? Overview,
    string? PosterUrl,
    string? BackdropUrl,
    IReadOnlyList<MediaSummaryResponse> Parts,
    IReadOnlyList<MediaImageResponse> Images,
    IReadOnlyList<MediaTranslationResponse> Translations);

public sealed record CompanySummaryResponse(
    int TmdbId,
    string Name,
    string? LogoUrl,
    string? OriginCountry);

public sealed record CompanyDetailsResponse(
    int TmdbId,
    string Name,
    string? Description,
    string? Headquarters,
    string? Homepage,
    string? LogoUrl,
    string? OriginCountry,
    CompanySummaryResponse? ParentCompany,
    IReadOnlyList<EntityAliasResponse> AlternativeNames,
    IReadOnlyList<MediaImageResponse> Images,
    IReadOnlyList<MediaSummaryResponse> Movies,
    IReadOnlyList<MediaSummaryResponse> Series);

public sealed record NetworkSummaryResponse(
    int TmdbId,
    string Name,
    string? LogoUrl,
    string? OriginCountry);

public sealed record NetworkDetailsResponse(
    int TmdbId,
    string Name,
    string? Headquarters,
    string? Homepage,
    string? LogoUrl,
    string? OriginCountry,
    IReadOnlyList<EntityAliasResponse> AlternativeNames,
    IReadOnlyList<MediaImageResponse> Images,
    IReadOnlyList<MediaSummaryResponse> Series);

public sealed record EntityAliasResponse(
    string Name,
    string? Type);

public sealed record KeywordDetailsResponse(
    int TmdbId,
    string Name,
    IReadOnlyList<MediaSummaryResponse> Movies,
    IReadOnlyList<MediaSummaryResponse> Series);

public sealed record MediaReviewResponse(
    string Id,
    string Author,
    string? Username,
    string? AvatarUrl,
    decimal? Rating,
    string Content,
    DateTimeOffset? CreatedAt,
    string? Url);

public sealed record MediaExternalLinkResponse(
    string Site,
    string Id,
    string Url);

public sealed record MediaAlternativeTitleResponse(
    string Title,
    string? Country,
    string? Type);

public sealed record MediaTranslationResponse(
    string LanguageCode,
    string? CountryCode,
    string? EnglishName,
    string? Name);

public sealed record MovieReleaseInfoResponse(
    string Country,
    string? Certification,
    DateTimeOffset? ReleaseDate,
    int? Type);

public sealed record SeriesContentRatingResponse(
    string Country,
    string Rating);

public sealed record SeasonSummaryResponse(
    int TmdbId,
    int SeasonNumber,
    string Name,
    string? Overview,
    string? PosterUrl,
    DateOnly? AirDate,
    int? EpisodeCount,
    decimal? VoteAverage);

public sealed record SeasonDetailsResponse(
    int TmdbId,
    int SeriesTmdbId,
    int SeasonNumber,
    string Name,
    string? Overview,
    string? PosterUrl,
    DateOnly? AirDate,
    decimal? VoteAverage,
    IReadOnlyList<EpisodeSummaryResponse> Episodes,
    IReadOnlyList<MediaPersonResponse> Cast,
    IReadOnlyList<MediaCrewResponse> Crew,
    IReadOnlyList<MediaVideoResponse> Videos,
    IReadOnlyList<WatchProviderResponse> WatchProviders,
    IReadOnlyList<MediaImageResponse> Images,
    IReadOnlyList<MediaExternalLinkResponse> ExternalLinks,
    IReadOnlyList<MediaTranslationResponse> Translations);

public sealed record EpisodeSummaryResponse(
    int TmdbId,
    int EpisodeNumber,
    int SeasonNumber,
    string Name,
    string? Overview,
    string? StillUrl,
    DateOnly? AirDate,
    int? RuntimeMinutes,
    decimal? VoteAverage);

public sealed record EpisodeDetailsResponse(
    int TmdbId,
    int SeriesTmdbId,
    int SeasonNumber,
    int EpisodeNumber,
    string Name,
    string? Overview,
    string? StillUrl,
    DateOnly? AirDate,
    int? RuntimeMinutes,
    decimal? VoteAverage,
    IReadOnlyList<MediaPersonResponse> Cast,
    IReadOnlyList<MediaCrewResponse> Crew,
    IReadOnlyList<MediaVideoResponse> Videos,
    IReadOnlyList<MediaImageResponse> Images,
    IReadOnlyList<MediaExternalLinkResponse> ExternalLinks,
    IReadOnlyList<MediaTranslationResponse> Translations);

public sealed record PersonSummaryResponse(
    int TmdbId,
    string Name,
    string? KnownForDepartment,
    string? ProfileUrl,
    decimal? Popularity,
    IReadOnlyList<MediaSummaryResponse> KnownFor);

public sealed record PersonDetailsResponse(
    int TmdbId,
    string Name,
    string? Biography,
    DateOnly? Birthday,
    DateOnly? Deathday,
    string? PlaceOfBirth,
    string? KnownForDepartment,
    string? ProfileUrl,
    string? Homepage,
    string? ImdbId,
    IReadOnlyList<MediaSummaryResponse> CombinedCredits,
    IReadOnlyList<MediaSummaryResponse> MovieCredits,
    IReadOnlyList<MediaSummaryResponse> TvCredits,
    IReadOnlyList<PersonImageResponse> Images,
    IReadOnlyList<PersonTaggedImageResponse> TaggedImages,
    IReadOnlyList<MediaExternalLinkResponse> ExternalLinks,
    IReadOnlyList<MediaTranslationResponse> Translations);

public sealed record PersonImageResponse(
    string Url,
    int? Width,
    int? Height);

public sealed record PersonTaggedImageResponse(
    string Url,
    int? Width,
    int? Height,
    MediaSummaryResponse? Media);
