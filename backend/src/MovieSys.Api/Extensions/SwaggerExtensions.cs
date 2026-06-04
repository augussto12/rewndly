namespace MovieSys.Api.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddMovieSysSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}
