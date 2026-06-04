namespace Rewndly.Api.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddRewndlySwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}
