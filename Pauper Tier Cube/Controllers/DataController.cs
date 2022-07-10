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
        [FromQuery] string primarySortVal,
        [FromQuery] string secondarySortVal)
    {
        try
        {
            // Get all the requested cards from the database, without images.
            // The images are stored in the file system, and will be retrieved by
            // matching the image file name with the card name.
            string connectionString = _configuration.GetConnectionString("WebApiDatabase");
            SqlConnection cnn = new SqlConnection(connectionString);
            cnn.Open();

            // First, check if we have Cards rows for each CardsInCube row
            SqlCommand sqlCheckCardsForEachCardsInCube = new SqlCommand("SELECT name FROM CardsInCube WHERE name NOT IN (SELECT name FROM Cards);", cnn);
            SqlDataAdapter adapter = new SqlDataAdapter(sqlCheckCardsForEachCardsInCube);
            SqlDataReader cardsMissingReader = adapter.SelectCommand.ExecuteReader();
            while (cardsMissingReader.Read())
            {
                // Check if card name contains apostrophes
                string cardName = cardsMissingReader.GetString(0);
                Card cardObject = CreateCardObject(cardName);
                SqlCommand sqlInsertIntoCards;
                if (cardObject.Name.Contains('\''))
                {
                    // Replace all instances of an apostrophe with 2 apostrophes for card name
                    List<string> substringsByApostrophe = new List<string>();
                    int previousSubstringEnd = 0;
                    for (int charIndex = 0; charIndex < cardObject.Name.Length; charIndex++)
                    {
                        if (cardObject.Name[charIndex].Equals('\''))
                        {
                            string subString = cardObject.Name.Substring(previousSubstringEnd, charIndex - previousSubstringEnd);
                            substringsByApostrophe.Add(subString);
                            previousSubstringEnd = charIndex;
                        }
                    }
                    // Insert statement
                    string lastSubstring = cardObject.Name.Substring(previousSubstringEnd, cardObject.Name.Length - previousSubstringEnd);
                    substringsByApostrophe.Add(lastSubstring);
                    string[] arrayOfSubstringsByApostrophe = substringsByApostrophe.ToArray();
                    string newCardObjectName = string.Join("\'", arrayOfSubstringsByApostrophe);
                    sqlInsertIntoCards = new SqlCommand("INSERT INTO Cards VALUES ('" + newCardObjectName + "', '" + cardObject.ColorIdentity + "', " + cardObject.Cmc + ", '" + cardObject.CombinedTypes + "');", cnn);
                }
                else
                {
                    // Card name contains no apostrophes. Regular insert statement
                    sqlInsertIntoCards = new SqlCommand("INSERT INTO Cards VALUES ('" + cardObject.Name + "', '" + cardObject.ColorIdentity + "', " + cardObject.Cmc + ", '" + cardObject.CombinedTypes + "');", cnn);
                }
                adapter.InsertCommand = sqlInsertIntoCards;
                adapter.InsertCommand.ExecuteNonQuery();
                sqlInsertIntoCards.Dispose();
            }
            sqlCheckCardsForEachCardsInCube.Dispose();
            cardsMissingReader.Close();

            // Now, we construct a single sql query that gets info from both Cards and CardsInCube based on our filters
            string sqlSelectStatement = "SELECT c.name, c.colorIdentity, c.CMC, c.combinedTypes, u.tier, u.draftability";
            sqlSelectStatement += " FROM Cards c";
            sqlSelectStatement += " INNER JOIN CardsInCube u";
            sqlSelectStatement += " ON c.name = u.name";

            // Add the "WHERE" clause based on our filters
            if (!(string.IsNullOrWhiteSpace(nameFilter) && string.IsNullOrWhiteSpace(tierFilter) && string.IsNullOrWhiteSpace(colorIdentityFilter) && minManaValueFilter is null && maxManaValueFilter is null && string.IsNullOrWhiteSpace(typeFilter) && string.IsNullOrWhiteSpace(draftabilityFilter)))
            {
                sqlSelectStatement += " WHERE";
                if (!string.IsNullOrWhiteSpace(nameFilter))
                    sqlSelectStatement += " c.name LIKE %" + nameFilter + "% AND";
                if (!string.IsNullOrWhiteSpace(colorIdentityFilter))
                {
                    string[] colorIdentityFilterElements = colorIdentityFilter?.Split(",") ?? new string[0];
                    sqlSelectStatement += AddSpecificsToFilterStatement(" colorIdentity IN (", colorIdentityFilterElements);
                }
                if (!string.IsNullOrWhiteSpace(minManaValueFilter))
                    sqlSelectStatement += " c.CMC >= " + minManaValueFilter + " AND";
                if (!string.IsNullOrWhiteSpace(maxManaValueFilter))
                    sqlSelectStatement += " c.CMC <= " + maxManaValueFilter + " AND";
                if (!string.IsNullOrWhiteSpace(typeFilter))
                {
                    string[] typeFilterElements = typeFilter?.Split(",") ?? new string[0];
                    sqlSelectStatement += AddSpecificsToFilterStatement(" combinedTypes IN (", typeFilterElements);
                }
                if (!string.IsNullOrWhiteSpace(tierFilter))
                {
                    string[] tierFilterElements = tierFilter?.Split(",") ?? new string[0];
                    sqlSelectStatement += AddSpecificsToFilterStatement(" tier IN (", tierFilterElements);
                }
                if (!String.IsNullOrWhiteSpace(draftabilityFilter))
                {
                    string[] draftabilityFilterElements = draftabilityFilter?.Split(",") ?? new string[0];
                    sqlSelectStatement += AddSpecificsToFilterStatement(" draftability IN (", draftabilityFilterElements);
                }
                if (sqlSelectStatement.Substring(sqlSelectStatement.Length - 4, 4).Equals(" AND"))
                    sqlSelectStatement = sqlSelectStatement.Remove(sqlSelectStatement.Length - 4);
            }

            // Add the "GROUP BY" clause
            sqlSelectStatement += " GROUP BY c.name, c.colorIdentity, c.CMC, c.combinedTypes, u.tier, u.draftability";

            // Add the "ORDER BY" clause based on our sorting
            if (!(primarySortVal.Equals("Tier") || primarySortVal.Equals("Draftability")))
            {
                if (primarySortVal.Equals("ColorIdentity"))
                {
                    // Letting SQL know we want custom sorting for color identity
                    sqlSelectStatement += " ORDER BY (CASE c.ColorIdentity WHEN 'W' THEN 0 WHEN 'U' THEN 1 WHEN 'B' THEN 2 WHEN 'R' THEN 3 WHEN 'G' THEN 4 WHEN 'Multiple' THEN 5 WHEN 'Colorless' THEN 6 END),";
                }
                else
                {
                    sqlSelectStatement += " ORDER BY c." + primarySortVal + ",";
                }
            }
            else
            {
                sqlSelectStatement += " ORDER BY u." + primarySortVal + ",";
            }
            if (!(secondarySortVal.Equals("Tier") || secondarySortVal.Equals("Draftability")))
            {
                if (secondarySortVal.Equals("ColorIdentity"))
                {
                    // Letting SQL know we want custom sorting for color identity
                    sqlSelectStatement += " (CASE c.ColorIdentity WHEN 'W' THEN 0 WHEN 'U' THEN 1 WHEN 'B' THEN 2 WHEN 'R' THEN 3 WHEN 'G' THEN 4 WHEN 'Multiple' THEN 5 WHEN 'Colorless' THEN 6 END)";
                }
                else
                {
                    sqlSelectStatement += " c." + secondarySortVal;
                }
            }
            else
            {
                sqlSelectStatement += " u." + secondarySortVal;
            }

            // Store filtered sql rows in a SqlDataReader
            SqlCommand sqlSelectCommand = new SqlCommand(sqlSelectStatement, cnn);
            adapter.SelectCommand = sqlSelectCommand;
            SqlDataReader cardsFilteredAndSortedReader = adapter.SelectCommand.ExecuteReader();

            // Construct card objects with properties from both Cards and CardsInCube, as well as an image
            List<FullCard> fullCards = new List<FullCard>();
            while (cardsFilteredAndSortedReader.Read())
            {
                try
                {
                    FullCard fullCard = new FullCard();
                    fullCard.Name = cardsFilteredAndSortedReader.GetString(0);
                    fullCard.ColorIdentity = cardsFilteredAndSortedReader.GetString(1);
                    fullCard.Cmc = cardsFilteredAndSortedReader.GetInt32(2);
                    fullCard.CombinedTypes = cardsFilteredAndSortedReader.GetString(3);
                    fullCard.Tier = cardsFilteredAndSortedReader.GetString(4);
                    fullCard.Draftability = cardsFilteredAndSortedReader.GetString(5);
                    fullCard.Image = await LoadImageDataFromFile(fullCard.Name);
                    fullCards.Add(fullCard);
                }
                catch (Exception ex)
                {
                    if (ex != null) { }
                }
            }

            // Clean up
            sqlSelectCommand.Dispose();
            cardsFilteredAndSortedReader.Close();
            cnn.Close();

            return Ok(fullCards.ToArray());
        }
        catch (Exception ex)
        {
            return BadRequest(ex);
        }
    }

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

    public static string AddSpecificsToFilterStatement(string queryBeginning, string[] filterSpecifics)
    {
        string returnString = queryBeginning;
        for (int i = 0; i < filterSpecifics.Length; i++)
        {
            returnString += "\'" + filterSpecifics[i] + "\', ";
        }
        returnString = returnString.Remove(returnString.Length - 2);
        returnString += ") AND";
        return returnString;
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