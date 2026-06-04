FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY MovieSys.sln ./
COPY src/MovieSys.Domain/MovieSys.Domain.csproj src/MovieSys.Domain/
COPY src/MovieSys.Application/MovieSys.Application.csproj src/MovieSys.Application/
COPY src/MovieSys.Infrastructure/MovieSys.Infrastructure.csproj src/MovieSys.Infrastructure/
COPY src/MovieSys.Api/MovieSys.Api.csproj src/MovieSys.Api/
COPY tools/MovieSys.DbMigrator/MovieSys.DbMigrator.csproj tools/MovieSys.DbMigrator/
COPY tools/MovieSys.AdminSeeder/MovieSys.AdminSeeder.csproj tools/MovieSys.AdminSeeder/
RUN dotnet restore src/MovieSys.Api/MovieSys.Api.csproj
RUN dotnet restore tools/MovieSys.DbMigrator/MovieSys.DbMigrator.csproj
RUN dotnet restore tools/MovieSys.AdminSeeder/MovieSys.AdminSeeder.csproj

COPY . .
RUN dotnet publish src/MovieSys.Api/MovieSys.Api.csproj -c Release -o /app/publish --no-restore
RUN dotnet publish tools/MovieSys.DbMigrator/MovieSys.DbMigrator.csproj -c Release -o /app/tools/dbmigrator --no-restore
RUN dotnet publish tools/MovieSys.AdminSeeder/MovieSys.AdminSeeder.csproj -c Release -o /app/tools/adminseeder --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
COPY --from=build /app/tools /app/tools
EXPOSE 8080
ENTRYPOINT ["dotnet", "MovieSys.Api.dll"]
