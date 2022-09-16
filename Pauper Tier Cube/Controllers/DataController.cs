using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Pauper_Tier_Cube.Models;
using System.Diagnostics;
using System.Linq.Expressions;
using System.IO;
using System.Text;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Reflection;
using System.Reflection.Metadata;
using Microsoft.EntityFrameworkCore;

namespace Pauper_Tier_Cube.Controllers;
public class DataController : Controller
{
    private readonly CubeStatsContext _cubeStatsContext;
    private readonly ILogger<DataController> _logger;

    public DataController(CubeStatsContext cubeStatsContext, IConfiguration configuration, ILogger<DataController> logger)
    {
        _cubeStatsContext = cubeStatsContext;
        _logger = logger;
        _configuration = configuration;
    }

    private IConfiguration _configuration;

    [HttpGet]
    public async Task<IActionResult> CardData(
        [FromQuery] string nameFilter,
        [FromQuery] string colorIdentityFilter,
        [FromQuery] string minManaValueFilter,
        [FromQuery] string maxManaValueFilter,
        [FromQuery] string typeFilter,
        [FromQuery] string tierFilter,
        [FromQuery] string draftabilityFilter,
        [FromQuery] string minGamesPlayedFilter,
        [FromQuery] string maxGamesPlayedFilter,
        [FromQuery] string minWinRateFilter,
        [FromQuery] string maxWinRateFilter,
        [FromQuery] string primarySort,
        [FromQuery] string secondarySort)
    {
        try
        {
            // For developmental use: only set to "true" to update the Cards table in SQL
            // To make sure there are is a Cards row corresponding to every CardsInCube row
            bool updateCardsTable = false;
            if (updateCardsTable)
            {
                // Initialize list of card names in Cards table
                var cardNames = new List<string>();
                foreach (Card card in _cubeStatsContext.Cards)
                {
                    cardNames.Add(card.Name);
                }

                // Check if the list contains a name for each CardsInCube row
                SqlConnection connection = new SqlConnection(_configuration.GetConnectionString("WebApiDatabase"));
                connection.Open();
                foreach (CardsInCube cardInCube in _cubeStatsContext.CardsInCubes)
                {
                    if (!cardNames.Contains(cardInCube.Name))
                    {
                        // No corresponding Cards name for this CardsInCube row. Let's create one
                        if (cardInCube.Name == "Knight\'s Pledge")
                        {
                            string x = "Stop!";
                        }
                        Card card = CreateCardObject(cardInCube.Name);

                        // Insert new Cards row into Cards table in db
                        try
                        {
                            SqlTransaction transaction = connection.BeginTransaction();
                            _cubeStatsContext.Add(card);
                            transaction.Commit();
                        }
                        catch (Exception ex) { }
                    }
                }
                _cubeStatsContext.SaveChanges();
            }

            // Initialize base filters
            string nameValue = "";
            if (!string.IsNullOrEmpty(nameFilter)) nameValue = nameFilter;
            string[] colorIdentityValues = { "W", "U", "B", "R", "G", "multiple", "colorless" };
            if (!string.IsNullOrEmpty(colorIdentityFilter)) colorIdentityValues = colorIdentityFilter.Split(',');
            int minManaValue = 0;
            if (int.TryParse(minManaValueFilter, out int minMVRes)) minManaValue = minMVRes;
            int maxManaValue = 100;
            if (int.TryParse(maxManaValueFilter, out int maxMVRes)) maxManaValue = maxMVRes;
            string[] typeValues = { "artifact", "creature", "enchantment", "instant", "land", "sorcery", "artifact creature", "artifact land", "enchantment creature", "instant creature", "sorcery creature" };
            if (!string.IsNullOrEmpty(typeFilter)) typeValues = typeFilter.Split(',');
            string[] tierValues = { "bronze", "silver", "gold" };
            if (!string.IsNullOrEmpty(tierFilter)) tierValues = tierFilter.Split(',');
            string[] draftabilityValues = { "draftable", "changed", "not draftable" };
            if (!string.IsNullOrEmpty(draftabilityFilter)) draftabilityValues = draftabilityFilter.Split(',');

            // Apply base filters
            IQueryable<FullCard> cardsResultByBaseStats = from fullCard in _cubeStatsContext.FullCards
                                                          where fullCard.Name.Contains(nameValue)
                                                          && colorIdentityValues.Contains(fullCard.ColorIdentity)
                                                          && fullCard.Cmc >= minManaValue && fullCard.Cmc <= maxManaValue
                                                          && typeValues.Contains(fullCard.CombinedTypes)
                                                          && tierValues.Contains(fullCard.Tier)
                                                          && draftabilityValues.Contains(fullCard.Draftability)
                                                          select (fullCard);

            // Initialize statistics filters
            int minGames = 0;
            if (int.TryParse(minGamesPlayedFilter, out int minGamesRes)) minGames = minGamesRes;
            int maxGames = 99999;
            if (int.TryParse(maxGamesPlayedFilter, out int maxGamesRes)) maxGames = maxGamesRes;
            double minWinRate = 0;
            if (double.TryParse(minWinRateFilter, out double minWinRateRes)) minWinRate = minWinRateRes;
            double maxWinRate = 100;
            if (double.TryParse(maxWinRateFilter, out double maxWinRateRes)) maxWinRate = maxWinRateRes;

            // Apply statistics filters
            List<FullCard> cardsResultFull = new List<FullCard>();
            // Cards played 0 times may have a NULL value for GamesPlayed
            // Automatically, the card will have a NULL value for WinRatePercentage
            // We want to add these cards to our final result if minGames = 0
            if (minGames == 0)
            {
                foreach (FullCard fullCard in cardsResultByBaseStats)
                {
                    if (fullCard.GamesPlayed is null)
                    {
                        // Card GamesPlayed val is NULL
                        // WinRatePercentage is ignored. Otherwise, this card can't be displayed
                        // This card is valid for being played in at least 0 games
                        cardsResultFull.Add(fullCard);
                    }
                    if (fullCard.GamesPlayed >= minGames)
                    {
                        if (fullCard.GamesPlayed <= maxGames)
                        {
                            // Card has been played nonzero times
                            // This card falls within the games-played range
                            // Though WinRatePercentage is not NULL, it is ignored. This is consistent with cards with NULL WinRatePercentages
                            cardsResultFull.Add(fullCard);
                        }
                    }
                }
            }
            else
            {
                // Filter cards that have been played at least once
                // Cards have non-NULL WinRatePercentage
                foreach (FullCard fullCard in cardsResultByBaseStats)
                {
                    // Check if card falls under games-played range
                    if (fullCard.GamesPlayed >= minGames)
                    {
                        if (fullCard.GamesPlayed <= maxGames)
                        {
                            // Card falls under games-played range
                            // Check if card falls under WinRatePercentage range
                            if (fullCard.WinRatePercentage >= minWinRate)
                            {
                                if (fullCard.WinRatePercentage <= maxWinRate)
                                {
                                    // Card falls under both games-played and WinRatePercentage ranges
                                    // Card is valid
                                    cardsResultFull.Add(fullCard);
                                }
                            }
                        }
                    }
                }
            }

            // Initialize sorts
            PropertyInfo primarySortProperty = typeof(FullCard).GetProperty(primarySort);
            PropertyInfo secondarySortProperty = typeof(FullCard).GetProperty(secondarySort);

            // Handle sorting
            if (primarySort.Equals(nameof(FullCard.ColorIdentity)))
            {
                // For primary sort: Apply custom values for color identity sort: order is W, U, B, R, G, Multiple, Colorless
                if (secondarySort.Equals(nameof(FullCard.GamesPlayed)) || secondarySort.Equals(nameof(FullCard.WinRatePercentage)))
                {
                    // For secondary sort: Apply descending ordering for games played or win rate
                    cardsResultFull = cardsResultFull.OrderBy(fullCard => ApplyColorIdentityValue(fullCard.ColorIdentity))
                        .ThenByDescending(fullCard => secondarySortProperty?.GetValue(fullCard)).ToList();
                }
                else
                {
                    // For secondary sort: Apply regular ordering
                    cardsResultFull = cardsResultFull.OrderBy(fullCard => ApplyColorIdentityValue(fullCard.ColorIdentity))
                        .ThenBy(fullCard => secondarySortProperty?.GetValue(fullCard)?.ToString()).ToList();
                }
            }
            else if (primarySort.Equals(nameof(FullCard.GamesPlayed)) || primarySort.Equals(nameof(FullCard.WinRatePercentage)))
            {
                // For primary sort: Apply descending ordering for games played or win rate
                if (secondarySort.Equals(nameof(FullCard.GamesPlayed)) || secondarySort.Equals(nameof(FullCard.WinRatePercentage)))
                {
                    // For secondary sort: Apply descending ordering for games played or win rate
                    cardsResultFull = cardsResultFull.OrderByDescending(fullCard => primarySortProperty?.GetValue(fullCard))
                        .ThenByDescending(fullCard => secondarySortProperty?.GetValue(fullCard)).ToList();
                }
                else if (secondarySort.Equals(nameof(FullCard.ColorIdentity)))
                {
                    // For secondary sort: Apply custom values for color identity sort: order is W, U, B, R, G, Multiple, Colorless
                    cardsResultFull = cardsResultFull.OrderByDescending(fullCard => primarySortProperty?.GetValue(fullCard))
                        .ThenBy(fullCard => ApplyColorIdentityValue(fullCard.ColorIdentity)).ToList();
                }
                else
                {
                    // For secondary sort: Apply regular ordering
                    cardsResultFull = cardsResultFull.OrderByDescending(fullCard => primarySortProperty?.GetValue(fullCard))
                        .ThenBy(fullCard => secondarySortProperty?.GetValue(fullCard)?.ToString()).ToList();
                }
            }
            else
            {
                // For primary sort: Apply regular ordering
                if (secondarySort.Equals(nameof(FullCard.GamesPlayed)) || secondarySort.Equals(nameof(FullCard.WinRatePercentage)))
                {
                    // For secondary sort: Apply descending ordering for games played or win rate
                    cardsResultFull = cardsResultFull.OrderBy(fullCard => primarySortProperty?.GetValue(fullCard)?.ToString())
                        .ThenByDescending(fullCard => secondarySortProperty?.GetValue(fullCard)).ToList();
                }
                else if (secondarySort.Equals(nameof(FullCard.ColorIdentity)))
                {
                    // For secondary sort: Apply custom values for color identity sort: order is W, U, B, R, G, Multiple, Colorless
                    cardsResultFull = cardsResultFull.OrderBy(fullCard => primarySortProperty?.GetValue(fullCard)?.ToString())
                        .ThenBy(fullCard => ApplyColorIdentityValue(fullCard.ColorIdentity)).ToList();
                }
                else
                {
                    // For secondary sort: Apply regular ordering
                    cardsResultFull = cardsResultFull.OrderBy(fullCard => primarySortProperty?.GetValue(fullCard)?.ToString())
                        .ThenBy(fullCard => secondarySortProperty?.GetValue(fullCard)?.ToString()).ToList();
                }
            }

            // Give each card an associated image
            foreach (var fullCard in cardsResultFull)
            {
                fullCard.Image = await LoadImageDataFromFile(fullCard.Name);
            }

            return Ok(cardsResultFull.ToArray());
        }
        catch (Exception ex)
        {
            return BadRequest(ex);
        }
    }

    // When sorting by color identity, apply this custom sort
    public static string ApplyColorIdentityValue(string colorIdentity)
    {
        if (colorIdentity.Equals("W")) return "0";
        else if (colorIdentity.Equals("U")) return "1";
        else if (colorIdentity.Equals("B")) return "2";
        else if (colorIdentity.Equals("R")) return "3";
        else if (colorIdentity.Equals("G")) return "4";
        else if (colorIdentity.Equals("Multiple")) return "5";
        else return "6";
    }

    // Method to create card object to insert into Cards table (sql)
    // References Scryfall API for data
    public static Card CreateCardObject(string cardName)
    {
        string[] cardInfo = ScryfallAPIController.GetCardDataFromSkryfallAPI(cardName).Result;
        Card card = new Card();
        card.Name = cardName;
        card.ColorIdentity = cardInfo[0];
        card.Cmc = Int16.Parse(cardInfo[1]);
        card.CombinedTypes = cardInfo[2];
        return card;
    }

    [HttpGet]
    public async Task<IActionResult> DeckData(
    [FromQuery] string deckIDFilter,
    [FromQuery] string playerNameFilter,
    [FromQuery] string stratFilter,
    [FromQuery] string colorFilter,
    [FromQuery] string dateFilter,
    [FromQuery] string minWinsFilter,
    [FromQuery] string maxWinsFilter,
    [FromQuery] string minLossesFilter,
    [FromQuery] string maxLossesFilter,
    [FromQuery] string minAverageManaValueFilter,
    [FromQuery] string maxAverageManaValueFilter,
    [FromQuery] string minLandsFilter,
    [FromQuery] string maxLandsFilter,
    [FromQuery] string minNonlandsFilter,
    [FromQuery] string maxNonlandsFilter,
    [FromQuery] string primarySort,
    [FromQuery] string secondarySort)
    {
        try
        {
            // Initialize filters
            string deckIDValue = "";
            if (!string.IsNullOrEmpty(deckIDFilter)) deckIDValue = deckIDFilter;
            string playerNameValue = "";
            if (!string.IsNullOrEmpty(playerNameFilter)) playerNameValue = playerNameFilter;
            string stratValue = "";
            if (!string.IsNullOrEmpty(stratFilter)) stratValue = stratFilter;
            string colorValue = "";
            if (!string.IsNullOrEmpty(colorFilter)) colorValue = string.Join("", colorFilter.Split(","));
            string dateValue = "";
            if (!string.IsNullOrEmpty(dateFilter)) dateValue = dateFilter;
            int minWinsValue = 0;
            if (int.TryParse(minWinsFilter, out int minWinsRes)) minWinsValue = minWinsRes;
            int maxWinsValue = 99;
            if (int.TryParse(maxWinsFilter, out int maxWinsRes)) maxWinsValue = maxWinsRes;
            int minLossesValue = 0;
            if (int.TryParse(minLossesFilter, out int minLossesRes)) minLossesValue = minLossesRes;
            int maxLossesValue = 99;
            if (int.TryParse(maxLossesFilter, out int maxLossesRes)) maxLossesValue = maxLossesRes;
            int minAverageManaValueValue = 0;
            if (int.TryParse(minAverageManaValueFilter, out int minAverageManaValueRes)) minAverageManaValueValue = minAverageManaValueRes;
            int maxAverageManaValueValue = 10;
            if (int.TryParse(maxAverageManaValueFilter, out int maxAverageManaValueRes)) maxAverageManaValueValue = maxAverageManaValueRes;
            int minLandsValue = 0;
            if (int.TryParse(minLandsFilter, out int minLandsRes)) minLandsValue = minLandsRes;
            int maxLandsValue = 99;
            if (int.TryParse(maxLandsFilter, out int maxLandsRes)) maxLandsValue = maxLandsRes;
            int minNonlandsValue = 0;
            if (int.TryParse(minNonlandsFilter, out int minNonlandsRes)) minNonlandsValue = minNonlandsRes;
            int maxNonlandsValue = 99;
            if (int.TryParse(maxNonlandsFilter, out int maxNonlandsRes)) maxNonlandsValue = maxNonlandsRes;

            // Apply different filters depending on whether colors are specified
            IQueryable<Deck> decksResult;
            if (colorValue == "")
            {
                decksResult = from deck in _cubeStatsContext.Decks
                              where deck.DeckId.Contains(deckIDValue)
                              && deck.PlayerName.Contains(playerNameValue)
                              && deck.Strat.Contains(stratValue)
                              //&& deck.DatePlayed.Equals(dateValue)
                              && deck.GamesWon >= minWinsValue && deck.GamesWon <= maxWinsValue
                              && deck.GamesLost >= minLossesValue && deck.GamesLost <= maxLossesValue
                              //&& deck.AverageManaValue >= minAverageManaValueValue && deck.AverageManaValue <= maxAverageManaValueValue
                              && deck.LandCount >= minLandsValue && deck.GamesWon <= maxLandsValue
                              && deck.NonlandCount >= minNonlandsValue && deck.GamesWon <= maxNonlandsValue
                              select (deck);
            }
            else
            {
                decksResult = from deck in _cubeStatsContext.Decks
                              where deck.DeckId.Contains(deckIDValue)
                              && deck.PlayerName.Contains(playerNameValue)
                              && deck.Strat.Contains(stratValue)
                              && deck.Colors.Equals(colorValue)
                              //&& deck.DatePlayed.Equals(dateValue)
                              && deck.GamesWon >= minWinsValue && deck.GamesWon <= maxWinsValue
                              && deck.GamesLost >= minLossesValue && deck.GamesLost <= maxLossesValue
                              //&& deck.AverageManaValue >= minAverageManaValueValue && deck.AverageManaValue <= maxAverageManaValueValue
                              && deck.LandCount >= minLandsValue && deck.GamesWon <= maxLandsValue
                              && deck.NonlandCount >= minNonlandsValue && deck.GamesWon <= maxNonlandsValue
                              select (deck);
            }

            List<Deck> decksResultList = decksResult.ToList();

            //// Initialize sorts
            //PropertyInfo primarySortProperty = typeof(Deck).GetProperty(primarySort);
            //PropertyInfo secondarySortProperty = typeof(Deck).GetProperty(secondarySort);

            //// Handle sorting            
            //if (primarySort.Equals(nameof(Deck.PlayerName)) || primarySort.Equals(nameof(Deck.Strat)))
            //{
            //    // For primary sort: Apply ascending ordering for playerName or strat
            //    if (secondarySort.Equals(nameof(Deck.PlayerName)) || secondarySort.Equals(nameof(Deck.Strat)))
            //    {
            //        // For secondary sort: Apply ascending ordering for playerName or strat
            //        decksResultList = decksResultList.OrderBy(deck => primarySortProperty?.GetValue(deck))
            //            .ThenBy(deck => secondarySortProperty?.GetValue(deck)).ToList();
            //    }
            //    else
            //    {
            //        // For secondary sort: Apply descending ordering for numeric values
            //        decksResultList = decksResultList.OrderBy(deck => primarySortProperty?.GetValue(deck))
            //            .ThenByDescending(deck => secondarySortProperty?.GetValue(deck)?.ToString()).ToList();
            //    }
            //}
            //else
            //{
            //    // For primary sort: Apply descending ordering for numeric values
            //    if (secondarySort.Equals(nameof(Deck.PlayerName)) || secondarySort.Equals(nameof(Deck.Strat)))
            //    {
            //        // For secondary sort: Apply ascending ordering for playerName or strat
            //        decksResultList = decksResultList.OrderByDescending(deck => primarySortProperty?.GetValue(deck)?.ToString())
            //            .ThenBy(deck => secondarySortProperty?.GetValue(deck)).ToList();
            //    }
            //    else
            //    {
            //        // For secondary sort: Apply descending ordering for numeric values
            //        decksResultList = decksResultList.OrderBy(deck => primarySortProperty?.GetValue(deck)?.ToString())
            //            .ThenBy(deck => secondarySortProperty?.GetValue(deck)?.ToString()).ToList();
            //    }
            //}

            return Ok(decksResultList.ToArray());
        }
        catch (Exception ex)
        {
            return BadRequest(ex);
        }
    }

    public async Task<IActionResult> LoadRandomPackData(
        [FromQuery] string tierFilter,
        [FromQuery] int maxResults)
    {
        try
        {
            // Get a few draftable cards from the database, without images.
            // The images are stored in the file system, and will be retrieved by
            // matching the image file name with the card name.
            string connectionString = _configuration.GetConnectionString("WebApiDatabase");
            SqlConnection cnn = new SqlConnection(connectionString);
            cnn.Open();

            // Take "maxResults" number of random rows from CardsInCube of certain tier for this div
            SqlCommand sqlSelectRandomCardsInCube = new SqlCommand("SELECT TOP " + maxResults + " name FROM CardsInCube WHERE draftability = 'Draftable' AND tier = \'" + tierFilter + "\' ORDER BY NEWID();", cnn);
            SqlDataAdapter adapter = new SqlDataAdapter(sqlSelectRandomCardsInCube);
            SqlDataReader randomDraftableCardsReader = adapter.SelectCommand.ExecuteReader();

            // Save them in an list
            var cardsInCubeResultList = new List<FullCard>();
            while (randomDraftableCardsReader.Read())
            {
                FullCard fullCard = new FullCard();
                fullCard.Name = randomDraftableCardsReader.GetString(0);
                fullCard.Image = await LoadImageDataFromFile(fullCard.Name);
                cardsInCubeResultList.Add(fullCard);
            }

            // Clean up
            sqlSelectRandomCardsInCube.Dispose();
            randomDraftableCardsReader.Close();
            cnn.Close();

            return Ok(cardsInCubeResultList.ToArray());
        }
        catch (Exception ex)
        {
            return BadRequest(ex);
        }
    }

    // Try and load the image for the specified card from the file system.
    // If the image doesn't exist in the file shystem, download it from Scryfall API,
    // and save it to the file system for next time.
    public static async Task<byte[]> LoadImageDataFromFile(string cardName)
    {
        string fileName = Path.Combine(pathRoot, SanitizeFileName(cardName)) + ".png";
        if (System.IO.File.Exists(fileName))
        {
            byte[] imageBytes = System.IO.File.ReadAllBytes(fileName);
            if (imageBytes.Length > 0)
            {
                // We have a non-empty image file of the correct name
                return imageBytes;
            }
            else
            {
                // We have an image file of the correct name, but it's empty
                System.IO.File.Delete(fileName);
            }
        }

        // An image file of the correct name must be created
        byte[] imageData = await LoadImageDataFromScryfall(cardName);
        SaveImageDataToFile(fileName, imageData);
        return imageData;
    }

    public static string SanitizeFileName(string fileName)
    {
        StringBuilder sb = new StringBuilder();
        foreach (char c in fileName)
        {
            if (Char.IsLetterOrDigit(c) || (c == ' ') || (c == '_'))
            {
                sb.Append(c);
            }
            else
            {
                byte b = (byte)(int)c;
                string hex = b.ToString("x");
                sb.Append(hex);
            }
        }
        fileName = sb.ToString();
        if (!Char.IsLetter(fileName[0])) fileName = "C" + fileName;
        return fileName;
    }
    public static async Task<byte[]> LoadImageDataFromScryfall(string cardName)
    {
        return await ScryfallAPIController.GetImageDataFromSkryfallApi(cardName);
    }

    public static void SaveImageDataToFile(string fileName, byte[] imageData)
    {
        // string fileName = Path.Combine(pathRoot, cardName) + ".png";
        if (System.IO.File.Exists(fileName)) System.IO.File.Delete(fileName);
        if (!Directory.Exists(pathRoot)) Directory.CreateDirectory(pathRoot);
        System.IO.File.WriteAllBytes(fileName, imageData);
    }

    // we are hard=coding the file location for now...
    public const string pathRoot = @"C:\Users\katya\Dropbox\CardImages";
}