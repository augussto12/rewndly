FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY Rewndly.sln ./
COPY src/Rewndly.Domain/Rewndly.Domain.csproj src/Rewndly.Domain/
COPY src/Rewndly.Application/Rewndly.Application.csproj src/Rewndly.Application/
COPY src/Rewndly.Infrastructure/Rewndly.Infrastructure.csproj src/Rewndly.Infrastructure/
COPY src/Rewndly.Api/Rewndly.Api.csproj src/Rewndly.Api/
COPY tools/Rewndly.DbMigrator/Rewndly.DbMigrator.csproj tools/Rewndly.DbMigrator/
COPY tools/Rewndly.AdminSeeder/Rewndly.AdminSeeder.csproj tools/Rewndly.AdminSeeder/
RUN dotnet restore src/Rewndly.Api/Rewndly.Api.csproj
RUN dotnet restore tools/Rewndly.DbMigrator/Rewndly.DbMigrator.csproj
RUN dotnet restore tools/Rewndly.AdminSeeder/Rewndly.AdminSeeder.csproj

COPY . .
RUN dotnet publish src/Rewndly.Api/Rewndly.Api.csproj -c Release -o /app/publish --no-restore
RUN dotnet publish tools/Rewndly.DbMigrator/Rewndly.DbMigrator.csproj -c Release -o /app/tools/dbmigrator --no-restore
RUN dotnet publish tools/Rewndly.AdminSeeder/Rewndly.AdminSeeder.csproj -c Release -o /app/tools/adminseeder --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
COPY --from=build /app/tools /app/tools
EXPOSE 8080
ENTRYPOINT ["dotnet", "Rewndly.Api.dll"]
