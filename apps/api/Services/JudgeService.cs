using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyCsApi.Models;

namespace MyCsApi.Services
{
    public interface IJudgeService
    {
        Task<JudgeSubmissionResult?> SubmitCodeAsync(string sourceCode, int languageId, string? stdin, string? expectedOutput);
    }

    public class JudgeService : IJudgeService
    {
        private readonly HttpClient _httpClient;
        private readonly Judge0Settings _judge0Settings;
        private readonly ILogger<JudgeService> _logger;
        private static readonly JsonSerializerOptions _responseJsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        private static readonly JsonSerializerOptions _requestJsonOptions = new() { PropertyNamingPolicy = null };

        public JudgeService(HttpClient httpClient, IOptions<Judge0Settings> judge0Settings, ILogger<JudgeService> logger)
        {
            _httpClient = httpClient;
            _judge0Settings = judge0Settings.Value;
            _logger = logger;

            if (!string.IsNullOrEmpty(_judge0Settings.ApiKey))
            {
                _httpClient.DefaultRequestHeaders.Add("X-RapidAPI-Key", _judge0Settings.ApiKey);
            }
            if (!string.IsNullOrEmpty(_judge0Settings.ApiHost))
            {
                _httpClient.DefaultRequestHeaders.Add("X-RapidAPI-Host", _judge0Settings.ApiHost);
            }
        }

        public async Task<JudgeSubmissionResult?> SubmitCodeAsync(string sourceCode, int languageId, string? stdin, string? expectedOutput)
        {
            var submissionRequestToJudge0 = new JudgeSubmissionRequest
            {
                SourceCode = sourceCode,
                LanguageId = languageId,
                Stdin = stdin,
                ExpectedOutput = expectedOutput
            };

            var jsonPayloadForJudge0 = JsonSerializer.Serialize(submissionRequestToJudge0, _requestJsonOptions);
            _logger.LogInformation($"Payload sending to Judge0: {jsonPayloadForJudge0}");

            var judge0Url = $"{_judge0Settings.ApiUrl.TrimEnd('/')}/submissions?base64_encoded=false&wait=true";

            _logger.LogInformation($"Submitting to Judge0: {judge0Url}");
            _logger.LogInformation($"Payload for Judge0: {jsonPayloadForJudge0}");

            try
            {
                var jsonContent = new StringContent(jsonPayloadForJudge0, Encoding.UTF8, "application/json");
                HttpResponseMessage response = await _httpClient.PostAsync(judge0Url, jsonContent);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Judge0 API request failed with status {response.StatusCode}: {errorContent}");
                    return new JudgeSubmissionResult { Status = new JudgeStatus { Id = 0, Description = "Error communicating with Judge0" }, ErrorDetails = errorContent };
                }

                var result = await response.Content.ReadFromJsonAsync<JudgeSubmissionResult>(_responseJsonOptions);
                if (result != null)
                {
                    _logger.LogInformation($"Judge0 Result ({result.Status?.Description}): STDOUT: {result.Stdout}, STDERR: {result.Stderr}, Compile Output: {result.CompileOutput}");
                }
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception occurred while submitting to Judge0.");
                return new JudgeSubmissionResult { Status = new JudgeStatus { Description = "Exception during Judge0 submission" }, ErrorDetails = ex.Message };
            }
        }
    }

    public class JudgeSubmissionRequest
    {
        [JsonPropertyName("source_code")]
        public string SourceCode { get; set; } = string.Empty;

        [JsonPropertyName("language_id")]
        public int LanguageId { get; set; }

        [JsonPropertyName("stdin")]
        public string? Stdin { get; set; }

        [JsonPropertyName("expected_output")]
        public string? ExpectedOutput { get; set; }
    }

    public class JudgeSubmissionResult
    {
        [JsonPropertyName("stdout")]
        public string? Stdout { get; set; }

        [JsonPropertyName("stderr")]
        public string? Stderr { get; set; }

        [JsonPropertyName("compile_output")]
        public string? CompileOutput { get; set; }

        [JsonPropertyName("message")] // For base64 encoded response messages
        public string? Message { get; set; }

        [JsonPropertyName("status")]
        public JudgeStatus? Status { get; set; }

        [JsonPropertyName("time")]
        public string? Time { get; set; } // Execution time in seconds

        [JsonPropertyName("memory")]
        public int? Memory { get; set; } // Memory in kilobytes

        public string? ErrorDetails { get; set; } // Custom field for our error tracking
    }

    public class JudgeStatus
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;
    }
}