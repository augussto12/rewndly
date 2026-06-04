using MovieSys.Application.Common.Interfaces;

namespace MovieSys.Infrastructure.Authentication;

public sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
