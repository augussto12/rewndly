using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Rewndly.Domain.Events;
using Rewndly.Domain.Users;
using Rewndly.Infrastructure.Authentication;
using Rewndly.Infrastructure.Persistence;

var connectionString = GetRequiredEnvironment("ConnectionStrings__DefaultConnection");
var username = GetRequiredEnvironment("REWNDLY_ADMIN_USERNAME").Trim();
var email = GetRequiredEnvironment("REWNDLY_ADMIN_EMAIL").Trim().ToLowerInvariant();
var initialPassword = GetRequiredEnvironment("REWNDLY_ADMIN_INITIAL_PASSWORD");

if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(initialPassword))
{
    Console.Error.WriteLine("Admin username, email and initial password must not be empty.");
    return 1;
}

if (initialPassword.Equals("Admin123!", StringComparison.Ordinal))
{
    Console.Error.WriteLine("Refusing to use the development admin password in a controlled deploy.");
    return 1;
}

if (initialPassword.Length < 16)
{
    Console.Error.WriteLine("Admin initial password must be at least 16 characters.");
    return 1;
}

var options = new DbContextOptionsBuilder<AppDbContext>()
    .UseNpgsql(connectionString)
    .UseSnakeCaseNamingConvention()
    .Options;

await using var dbContext = new AppDbContext(options);

var normalizedUsername = username.ToLowerInvariant();
var existingUser = await dbContext.Users
    .IgnoreQueryFilters()
    .FirstOrDefaultAsync(user =>
        user.Username.ToLower() == normalizedUsername ||
        user.Email.ToLower() == email);

if (existingUser is not null)
{
    Console.WriteLine("Admin seed skipped. User already exists.");
    return 0;
}

var passwordHasher = new PasswordHasher();
var admin = new User
{
    Username = username,
    Email = email,
    DisplayName = username,
    PasswordHash = passwordHasher.HashPassword(initialPassword),
    Role = UserRole.Admin,
    MustChangePassword = true,
    IsDisabled = false,
    IsDeleted = false
};

dbContext.Users.Add(admin);
dbContext.UserPrivacySettings.Add(new UserPrivacySettings
{
    UserId = admin.Id,
    ProfileVisibility = ProfileVisibility.Private,
    ShowActivity = false,
    ShowStats = false
});

dbContext.SystemEvents.Add(new SystemEvent
{
    UserId = admin.Id,
    EventType = SystemEventType.UserRegistered,
    EntityType = "AdminBootstrap",
    EntityId = admin.Id,
    MetadataJson = JsonSerializer.Serialize(new
    {
        source = "Rewndly.AdminSeeder",
        role = UserRole.Admin.ToString(),
        mustChangePassword = true
    }),
    UserAgent = "Rewndly.AdminSeeder"
});

await dbContext.SaveChangesAsync();

Console.WriteLine("Admin user created with must_change_password=true.");
return 0;

static string GetRequiredEnvironment(string name)
{
    var value = Environment.GetEnvironmentVariable(name);
    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException($"Required environment variable '{name}' is not configured.");
    }

    return value;
}
