using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Pauper_Tier_Cube.Models;
using System.Diagnostics;
using System.Linq.Expressions;
using System.Net.Http.Headers;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Pauper_Tier_Cube.Controllers;
public class ScryfallAPIController : Controller
{
    private readonly CubeStatsContext _cubeStatsContext;
    private readonly ILogger<ScryfallAPIController> _logger;

    public ScryfallAPIController(CubeStatsContext cubeStatsContext, IConfiguration configuration, ILogger<ScryfallAPIController> logger)
    {
        _cubeStatsContext = cubeStatsContext;
        _logger = logger;
        _configuration = configuration;
    }

    IConfiguration _configuration;

    [HttpGet]
    public static async Task<byte[]> GetImageDataFromSkryfallApi(string cardName)
    {
        try
        {
            // e.g. https://api.scryfall.com/cards/named?exact=Oblivion%20Crown
            string urlToScryfall = "https://api.scryfall.com/cards/named?exact=" + Uri.EscapeDataString(cardName);

            HttpClient client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpResponseMessage response = await client.GetAsync(urlToScryfall);
            if (response.StatusCode != System.Net.HttpStatusCode.OK) throw new Exception("An error occurred fetching image data."); // TODO: improve
            var result = response.Content.ReadAsStringAsync().Result;

            string imageUrl = String.Empty;

            JToken cardToken = JToken.Parse(result);
            if (cardToken != null)
            {
                JToken imagesToken = cardToken["image_uris"];
                if (imagesToken != null)
                {
                    JToken imageToken = imagesToken["normal"];
                    JValue imageValue = (JValue)imageToken;
                    imageUrl = imageValue?.ToString() ?? String.Empty;
                }
                else
                {
                    // "image_uris" tag may be hidden inside a "card_faces" tag (for double-faced cards)
                    JToken cardFacesToken = cardToken["card_faces"];
                    JToken imageToken = cardFacesToken[0]["image_uris"]["normal"];
                    JValue imageValue = (JValue)imageToken;
                    imageUrl = imageValue?.ToString() ?? String.Empty;
                }
            }
            if (!String.IsNullOrWhiteSpace(imageUrl))
            {
                HttpClient otherClient = new HttpClient();
                otherClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                HttpResponseMessage otherResponse = await otherClient.GetAsync(imageUrl);
                if (otherResponse.StatusCode != System.Net.HttpStatusCode.OK) throw new Exception("An error occurred fetching image data."); // TODO: improve
                var asByteArray = otherResponse.Content.ReadAsByteArrayAsync().Result;
                return asByteArray;
            }
        }
        catch (Exception ex)
        {
            return new byte[0];
        }
        return new byte[0];
    }

    // Method to return a card's color identity, cmc, and types, given its name
    // Used in the process of automatically updating the Cards table in sql database
    public static async Task<string[]> GetCardDataFromSkryfallApi(string cardName)
    {
        try
        {
            // e.g. https://api.scryfall.com/cards/named?exact=Oblivion%20Crown
            string urlToScryfall = "https://api.scryfall.com/cards/named?exact=" + Uri.EscapeDataString(cardName);

            HttpClient client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpResponseMessage response = await client.GetAsync(urlToScryfall);
            if (response.StatusCode != System.Net.HttpStatusCode.OK) throw new Exception("An error occurred fetching card data from Scryfall."); // TODO: improve
            var result = response.Content.ReadAsStringAsync().Result;

            JToken cardToken = JToken.Parse(result);
            if (cardToken != null)
            {
                JToken colorIdentityToken = cardToken["color_identity"];
                if (colorIdentityToken.Count() > 1)
                {
                    colorIdentityToken = "Multiple";
                }
                else if (colorIdentityToken.Count() == 0)
                {
                    colorIdentityToken = "Colorless";
                }
                else
                {
                    colorIdentityToken = colorIdentityToken.Single();
                }
                JToken cmcToken = cardToken["cmc"].ToObject<int>();
                JToken rawTypesToken = cardToken["type_line"];
                string typesToken = "";
                if (rawTypesToken.ToString().Contains('—'))
                {
                    int stringStopIndex = rawTypesToken.ToString().IndexOf('—') - 1;
                    typesToken = rawTypesToken.ToString().Substring(0, stringStopIndex);
                }
                else
                {
                    typesToken = rawTypesToken.ToString();
                }
                string[] otherCardData = { colorIdentityToken.ToString(), cmcToken.ToString(), typesToken };
                return otherCardData;
            }
        }
        catch (Exception ex)
        {
            return new string[0];
        }
        return new string[0];
    }
}

