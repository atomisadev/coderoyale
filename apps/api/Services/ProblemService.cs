using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyCsApi.Models;

namespace MyCsApi.Services
{
    public interface IProblemService
    {
        Problem? GetRandomProblem();
    }

    public class ProblemService : IProblemService
    {
        private List<Problem> _problems = new();
        private readonly Random _random = new();
        private readonly ILogger<ProblemService> _logger;

        public ProblemService(ILogger<ProblemService> logger, IHostEnvironment env)
        {
            _logger = logger;
            var filePath = Path.Combine(env.ContentRootPath, "problems.json");

            try
            {
                if (File.Exists(filePath))
                {
                    var jsonString = File.ReadAllText(filePath);
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                    };
                    _problems = JsonSerializer.Deserialize<List<Problem>>(jsonString, options) ?? new List<Problem>();
                    _logger.LogInformation($"Successfully loaded {_problems.Count} problems from {filePath}.");
                }
                else
                {
                    _logger.LogWarning($"Problem file not found at {filePath}. No problem will be available.");
                    _problems = new List<Problem>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error loading or deserializing problems from {filePath}.");
                _problems = new List<Problem>();
            }
        }

        public Problem? GetRandomProblem()
        {
            if (_problems == null || !_problems.Any())
            {
                _logger.LogWarning("Attempted to get a random problem, but no problems are loaded.");
                return null;
            }
            return _problems[_random.Next(_problems.Count)];
        }
    }
}