using MovieSys.Api.Extensions;
using MovieSys.Api.Endpoints;
using MovieSys.Api.Middlewares;
using MovieSys.Api.Services;
using MovieSys.Application;
using MovieSys.Application.Common.Interfaces;
using MovieSys.Infrastructure;
using Microsoft.AspNetCore.HttpOverrides;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .WriteTo.Console();
});

builder.Services.AddProblemDetails();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddMovieSysCors(builder.Configuration);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<SocialVisibilityService>();
builder.Services.AddMovieSysAuth(builder.Configuration);
builder.Services.AddMovieSysSwagger();
builder.Services.AddMovieSysRateLimiting();
builder.Services.AddMovieSysHealthChecks(builder.Configuration);

var app = builder.Build();

var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedHeadersOptions.KnownNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(CorsPolicies.Frontend);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapAuthEndpoints();
app.MapPublicMediaEndpoints();
app.MapUserContentEndpoints();
app.MapSocialEndpoints();
app.MapAdminEndpoints();

app.MapGet("/api/system/status", (IHostEnvironment environment) =>
    Results.Ok(new
    {
        name = "MovieSys API",
        status = "ok",
        environment = environment.EnvironmentName,
        utc = DateTimeOffset.UtcNow
    }))
    .WithName("GetSystemStatus")
    .AllowAnonymous();

app.Run();

public partial class Program;
