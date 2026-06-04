using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;
using Rewndly.Application.Common.Interfaces;

namespace Rewndly.Infrastructure.Authentication;

public sealed class RefreshTokenGenerator : IRefreshTokenGenerator
{
    public string GenerateToken()
    {
        return Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(64));
    }

    public string HashToken(string token)
    {
        var hash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
        return Base64UrlEncoder.Encode(hash);
    }
}
