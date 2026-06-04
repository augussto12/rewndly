using Rewndly.Domain.Users;

namespace Rewndly.Application.Common.Interfaces;

public interface IAccessTokenGenerator
{
    AccessTokenResult Generate(User user);
}

public sealed record AccessTokenResult(
    string AccessToken,
    DateTimeOffset ExpiresAt);
