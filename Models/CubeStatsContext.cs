using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Configuration;

#nullable disable

namespace Pauper_Tier_Cube.Models
{
    public partial class CubeStatsContext : DbContext
    {
        public CubeStatsContext(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        protected readonly IConfiguration _configuration;

        public virtual DbSet<Card> Cards { get; set; }
        public virtual DbSet<CardsInCube> CardsInCubes { get; set; }
        public virtual DbSet<CardsInDecksJoinTable> CardsInDecksJoinTables { get; set; }
        public virtual DbSet<Deck> Decks { get; set; }
        public virtual DbSet<DraftedCard> DraftedCards { get; set; }
        public virtual DbSet<ReverseDraftCardsReceived> ReverseDraftCardsReceiveds { get; set; }
        public virtual DbSet<UpdatesTable> UpdatesTables { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                string connectionString = _configuration.GetConnectionString("WebApiDatabase");
                optionsBuilder.UseSqlServer(connectionString);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("Relational:Collation", "SQL_Latin1_General_CP1_CI_AS");

            modelBuilder.Entity<Card>(entity =>
            {
                entity.HasNoKey();

                entity.Property(e => e.Cmc).HasColumnName("CMC");

                entity.Property(e => e.ColorIdentity)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("colorIdentity");

                entity.Property(e => e.CombinedTypes)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("combinedTypes");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("name");
            });

            modelBuilder.Entity<CardsInCube>(entity =>
            {
                entity.HasKey(e => new { e.Name, e.Tier })
                    .HasName("PK_CardsInCube_Name_tier");

                entity.ToTable("CardsInCube");

                entity.Property(e => e.Name)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("name");

                entity.Property(e => e.Tier)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("tier");

                entity.Property(e => e.Draftability)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("draftability");
            });

            modelBuilder.Entity<CardsInDecksJoinTable>(entity =>
            {
                entity.HasNoKey();

                entity.ToTable("CardsInDecksJoinTable");

                entity.Property(e => e.CopiesAvailable).HasColumnName("copiesAvailable");

                entity.Property(e => e.CopiesUsed).HasColumnName("copiesUsed");

                entity.Property(e => e.DeckId)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("deckID");

                entity.Property(e => e.Name)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("name");

                entity.HasOne(d => d.Deck)
                    .WithMany()
                    .HasForeignKey(d => d.DeckId)
                    .HasConstraintName("FK__CardsInDe__deckI__41EDCAC5");
            });

            modelBuilder.Entity<Deck>(entity =>
            {
                entity.Property(e => e.DeckId)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("deckID");

                entity.Property(e => e.ColorCount).HasColumnName("colorCount");

                entity.Property(e => e.Colors)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("colors");

                entity.Property(e => e.DatePlayed)
                    .HasColumnType("date")
                    .HasColumnName("datePlayed");

                entity.Property(e => e.DraftingFormat)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("draftingFormat");

                entity.Property(e => e.ForestCount).HasColumnName("forestCount");

                entity.Property(e => e.GamesLost).HasColumnName("gamesLost");

                entity.Property(e => e.GamesWon).HasColumnName("gamesWon");

                entity.Property(e => e.HallOfFame).HasColumnName("hallOfFame");

                entity.Property(e => e.IslandCount).HasColumnName("islandCount");

                entity.Property(e => e.LandsPerNonland)
                    .HasColumnType("decimal(4, 3)")
                    .HasColumnName("landsPerNonland");

                entity.Property(e => e.MountainCount).HasColumnName("mountainCount");

                entity.Property(e => e.PlainsCount).HasColumnName("plainsCount");

                entity.Property(e => e.PlayerName)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("playerName");

                entity.Property(e => e.Strat)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("strat");

                entity.Property(e => e.SwampCount).HasColumnName("swampCount");
            });

            modelBuilder.Entity<DraftedCard>(entity =>
            {
                entity.HasNoKey();

                entity.Property(e => e.Draftability)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("draftability");

                entity.Property(e => e.DraftsPicked).HasColumnName("draftsPicked");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("name");

                entity.Property(e => e.PlayerName)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("playerName");

                entity.Property(e => e.Tier)
                    .IsRequired()
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("tier");

                entity.HasOne(d => d.CardsInCube)
                    .WithMany()
                    .HasForeignKey(d => new { d.Name, d.Tier })
                    .HasConstraintName("FK_CardsInCube_Name_Tier");
            });

            modelBuilder.Entity<ReverseDraftCardsReceived>(entity =>
            {
                entity.HasNoKey();

                entity.ToTable("ReverseDraft_CardsReceived");

                entity.Property(e => e.CardCmc).HasColumnName("cardCMC");

                entity.Property(e => e.CardColorIdentity)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("cardColorIdentity");

                entity.Property(e => e.CardName)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("cardName");

                entity.Property(e => e.CardTier)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("cardTier");

                entity.Property(e => e.CardType1)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("cardType1");

                entity.Property(e => e.CardType2)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("cardType2");

                entity.Property(e => e.DraftabilityStatus)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("draftabilityStatus");

                entity.Property(e => e.DraftsPicked).HasColumnName("draftsPicked");

                entity.Property(e => e.PlayerName)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("playerName");
            });

            modelBuilder.Entity<UpdatesTable>(entity =>
            {
                entity.HasNoKey();

                entity.ToTable("UpdatesTable");

                entity.Property(e => e.EndDate)
                    .HasColumnType("date")
                    .HasColumnName("endDate");

                entity.Property(e => e.EndReason)
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("endReason");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("name");

                entity.Property(e => e.StartDate)
                    .HasColumnType("date")
                    .HasColumnName("startDate");

                entity.Property(e => e.Tier)
                    .IsRequired()
                    .HasMaxLength(40)
                    .IsUnicode(false)
                    .HasColumnName("tier");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
