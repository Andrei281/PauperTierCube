using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Pauper_Tier_Cube.Models;
using System.Diagnostics;

namespace Pauper_Tier_Cube.Controllers;
public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult List()
    {
        return View();
    }

    public IActionResult Themes()
    {
        return View();
    }

    public IActionResult Stats()
    {
        return View();
    }

    public IActionResult FilterPopUp()
    {
        return View();
    }

    public IActionResult PackPopUp()
    {
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
