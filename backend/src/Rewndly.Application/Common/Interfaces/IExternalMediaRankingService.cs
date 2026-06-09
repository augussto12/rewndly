using Rewndly.Application.Modules.Public;
using Rewndly.Domain.Media;

namespace Rewndly.Application.Common.Interfaces;

public interface IExternalMediaRankingService
{
    Task<MediaRankingResponse> GetRankingAsync(
        MediaType mediaType,
        string rankingKey,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}
