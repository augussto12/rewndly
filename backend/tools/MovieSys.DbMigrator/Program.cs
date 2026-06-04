using Microsoft.EntityFrameworkCore;
using MovieSys.Infrastructure.Persistence;

var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
    ?? Environment.GetEnvironmentVariable("MOVIESYS_CONNECTION_STRING");

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Connection string is required. Set ConnectionStrings__DefaultConnection or MOVIESYS_CONNECTION_STRING.");
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
