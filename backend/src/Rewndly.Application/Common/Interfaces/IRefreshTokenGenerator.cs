namespace Rewndly.Application.Common.Interfaces;

public interface IRefreshTokenGenerator
{
    string GenerateToken();

    string HashToken(string token);
}
