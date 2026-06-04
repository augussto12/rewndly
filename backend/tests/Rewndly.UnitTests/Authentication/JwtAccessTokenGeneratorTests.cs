using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Domain.Users;
using Rewndly.Infrastructure.Authentication;

namespace Rewndly.UnitTests.Authentication;

public sealed class JwtAccessTokenGeneratorTests
{
    [Fact]
    public void Generate_IncludesIdentityRoleAndShortExpiry()
    {
        var now = new DateTimeOffset(2026, 6, 4, 12, 0, 0, TimeSpan.Zero);
        var generator = new JwtAccessTokenGenerator(
            Options.Create(new JwtOptions
            {
                Issuer = "Rewndly",
                Audience = "Rewndly.Web",
                Secret = "development-only-test-secret-32-chars-minimum",
                AccessTokenMinutes = 15
            }),
            new FixedDateTimeProvider(now));

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "Colucho",
            Email = "colucho@rewndly.local",
            Role = UserRole.Admin
        };

        var result = generator.Generate(user);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.AccessToken);

        Assert.Equal(now.AddMinutes(15), result.ExpiresAt);
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.NameIdentifier && claim.Value == user.Id.ToString());
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.Role && claim.Value == "Admin");
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.Email && claim.Value == user.Email);
    }

    private sealed class FixedDateTimeProvider(DateTimeOffset utcNow) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow => utcNow;
    }
}
