using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MyCsApi.Models;
using MyCsApi.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyCsApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JudgeController : ControllerBase
    {
        private readonly IJudgeService _judgeService;
        private readonly Judge0Settings _judge0Settings;
        private readonly ILogger<JudgeController> _logger;

        public JudgeController(IJudgeService judgeService, IOptions<Judge0Settings> judge0Settings, ILogger<JudgeController> logger)
        {
            _judgeService = judgeService;
            _judge0Settings = judge0Settings.Value;
            _logger = logger;
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitCode([FromBody] CodeSubmissionRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.SourceCode) || request.TestCases == null)
            {
                return BadRequest(new { message = "Invalid submission request." });
            }

            _logger.LogInformation($"Received code submission. Language ID: {request.LanguageId}. Test cases: {request.TestCases.Count}");

            var results = new List<TestCaseExecutionResult>();
            bool allPassed = true;
            string? overallCompilationOutput = null;
            string? overallErrorOutput = null;


            foreach (var testCase in request.TestCases)
            {
                _logger.LogInformation($"Executing test case: {testCase.Title}");
                var judgeResult = await _judgeService.SubmitCodeAsync(
                    request.SourceCode,
                    request.LanguageId > 0 ? request.LanguageId : _judge0Settings.DefaultPythonLanguageId,
                    testCase.Stdin,
                    testCase.ExpectedOutput
                );

                var caseResult = new TestCaseExecutionResult
                {
                    Title = testCase.Title,
                    ExpectedOutput = testCase.ExpectedOutput,
                    ActualOutput = judgeResult?.Stdout?.TrimEnd('\n', '\r'),
                    Status = judgeResult?.Status?.Description ?? "Unknown Error",
                    Judge0StatusId = judgeResult?.Status?.Id ?? 0,
                    ErrorMessage = judgeResult?.Stderr ?? judgeResult?.CompileOutput ?? judgeResult?.ErrorDetails,
                    Time = judgeResult?.Time,
                    Memory = judgeResult?.Memory
                };

                if (judgeResult?.CompileOutput != null && overallCompilationOutput == null)
                {
                    overallCompilationOutput = judgeResult.CompileOutput;
                }
                if (judgeResult?.Stderr != null && string.IsNullOrEmpty(caseResult.ActualOutput)) // Prioritize stderr if stdout is empty
                {
                    overallErrorOutput = string.IsNullOrEmpty(overallErrorOutput) ? judgeResult.Stderr : $"{overallErrorOutput}\n{judgeResult.Stderr}";
                }


                if (judgeResult != null && judgeResult.Status != null)
                {
                    if (judgeResult.Status.Id == 3) // Accepted
                    {
                        var actual = caseResult.ActualOutput ?? "";
                        var expected = testCase.ExpectedOutput?.TrimEnd('\n', '\r') ?? "";
                        caseResult.Passed = actual.Equals(expected);
                    }
                    else
                    {
                        caseResult.Passed = false;
                    }
                }
                else
                {
                    caseResult.Passed = false;
                    caseResult.Status = judgeResult?.ErrorDetails ?? "Failed to get result from Judge0";
                }

                if (!caseResult.Passed) allPassed = false;
                results.Add(caseResult);

                if (judgeResult?.Status?.Id == 6)
                {
                    overallCompilationOutput = judgeResult.CompileOutput ?? "Compilation failed.";
                    allPassed = false;
                    break;
                }
                if (judgeResult?.Status?.Id > 6 && judgeResult?.Status?.Id <= 13)
                {
                    overallErrorOutput = string.IsNullOrEmpty(overallErrorOutput) ? (judgeResult.Stderr ?? judgeResult.Status.Description) : $"{overallErrorOutput}\n{judgeResult.Stderr ?? judgeResult.Status.Description}";
                    allPassed = false;
                }
            }

            string overallStatus;
            if (overallCompilationOutput != null) overallStatus = "Compilation Error";
            else if (overallErrorOutput != null && !results.Any(r => r.Passed)) overallStatus = "Runtime Error";
            else if (allPassed) overallStatus = "All tests passed!";
            else if (results.Any(r => r.Passed)) overallStatus = "Some tests failed";
            else overallStatus = "All tests failed";


            return Ok(new CodeSubmissionResult
            {
                Results = results,
                OverallStatus = overallStatus,
                CompilationOutput = overallCompilationOutput,
                ErrorOutput = overallErrorOutput
            });
        }
    }

    public class CodeSubmissionRequest
    {
        public string SourceCode { get; set; } = string.Empty;
        public int LanguageId { get; set; }
        public List<ApiProblemTestCase> TestCases { get; set; } = new();
    }

    public class ApiProblemTestCase
    {
        public string Title { get; set; } = string.Empty;
        public string? Stdin { get; set; }
        public string? ExpectedOutput { get; set; }
    }

    public class CodeSubmissionResult
    {
        public List<TestCaseExecutionResult> Results { get; set; } = new();
        public string OverallStatus { get; set; } = string.Empty;
        public string? CompilationOutput { get; set; }
        public string? ErrorOutput { get; set; }
    }

    public class TestCaseExecutionResult
    {
        public string Title { get; set; } = string.Empty;
        public bool Passed { get; set; }
        public string? ActualOutput { get; set; }
        public string? ExpectedOutput { get; set; }
        public string Status { get; set; } = string.Empty;
        public int Judge0StatusId { get; set; }
        public string? ErrorMessage { get; set; }
        public string? Time { get; set; }
        public int? Memory { get; set; }
    }
}