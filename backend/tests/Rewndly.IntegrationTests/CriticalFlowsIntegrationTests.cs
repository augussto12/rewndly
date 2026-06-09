using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Npgsql;
using Xunit;

namespace Rewndly.IntegrationTests;

[CollectionDefinition(nameof(IntegrationTestCollection), DisableParallelization = true)]
public sealed class IntegrationTestCollection;

[Collection(nameof(IntegrationTestCollection))]
public sealed class CriticalFlowsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const int QaMovieTmdbId = 603;
    private readonly WebApplicationFactory<Program> _factory;

    public CriticalFlowsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Critical_flows_work_against_real_postgresql()
    {
        await EnsureQaMovieAsync();

        var stamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        using var userClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        using var friendClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        using var strangerClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        using var adminClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

        var user = await RegisterAsync(userClient, $"ituser{stamp}");
        var friend = await RegisterAsync(friendClient, $"itfriend{stamp}");
        var stranger = await RegisterAsync(strangerClient, $"itstranger{stamp}");

        SetBearer(userClient, user.AccessToken);
        SetBearer(friendClient, friend.AccessToken);
        SetBearer(strangerClient, stranger.AccessToken);

        var me = await userClient.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);

        var refresh = await userClient.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.OK, refresh.StatusCode);
        user = await ReadJsonAsync<AuthResponse>(refresh);
        SetBearer(userClient, user.AccessToken);

        using var anonymousClient = _factory.CreateClient();
        var anonymousPrivateEndpoint = await anonymousClient.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousPrivateEndpoint.StatusCode);

        var userAdminAttempt = await userClient.GetAsync("/api/admin/dashboard");
        Assert.Equal(HttpStatusCode.Forbidden, userAdminAttempt.StatusCode);

        var admin = await LoginAsync(adminClient, "Colucho", "Admin123!");
        SetBearer(adminClient, admin.AccessToken);

        var adminDashboard = await adminClient.GetAsync("/api/admin/dashboard");
        Assert.Equal(HttpStatusCode.OK, adminDashboard.StatusCode);

        var library = await userClient.PostAsJsonAsync("/api/me/library/items", new
        {
            mediaType = "Movie",
            tmdbId = QaMovieTmdbId,
            status = "WantToWatch",
            isFavorite = false,
            rating = (int?)null,
            watchedAt = (DateTimeOffset?)null,
            startedAt = (DateTimeOffset?)null
        });
        Assert.Equal(HttpStatusCode.Created, library.StatusCode);

        var review = await userClient.PostAsJsonAsync("/api/me/reviews", new
        {
            mediaType = "Movie",
            tmdbId = QaMovieTmdbId,
            ratingSnapshot = 9,
            title = "Integration review",
            body = "Integration review body.",
            containsSpoilers = false,
            visibility = "Public"
        });
        Assert.Equal(HttpStatusCode.Created, review.StatusCode);

        var list = await userClient.PostAsJsonAsync("/api/me/lists", new
        {
            title = "Integration list",
            description = "Integration list body.",
            visibility = "Public"
        });
        Assert.Equal(HttpStatusCode.Created, list.StatusCode);

        var friendRequest = await userClient.PostAsJsonAsync("/api/friends/requests", new { username = friend.User.Username });
        Assert.Equal(HttpStatusCode.Created, friendRequest.StatusCode);
        var friendRequestJson = await ReadJsonAsync<JsonElement>(friendRequest);
        var requestId = friendRequestJson.GetProperty("id").GetGuid();

        var accept = await friendClient.PostAsync($"/api/friends/requests/{requestId}/accept", null);
        Assert.Equal(HttpStatusCode.OK, accept.StatusCode);

        var publicProfile = await strangerClient.GetAsync($"/api/users/{user.User.Username}");
        Assert.Equal(HttpStatusCode.OK, publicProfile.StatusCode);

        await SetProfileVisibilityAsync(user.User.Username, "FriendsOnly");
        var friendsOnlyAsFriend = await friendClient.GetAsync($"/api/users/{user.User.Username}");
        Assert.Equal(HttpStatusCode.OK, friendsOnlyAsFriend.StatusCode);
        var friendsOnlyAsStranger = await strangerClient.GetAsync($"/api/users/{user.User.Username}");
        Assert.Equal(HttpStatusCode.Forbidden, friendsOnlyAsStranger.StatusCode);

        await SetProfileVisibilityAsync(user.User.Username, "Private");
        var privateAsOwner = await userClient.GetAsync($"/api/users/{user.User.Username}");
        Assert.Equal(HttpStatusCode.OK, privateAsOwner.StatusCode);
        var privateAsFriend = await friendClient.GetAsync($"/api/users/{user.User.Username}");
        Assert.Equal(HttpStatusCode.Forbidden, privateAsFriend.StatusCode);
    }

    [Fact]
    public async Task Refresh_token_reuse_is_rejected()
    {
        var stamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = $"itreuse{stamp}",
            email = $"itreuse{stamp}@rewndly.local",
            password = "User123!",
            displayName = "IT Reuse"
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var oldRefreshCookie = response.Headers.GetValues("Set-Cookie")
            .Single(header => header.StartsWith("rewndly_refresh_token=", StringComparison.Ordinal))
            .Split(';')[0];

        var rotation = await client.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.OK, rotation.StatusCode);

        using var reuseClient = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });
        reuseClient.DefaultRequestHeaders.Add("Cookie", oldRefreshCookie);
        var reuse = await reuseClient.PostAsync("/api/auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);
    }

    [Fact]
    public async Task Mobile_auth_uses_json_refresh_tokens_and_rejects_reuse()
    {
        var stamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var register = await client.PostAsJsonAsync("/api/mobile/auth/register", new
        {
            username = $"itmobile{stamp}",
            email = $"itmobile{stamp}@rewndly.local",
            password = "User123!",
            displayName = "IT Mobile"
        });

        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        Assert.False(register.Headers.TryGetValues("Set-Cookie", out _));
        var auth = await ReadJsonAsync<MobileAuthResponse>(register);
        Assert.False(string.IsNullOrWhiteSpace(auth.RefreshToken));

        SetBearer(client, auth.AccessToken);
        var me = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);

        var refresh = await client.PostAsJsonAsync("/api/mobile/auth/refresh", new { auth.RefreshToken });
        Assert.Equal(HttpStatusCode.OK, refresh.StatusCode);
        var rotated = await ReadJsonAsync<MobileAuthResponse>(refresh);
        Assert.False(string.IsNullOrWhiteSpace(rotated.RefreshToken));
        Assert.NotEqual(auth.RefreshToken, rotated.RefreshToken);

        var reuse = await client.PostAsJsonAsync("/api/mobile/auth/refresh", new { auth.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, reuse.StatusCode);
    }

    private static async Task<AuthResponse> RegisterAsync(HttpClient client, string username)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            email = $"{username}@rewndly.local",
            password = "User123!",
            displayName = username
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ReadJsonAsync<AuthResponse>(response);
    }

    private static async Task<AuthResponse> LoginAsync(HttpClient client, string identifier, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { identifier, password });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ReadJsonAsync<AuthResponse>(response);
    }

    private static void SetBearer(HttpClient client, string accessToken)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
    }

    private static async Task<T> ReadJsonAsync<T>(HttpResponseMessage response)
    {
        var value = await response.Content.ReadFromJsonAsync<T>();
        Assert.NotNull(value);
        return value;
    }

    private static async Task EnsureQaMovieAsync()
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand("""
            insert into movies (id, tmdb_id, title, original_title, overview, release_date, runtime_minutes, original_language, popularity, vote_average, created_at, updated_at)
            values ('11111111-1111-4111-8111-111111111111', 603, 'The Matrix', 'The Matrix', 'QA local movie', '1999-03-31', 136, 'en', 0, 8.7, now(), now())
            on conflict (tmdb_id) do nothing;
            """, connection);

        await command.ExecuteNonQueryAsync();
    }

    private static async Task SetProfileVisibilityAsync(string username, string visibility)
    {
        await using var connection = new NpgsqlConnection(GetConnectionString());
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand("""
            update user_privacy_settings
            set profile_visibility = @visibility
            where user_id = (select id from users where username = @username);
            """, connection);

        command.Parameters.AddWithValue("visibility", visibility);
        command.Parameters.AddWithValue("username", username);
        await command.ExecuteNonQueryAsync();
    }

    private static string GetConnectionString()
    {
        return Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("REWNDLY_CONNECTION_STRING")
            ?? throw new InvalidOperationException("Integration tests require ConnectionStrings__DefaultConnection or REWNDLY_CONNECTION_STRING.");
    }

    private sealed record AuthResponse(string AccessToken, AuthUserResponse User);

    private sealed record MobileAuthResponse(string AccessToken, string RefreshToken, AuthUserResponse User);

    private sealed record AuthUserResponse(Guid Id, string Username, string Role, bool MustChangePassword);
}
