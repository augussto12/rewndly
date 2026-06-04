using Microsoft.EntityFrameworkCore;
using Rewndly.Api.Services;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Domain.Friends;
using Rewndly.Domain.Users;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.UnitTests.Security;

public sealed class SocialVisibilityServiceTests
{
    [Fact]
    public async Task CanViewProfile_AllowsAnonymous_ForPublicProfile()
    {
        await using var dbContext = CreateDbContext();
        var target = CreateUser(ProfileVisibility.Public);
        dbContext.Users.Add(target);
        await dbContext.SaveChangesAsync();

        var service = new SocialVisibilityService(dbContext, new TestCurrentUserService(null, null));

        Assert.True(await service.CanViewProfileAsync(target, CancellationToken.None));
    }

    [Fact]
    public async Task CanViewProfile_AllowsOnlyFriends_ForFriendsOnlyProfile()
    {
        await using var dbContext = CreateDbContext();
        var viewerId = Guid.NewGuid();
        var target = CreateUser(ProfileVisibility.FriendsOnly);
        dbContext.Users.Add(target);
        await dbContext.SaveChangesAsync();

        var service = new SocialVisibilityService(dbContext, new TestCurrentUserService(viewerId, "User"));

        Assert.False(await service.CanViewProfileAsync(target, CancellationToken.None));

        dbContext.Friendships.Add(new Friendship
        {
            RequesterId = viewerId,
            ReceiverId = target.Id,
            Status = FriendshipStatus.Accepted
        });
        await dbContext.SaveChangesAsync();

        Assert.True(await service.CanViewProfileAsync(target, CancellationToken.None));
    }

    [Fact]
    public async Task CanViewProfile_AllowsOwnerAndAdmin_ForPrivateProfile()
    {
        await using var dbContext = CreateDbContext();
        var target = CreateUser(ProfileVisibility.Private);
        dbContext.Users.Add(target);
        await dbContext.SaveChangesAsync();

        var ownerService = new SocialVisibilityService(dbContext, new TestCurrentUserService(target.Id, "User"));
        var adminService = new SocialVisibilityService(dbContext, new TestCurrentUserService(Guid.NewGuid(), "Admin"));
        var strangerService = new SocialVisibilityService(dbContext, new TestCurrentUserService(Guid.NewGuid(), "User"));

        Assert.True(await ownerService.CanViewProfileAsync(target, CancellationToken.None));
        Assert.True(await adminService.CanViewProfileAsync(target, CancellationToken.None));
        Assert.False(await strangerService.CanViewProfileAsync(target, CancellationToken.None));
    }

    private static AppDbContext CreateDbContext()
    {
        return new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
    }

    private static User CreateUser(ProfileVisibility visibility)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = Guid.NewGuid().ToString("N")[..12],
            Email = $"{Guid.NewGuid():N}@rewndly.local",
            DisplayName = "Test User",
            PasswordHash = "hash",
            PrivacySettings = new UserPrivacySettings
            {
                ProfileVisibility = visibility
            }
        };

        user.PrivacySettings.UserId = user.Id;
        return user;
    }

    private sealed class TestCurrentUserService(Guid? userId, string? role) : ICurrentUserService
    {
        public Guid? UserId => userId;

        public string? Username => userId?.ToString();

        public string? Role => role;

        public bool IsAuthenticated => userId.HasValue;
    }
}
