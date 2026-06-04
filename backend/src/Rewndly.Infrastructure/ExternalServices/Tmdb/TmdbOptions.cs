namespace Rewndly.Infrastructure.ExternalServices.Tmdb;

public sealed class TmdbOptions
{
    public const string SectionName = "Tmdb";

    public string ApiKey { get; set; } = string.Empty;

    public string AccessToken { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.themoviedb.org/3";

    public string ImageBaseUrl { get; set; } = "https://image.tmdb.org/t/p";

    public string PosterSize { get; set; } = "w500";

    public string BackdropSize { get; set; } = "w1280";

    public int TimeoutSeconds { get; set; } = 10;
}
