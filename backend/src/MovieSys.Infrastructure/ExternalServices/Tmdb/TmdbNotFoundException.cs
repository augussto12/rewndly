namespace MovieSys.Infrastructure.ExternalServices.Tmdb;

public sealed class TmdbNotFoundException(string message) : Exception(message);
