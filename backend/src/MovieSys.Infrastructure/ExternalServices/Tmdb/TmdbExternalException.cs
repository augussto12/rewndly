namespace MovieSys.Infrastructure.ExternalServices.Tmdb;

public sealed class TmdbExternalException(string message, Exception? innerException = null)
    : Exception(message, innerException);
