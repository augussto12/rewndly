using FluentValidation;

namespace Rewndly.Application.Modules.Social;

public sealed class FriendshipRequestCreateRequestValidator : AbstractValidator<FriendshipRequestCreateRequest>
{
    public FriendshipRequestCreateRequestValidator()
    {
        RuleFor(request => request.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(30);
    }
}
