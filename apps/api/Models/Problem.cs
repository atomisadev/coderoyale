using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MyCsApi.Models
{
    public class ProblemTestCase
    {
        [JsonPropertyName("title")]
        public JsonElement? Title { get; set; }

        [JsonPropertyName("isTest")]
        public bool IsTest { get; set; }

        [JsonPropertyName("testIn")]
        public string? TestIn { get; set; }

        [JsonPropertyName("testOut")]
        public string? TestOut { get; set; }

        [JsonPropertyName("isValidator")]
        public bool IsValidator { get; set; }
    }

    public class ProblemData
    {
        [JsonPropertyName("statement")]
        public string? Statement { get; set; }

        [JsonPropertyName("testCases")]
        public List<ProblemTestCase> TestCases { get; set; } = new();

        [JsonPropertyName("constraints")]
        public string? Constraints { get; set; }

        [JsonPropertyName("inputDescription")]
        public string? InputDescription { get; set; }

        [JsonPropertyName("outputDescription")]
        public string? OutputDescription { get; set; }
    }

    public class ProblemLastVersion
    {
        [JsonPropertyName("data")]
        public ProblemData? Data { get; set; }
    }

    public class Problem
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("lastVersion")]
        public ProblemLastVersion? LastVersion { get; set; }
    }
}