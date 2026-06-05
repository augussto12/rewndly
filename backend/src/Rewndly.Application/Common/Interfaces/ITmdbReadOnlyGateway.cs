using System.Text.Json;

namespace Rewndly.Application.Common.Interfaces;

public interface ITmdbReadOnlyGateway
{
    IReadOnlyList<TmdbEndpointInfo> GetPublicReadOnlyEndpoints();

    Task<JsonElement> GetPublicReadOnlyAsync(string path, string queryString, CancellationToken cancellationToken);
}

public sealed record TmdbEndpointInfo(
    string OperationId,
    string Path,
    string Summary);
