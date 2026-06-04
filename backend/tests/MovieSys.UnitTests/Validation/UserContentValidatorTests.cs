using MovieSys.Application.Modules.Social;
using MovieSys.Application.Modules.UserContent;

namespace MovieSys.UnitTests.Validation;

public sealed class UserContentValidatorTests
{
    [Theory]
    [InlineData("Bad", "Watched", 5, false)]
    [InlineData("Movie", "Invalid", 5, false)]
    [InlineData("Movie", "Watched", 0, false)]
    [InlineData("Series", "WantToWatch", 10, true)]
    public void LibraryItemValidator_EnforcesMediaStatusAndRating(string mediaType, string status, int rating, bool expectedValid)
    {
        var validator = new LibraryItemRequestValidator();
        var request = new LibraryItemRequest(mediaType, 123, status, false, rating, null, null);

        var result = validator.Validate(request);

        Assert.Equal(expectedValid, result.IsValid);
    }

    [Fact]
    public void ReviewValidator_RejectsInvalidVisibilityAndOversizedTitle()
    {
        var validator = new ReviewRequestValidator();
        var request = new ReviewRequest("Movie", 10, 8, new string('x', 181), "Body", false, "Everyone");

        var result = validator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Fact]
    public void ListValidator_RequiresTitleAndKnownVisibility()
    {
        var validator = new UserListRequestValidator();
        var request = new UserListRequest("", null, "World");

        var result = validator.Validate(request);

        Assert.False(result.IsValid);
    }

    [Theory]
    [InlineData("ab", false)]
    [InlineData("validuser", true)]
    public void FriendshipRequestValidator_ValidatesUsername(string username, bool expectedValid)
    {
        var validator = new FriendshipRequestCreateRequestValidator();

        var result = validator.Validate(new FriendshipRequestCreateRequest(username));

        Assert.Equal(expectedValid, result.IsValid);
    }
}
