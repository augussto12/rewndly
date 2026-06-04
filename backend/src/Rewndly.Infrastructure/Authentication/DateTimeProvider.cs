using Rewndly.Application.Common.Interfaces;

namespace Rewndly.Infrastructure.Authentication;

public sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
