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
        [FromQuery] string tierFilter,
        [FromQuery] string colorIdentityFilter,
        [FromQuery] string minManaValueFilter,
        [FromQuery] string maxManaValueFilter,
        [FromQuery] string typeFilter,
        [FromQuery] string draftabilityStatusFilter,
        [FromQuery] int maxResults)
    {
        try
        {
            // Get all the requested cards from the database, without images.
            // The images are stored in the file system, and will be retrieved by
            // matching the image file name with the card name.
            IQueryable<Card> cards = _cubeStatsContext.Cards;
            IQueryable<CardsInCube> cardsInCubeResult = _cubeStatsContext.CardsInCubes;

            // First, we deal with CardsInCube data
            if (!String.IsNullOrWhiteSpace(tierFilter))
            {
                string[] tierFilterElements = tierFilter?.Split(",") ?? new string[0];
                cardsInCubeResult = cardsInCubeResult.Where(card => tierFilterElements.Contains(card.Tier));
            }

            if (!String.IsNullOrWhiteSpace(draftabilityStatusFilter))
            {
                string[] draftabilityStatusFilterElements = draftabilityStatusFilter?.Split(",") ?? new string[0];
                cardsInCubeResult = cardsInCubeResult.Where(card => draftabilityStatusFilterElements.Contains(card.Draftability));
            }

            var cardsInCubeResultsArray = cardsInCubeResult.ToArray();
            var cardNames = cards.Select(card => card.Name).ToArray();

            // Check if we have Cards for each CardsInCube
            for (int i = 0; i < cardsInCubeResultsArray.Length; i++)
            {
                string cardInCubeName = cardsInCubeResultsArray[i].Name;

                // If no Cards row for this CardsInCube row...
                if (!cardNames.Contains(cardInCubeName))
                {
                    // ...create new Cards row for this card name
                    string connectionString = _configuration.GetConnectionString("WebApiDatabase");
                    SqlConnection cnn = new SqlConnection(connectionString);
                    cnn.Open();

                    Card cardObject = CreateCardObject(cardInCubeName);
                    string sqlInsertStatement = "insert into Cards values ('" + cardObject.Name + "', '" + cardObject.ColorIdentity + "', " + cardObject.Cmc + ", '" + cardObject.CombinedTypes + "');";

                    SqlCommand sqlInsert = new SqlCommand(sqlInsertStatement, cnn);

                    SqlDataAdapter adapter = new SqlDataAdapter();
                    adapter.InsertCommand = sqlInsert;
                    adapter.InsertCommand.ExecuteNonQuery();

                    sqlInsert.Dispose();
                    cnn.Close();
                }
            }

            // Then, we deal with Cards data
            if (!String.IsNullOrWhiteSpace(nameFilter))
            {
                cards = cards.Where(card => card.Name.StartsWith(nameFilter));
            }

            if (!String.IsNullOrWhiteSpace(colorIdentityFilter))
            {
                string[] colorIdentityFilterElements = colorIdentityFilter?.Split(",") ?? new string[0];
                cards = cards.Where(card => colorIdentityFilterElements.Contains(card.ColorIdentity));
            }

            if (!String.IsNullOrWhiteSpace(minManaValueFilter))
            {
                if (!Int32.TryParse(minManaValueFilter, out int intifiedMinManaValueFilter))
                    throw new ArgumentException($"{minManaValueFilter} isn't a valid integer value for minManaValueFilter.");
                if (intifiedMinManaValueFilter < 0)
                    throw new ArgumentException($"{minManaValueFilter} isn't a valid minManaValueFilter value. minManaValueFilter must be a positive integer.");
                cards = cards.Where(card => card.Cmc >= intifiedMinManaValueFilter);
            }

            if (!String.IsNullOrWhiteSpace(maxManaValueFilter))
            {
                if (!Int32.TryParse(maxManaValueFilter, out int intifiedMaxManaValueFilter))
                    throw new ArgumentException($"{minManaValueFilter} isn't a valid integer value for maxManaValueFilter.");
                if (intifiedMaxManaValueFilter < 0)
                    throw new ArgumentException($"{maxManaValueFilter} isn't a valid maxManaValueFilter value. maxManaValueFilter must be a positive integer.");
                cards = cards.Where(card => card.Cmc <= intifiedMaxManaValueFilter);
            }

            if (!String.IsNullOrWhiteSpace(typeFilter))
            {
                string[] typeFilterElements = typeFilter?.Split(",") ?? new string[0];
                cards = cards.Where(card => typeFilterElements.Contains(card.CombinedTypes));
            }
            cards = cards
                .OrderBy(card => card.Cmc).ThenBy(card => card.Name)
                .Take(maxResults);

            // Convert from data-model without image property to DTO with image property
            var cardsResultsArray = new List<CardWithImage>();
            foreach (var card in cards)
            {
                try
                {
                    var cardWithImage = new CardWithImage(card);
                    cardWithImage.Image = await LoadImageDataFromFile(card.Name);
                    cardsResultsArray.Add(cardWithImage);
                }
                catch (Exception ex)
                {
                    if (ex != null) { }
                }
            }

            var result = new { Cards = cardsResultsArray, CardsInCube = cardsInCubeResultsArray };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex);
        }
    }

    // Method to create card object to insert into Cards table (sql)
    // References Scryfall API for data
    public static Card CreateCardObject(string cardName)
    {
        string[] cardInfo = ScryfallAPIController.GetCardDataFromSkryfallApi(cardName).Result;

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
            IQueryable<CardsInCube> cardsInCubeResult = _cubeStatsContext.CardsInCubes;

            cardsInCubeResult = cardsInCubeResult.Where(cardInCube => cardInCube.Tier.Contains(tierFilter));
            cardsInCubeResult = cardsInCubeResult.Where(cardInCube => cardInCube.Draftability.Equals("Draftable"));
            var cardsInCubeResultsArray = cardsInCubeResult.ToArray();

            var cardsInCubeResultList = new List<CardsInCube>();

            Random r = new Random();
            int rInt = r.Next(0, 0);
            var rInts = new List<int>();

            for (int i = 0; i < maxResults; i++)
            {
                if (tierFilter == "silver")
                {
                    rInt = r.Next(0, 199);
                    while (rInts.Contains(rInt))
                    {
                        rInt = r.Next(0, 199);
                    }
                    rInts.Add(rInt);
                }
                else
                {
                    rInt = r.Next(0, 99);
                    while (rInts.Contains(rInt))
                    {
                        rInt = r.Next(0, 99);
                    }
                    rInts.Add(rInt);
                }
                cardsInCubeResultList.Add(cardsInCubeResultsArray[rInt]);
            }

            var cardsInCubeImagesArray = new List<CardsInCubeWithImage>();
            foreach (var cardInCube in cardsInCubeResultList)
            {
                try
                {
                    var cardInCubeWithImage = new CardsInCubeWithImage(cardInCube);
                    cardInCubeWithImage.Image = await LoadImageDataFromFile(cardInCube.Name);
                    cardsInCubeImagesArray.Add(cardInCubeWithImage);
                }
                catch (Exception ex)
                {
                    if (ex != null) { }
                }
            }

            var result = new { CardsInCube = cardsInCubeImagesArray };

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex);
        }
    }

    /// <summary>
    /// Try and load the image for the specified card from the file system.
    /// If the image doesn't exist in the file shystem, download it from Scryfall API,
    /// and save it to the file system for next time.
    /// </summary>
    /// <param name="cardName"></param>
    /// <returns></returns>
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