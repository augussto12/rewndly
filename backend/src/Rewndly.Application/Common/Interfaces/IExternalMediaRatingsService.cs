using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;

namespace Rewndly.Application.Common.Interfaces;

public interface IExternalMediaRatingsService
{
    Task<ExternalRatingsResponse> GetRatingsAsync(MediaType mediaType, int tmdbId, CancellationToken cancellationToken);
}
