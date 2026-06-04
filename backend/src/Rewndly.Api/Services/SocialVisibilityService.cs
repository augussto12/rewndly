using Microsoft.EntityFrameworkCore;
using Rewndly.Application.Common.Interfaces;
using Rewndly.Domain.Friends;
using Rewndly.Domain.Lists;
using Rewndly.Domain.Reviews;
using Rewndly.Domain.Users;
using Rewndly.Infrastructure.Persistence;

namespace Rewndly.Api.Services;

public sealed class SocialVisibilityService(AppDbContext dbContext, ICurrentUserService currentUser)
{
    public async Task<bool> AreFriendsAsync(Guid userA, Guid userB, CancellationToken cancellationToken)
    {
        return await dbContext.Friendships.AnyAsync(friendship =>
            friendship.Status == FriendshipStatus.Accepted &&
            ((friendship.RequesterId == userA && friendship.ReceiverId == userB) ||
             (friendship.RequesterId == userB && friendship.ReceiverId == userA)),
            cancellationToken);
    }

    public async Task<bool> CanViewProfileAsync(User targetUser, CancellationToken cancellationToken)
    {
        if (currentUser.UserId == targetUser.Id || currentUser.Role == "Admin")
        {
            return true;
        }

        var visibility = targetUser.PrivacySettings?.ProfileVisibility ?? ProfileVisibility.Public;
        return visibility switch
        {
            ProfileVisibility.Public => true,
            ProfileVisibility.FriendsOnly => currentUser.UserId.HasValue &&
                await AreFriendsAsync(currentUser.UserId.Value, targetUser.Id, cancellationToken),
            ProfileVisibility.Private => false,
            _ => false
        };
    }

    public async Task<bool> CanViewReviewAsync(Review review, CancellationToken cancellationToken)
    {
        if (currentUser.UserId == review.UserId || currentUser.Role == "Admin")
        {
            return true;
        }

        return review.Visibility switch
        {
            ReviewVisibility.Public => true,
            ReviewVisibility.FriendsOnly => currentUser.UserId.HasValue &&
                await AreFriendsAsync(currentUser.UserId.Value, review.UserId, cancellationToken),
            ReviewVisibility.Private => false,
            _ => false
        };
    }

    public async Task<bool> CanViewListAsync(Rewndly.Domain.Lists.List list, CancellationToken cancellationToken)
    {
        if (currentUser.UserId == list.UserId || currentUser.Role == "Admin")
        {
            return true;
        }

        return list.Visibility switch
        {
            ListVisibility.Public => true,
            ListVisibility.FriendsOnly => currentUser.UserId.HasValue &&
                await AreFriendsAsync(currentUser.UserId.Value, list.UserId, cancellationToken),
            ListVisibility.Private => false,
            _ => false
        };
    }
}
