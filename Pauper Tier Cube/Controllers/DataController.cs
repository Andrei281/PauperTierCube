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
    public async Task<IActionResult> CubeData(
        [FromQuery] string nameFilter,
        [FromQuery] string colorIdentityFilter,
        [FromQuery] string minManaValueFilter,
        [FromQuery] string maxManaValueFilter,
        [FromQuery] string typeFilter,
        [FromQuery] string tierFilter,
        [FromQuery] string draftabilityFilter,
        [FromQuery] string primarySort,
        [FromQuery] string secondarySort)
    {
        try
        {
            // For developmental use: only turn on to update the Cards table in SQL
            // To make sure there are is a Cards row corresponding to every CardsInCube row
            bool updateCardsTableSwitch = false;
            if (updateCardsTableSwitch)
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
                        Card card = CreateCardObject(cardInCube.Name);

                        // Insert new Cards row into Cards table in db
                        SqlTransaction transaction = connection.BeginTransaction();
                        try
                        {
                            _cubeStatsContext.Add(card);
                            transaction.Commit();
                        }
                        catch (Exception ex) { }
                    }
                }
                _cubeStatsContext.SaveChanges();
            }

            // Initialize filters
            string nameValue = "";
            if (!string.IsNullOrEmpty(nameFilter))
            {
                nameValue = nameFilter;
            }
            string[] colorIdentityValues = { "W", "U", "B", "R", "G", "multiple", "colorless" };
            if (!string.IsNullOrEmpty(colorIdentityFilter))
            {
                colorIdentityValues = colorIdentityFilter.Split(',');
            }
            int minManaValue = 0;
            if (int.TryParse(minManaValueFilter, out int minRes))
            {
                minManaValue = minRes;
            }
            int maxManaValue = 100;
            if (int.TryParse(maxManaValueFilter, out int maxRes))
            {
                maxManaValue = maxRes;
            }
            string[] typeValues = { "artifact", "creature", "enchantment", "instant", "land", "sorcery", "artifact creature", "artifact land", "enchantment creature", "instant creature", "sorcery creature" };
            if (!string.IsNullOrEmpty(typeFilter))
            {
                typeValues = typeFilter.Split(',');
            }
            string[] tierValues = { "bronze", "silver", "gold" };
            if (!string.IsNullOrEmpty(tierFilter))
            {
                tierValues = tierFilter.Split(',');
            }
            string[] draftabilityValues = { "draftable", "changed", "not draftable" };
            if (!string.IsNullOrEmpty(draftabilityFilter))
            {
                draftabilityValues = draftabilityFilter.Split(',');
            }

            // Apply filters
            var cardsResult = from fullCard in _cubeStatsContext.FullCards
                              where fullCard.Name.Contains(nameValue)
                              && colorIdentityValues.Contains(fullCard.ColorIdentity)
                              && fullCard.Cmc >= minManaValue && fullCard.Cmc <= maxManaValue
                              && typeValues.Contains(fullCard.CombinedTypes)
                              && tierValues.Contains(fullCard.Tier)
                              && draftabilityValues.Contains(fullCard.Draftability)
                              select fullCard;

            // Initialize sorts
            PropertyInfo primarySortProperty = typeof(FullCard).GetProperty(primarySort);
            PropertyInfo secondarySortProperty = typeof(FullCard).GetProperty(secondarySort);

            // Apply sorts
            var cardsResultList = cardsResult.ToList().OrderBy(fullCard =>
            // Handle primarySort
            {
                if (primarySort.Equals(nameof(FullCard.ColorIdentity)))
                {
                    // For sort: apply custom values for color identity: order is W, U, B, R, G, Multiple, Colorless
                    return ApplyColorIdentityValue(fullCard.ColorIdentity);
                }
                else
                {
                    // For sort: use each card's value associated with primarySort
                    var primarySortValue = primarySortProperty?.GetValue(fullCard)?.ToString();
                    return primarySortValue;
                }
            })
                // Handle secondarySort
                .ThenBy(fullCard =>
                {
                    if (secondarySort.Equals(nameof(FullCard.ColorIdentity)))
                    {
                        // For sort: apply custom values for color identity: order is W, U, B, R, G, Multiple, Colorless
                        return ApplyColorIdentityValue(fullCard.ColorIdentity);
                    }
                    else
                    {
                        // For sort: use each card's value associated with secondarySort
                        var secondarySortValue = secondarySortProperty?.GetValue(fullCard)?.ToString();
                        return secondarySortValue;
                    }
                })
                    // In case secondarySort is not "Name", finally sort by name
                    .ThenBy(fullCard => fullCard.Name);

            // Give each card an associated image
            foreach (var fullCard in cardsResultList)
            {
                fullCard.Image = await LoadImageDataFromFile(fullCard.Name);
            }

            return Ok(cardsResultList.ToArray());
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
    public const string pathRoot = @"C:\Users\{path}";
}