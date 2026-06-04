using Microsoft.EntityFrameworkCore;
using Rewndly.Infrastructure.Persistence;

var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";
var migrationConnectionString = Environment.GetEnvironmentVariable("MigrationConnectionStrings__DefaultConnection");
var runtimeConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? Environment.GetEnvironmentVariable("REWNDLY_CONNECTION_STRING");

var connectionString = migrationConnectionString;

if (string.IsNullOrWhiteSpace(connectionString))
{
    if (environment.Equals("Production", StringComparison.OrdinalIgnoreCase))
    {
        Console.Error.WriteLine("Migration connection string is required in Production. Set MigrationConnectionStrings__DefaultConnection.");
        return 1;
    }

    connectionString = runtimeConnectionString;
    Console.WriteLine("MigrationConnectionStrings__DefaultConnection is not configured. Falling back to runtime connection string for non-Production migration.");
}

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Connection string is required. Set MigrationConnectionStrings__DefaultConnection, ConnectionStrings__DefaultConnection or REWNDLY_CONNECTION_STRING.");
    return 1;
}

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention()
    .Options;

await using var dbContext = new AppDbContext(options);
await dbContext.Database.MigrateAsync();

var appliedMigrations = await dbContext.Database.GetAppliedMigrationsAsync();

Console.WriteLine("Database migrations applied.");
foreach (var migration in appliedMigrations)
{
    Console.WriteLine(migration);
}

return 0;
