using Rewndly.Infrastructure.Authentication;

namespace Rewndly.UnitTests.Authentication;

public sealed class RefreshTokenGeneratorTests
{
    [Fact]
    public void GenerateToken_ReturnsUniqueOpaqueTokens()
    {
        var generator = new RefreshTokenGenerator();

        var first = generator.GenerateToken();
        var second = generator.GenerateToken();

        Assert.NotEqual(first, second);
        Assert.True(first.Length >= 80);
        Assert.True(second.Length >= 80);
    }

    [Fact]
    public void HashToken_IsStable_And_DoesNotExposeRawToken()
    {
        var generator = new RefreshTokenGenerator();
        var token = generator.GenerateToken();

        var firstHash = generator.HashToken(token);
        var secondHash = generator.HashToken(token);

        Assert.Equal(firstHash, secondHash);
        Assert.NotEqual(token, firstHash);
    }
}
