namespace Rewndly.Application.Modules.Auth;

public sealed record RegisterRequest(
    string Username,
    string Email,
    string Password,
    string? DisplayName);

public sealed record LoginRequest(
    string Identifier,
    string Password);

public sealed record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword,
    string ConfirmNewPassword);

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    AuthUserResponse User,
    bool MustChangePassword);

public sealed record MobileAuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    AuthUserResponse User,
    bool MustChangePassword);

public sealed record MobileRefreshRequest(string RefreshToken);

public sealed record MobileLogoutRequest(string? RefreshToken);

public sealed record AuthUserResponse(
    Guid Id,
    string Username,
    string Email,
    string DisplayName,
    string Role,
    bool MustChangePassword,
    DateTimeOffset? EmailVerifiedAt);

public sealed record EmailVerificationRequest(string Email);

public sealed record VerifyEmailRequest(string Token);

public sealed record ForgotPasswordRequest(string Email);

public sealed record ResetPasswordRequest(string Token, string NewPassword);
