using Rewndly.Application.Modules.Auth;

namespace Rewndly.UnitTests.Authentication;

public sealed class ChangePasswordValidatorTests
{
    [Fact]
    public void ChangePasswordValidator_AcceptsStrongMatchingPassword()
    {
        var validator = new ChangePasswordRequestValidator();
        var request = new ChangePasswordRequest("Old123!", "New123!@", "New123!@");

        var result = validator.Validate(request);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ChangePasswordValidator_RejectsMismatchedConfirmation()
    {
        var validator = new ChangePasswordRequestValidator();
        var request = new ChangePasswordRequest("Old123!", "New123!@", "Different123!");

        var result = validator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData("short")]
    [InlineData("lowercase123!")]
    [InlineData("UPPERCASE123!")]
    [InlineData("NoNumber!")]
    [InlineData("NoSymbol123")]
    public void ChangePasswordValidator_RejectsWeakPassword(string newPassword)
    {
        var validator = new ChangePasswordRequestValidator();
        var request = new ChangePasswordRequest("Old123!", newPassword, newPassword);

        var result = validator.Validate(request);

        Assert.False(result.IsValid);
    }
}
