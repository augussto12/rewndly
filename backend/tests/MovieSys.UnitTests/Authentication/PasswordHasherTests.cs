using MovieSys.Infrastructure.Authentication;

namespace MovieSys.UnitTests.Authentication;

public sealed class PasswordHasherTests
{
    [Fact]
    public void HashPassword_DoesNotStoreRawPassword_And_Verifies()
    {
        var hasher = new PasswordHasher();

        var hash = hasher.HashPassword("Admin123!");

        Assert.DoesNotContain("Admin123!", hash);
        Assert.True(hasher.VerifyPassword("Admin123!", hash));
        Assert.False(hasher.VerifyPassword("Wrong123!", hash));
    }

    [Fact]
    public void VerifyPassword_ReturnsFalse_ForInvalidHashFormat()
    {
        var hasher = new PasswordHasher();

        Assert.False(hasher.VerifyPassword("Admin123!", "not-a-valid-hash"));
    }
}
