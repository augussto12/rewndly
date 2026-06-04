using FluentValidation;

namespace Rewndly.Application.Modules.UserContent;

public sealed class LibraryItemRequestValidator : AbstractValidator<LibraryItemRequest>
{
    public LibraryItemRequestValidator()
    {
        RuleFor(request => request.MediaType)
            .NotEmpty()
            .Must(BeMediaType).WithMessage("MediaType must be Movie or Series.");

        RuleFor(request => request.TmdbId)
            .GreaterThan(0);

        RuleFor(request => request.Status)
            .NotEmpty()
            .Must(BeWatchStatus).WithMessage("Status must be WantToWatch, Watching, Watched or Dropped.");

        RuleFor(request => request.Rating)
            .InclusiveBetween(1, 10)
            .When(request => request.Rating.HasValue);

        RuleFor(request => request.WatchedAt)
            .LessThanOrEqualTo(DateTimeOffset.UtcNow.AddMinutes(5))
            .When(request => request.WatchedAt.HasValue);

        RuleFor(request => request.StartedAt)
            .LessThanOrEqualTo(DateTimeOffset.UtcNow.AddMinutes(5))
            .When(request => request.StartedAt.HasValue);
    }

    private static bool BeMediaType(string value)
    {
        return Enum.TryParse<Rewndly.Domain.Media.MediaType>(value, ignoreCase: true, out _);
    }

    private static bool BeWatchStatus(string value)
    {
        return Enum.TryParse<Rewndly.Domain.Library.WatchStatus>(value, ignoreCase: true, out _);
    }
}

public sealed class ReviewRequestValidator : AbstractValidator<ReviewRequest>
{
    public ReviewRequestValidator()
    {
        RuleFor(request => request.MediaType)
            .NotEmpty()
            .Must(BeMediaType).WithMessage("MediaType must be Movie or Series.");

        RuleFor(request => request.TmdbId)
            .GreaterThan(0);

        RuleFor(request => request.RatingSnapshot)
            .InclusiveBetween(1, 10)
            .When(request => request.RatingSnapshot.HasValue);

        RuleFor(request => request.Title)
            .NotEmpty()
            .MaximumLength(180);

        RuleFor(request => request.Body)
            .NotEmpty()
            .MaximumLength(8000);

        RuleFor(request => request.Visibility)
            .NotEmpty()
            .Must(BeReviewVisibility).WithMessage("Visibility must be Public, FriendsOnly or Private.");
    }

    private static bool BeMediaType(string value)
    {
        return Enum.TryParse<Rewndly.Domain.Media.MediaType>(value, ignoreCase: true, out _);
    }

    private static bool BeReviewVisibility(string value)
    {
        return Enum.TryParse<Rewndly.Domain.Reviews.ReviewVisibility>(value, ignoreCase: true, out _);
    }
}

public sealed class UserListRequestValidator : AbstractValidator<UserListRequest>
{
    public UserListRequestValidator()
    {
        RuleFor(request => request.Title)
            .NotEmpty()
            .MaximumLength(160);

        RuleFor(request => request.Description)
            .MaximumLength(1000);

        RuleFor(request => request.Visibility)
            .NotEmpty()
            .Must(BeListVisibility).WithMessage("Visibility must be Public, FriendsOnly or Private.");
    }

    private static bool BeListVisibility(string value)
    {
        return Enum.TryParse<Rewndly.Domain.Lists.ListVisibility>(value, ignoreCase: true, out _);
    }
}

public sealed class UserListItemRequestValidator : AbstractValidator<UserListItemRequest>
{
    public UserListItemRequestValidator()
    {
        RuleFor(request => request.MediaType)
            .NotEmpty()
            .Must(BeMediaType).WithMessage("MediaType must be Movie or Series.");

        RuleFor(request => request.TmdbId)
            .GreaterThan(0);

        RuleFor(request => request.Position)
            .GreaterThanOrEqualTo(0)
            .When(request => request.Position.HasValue);

        RuleFor(request => request.Note)
            .MaximumLength(1000);
    }

    private static bool BeMediaType(string value)
    {
        return Enum.TryParse<Rewndly.Domain.Media.MediaType>(value, ignoreCase: true, out _);
    }
}
