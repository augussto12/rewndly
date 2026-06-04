namespace Rewndly.Domain.Events;

public enum ActivityEventType
{
    MovieViewed = 1,
    SeriesViewed = 2,
    MovieRated = 3,
    SeriesRated = 4,
    MovieAddedToWatchlist = 5,
    SeriesAddedToWatchlist = 6,
    MovieAddedToFavorites = 7,
    SeriesAddedToFavorites = 8,
    ReviewCreated = 9,
    ListCreated = 10,
    FriendRequestAccepted = 11,
    AddedToWatchlist = 12,
    MarkedAsWatched = 13,
    Rated = 14,
    Reviewed = 15,
    CreatedList = 16,
    AddedToList = 17,
    Favorited = 18,
    FriendRequestSent = 19,
    FriendAdded = 20,
    FriendRemoved = 21
}
