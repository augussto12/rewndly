using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rewndly.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260608043000_ClearImdbRankingCacheForWeightedRanking")]
    public partial class ClearImdbRankingCacheForWeightedRanking : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("delete from external_media_ranking_items where ranking_key = 'imdb';");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
