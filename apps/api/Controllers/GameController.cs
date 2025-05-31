using Microsoft.AspNetCore.Mvc;

namespace MyCsApi.Controllers;

[ApiController]
[Route("[controller]")]
public class GameController : ControllerBase
{
    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok(new { status = "API is healthy" });
    }
}
