using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MyCsApi.Services;
using MyCsApi.WebSockets;
using Microsoft.Extensions.Options;
using MyCsApi.Models;

var builder = WebApplication.CreateBuilder(args);

var myAllowAllOriginsPolicy = "_myAllowAllOriginsPolicy";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: myAllowAllOriginsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.Configure<Judge0Settings>(builder.Configuration.GetSection("Judge0"));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSingleton<IRoomManager, RoomManager>();
builder.Services.AddSingleton<ICardManager, CardManager>();
builder.Services.AddSingleton<IProblemService, ProblemService>();
builder.Services.AddSingleton<WebSocketMessageHandler>();

builder.Services.AddHttpClient<IJudgeService, JudgeService>();


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // app.MapOpenApi(); 
}

app.UseHttpsRedirection();
app.UseCors(myAllowAllOriginsPolicy);
app.UseAuthorization();
app.MapControllers();

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(120),
});

app.Map("/ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var handler = app.Services.GetRequiredService<WebSocketMessageHandler>();
        await handler.HandleWebSocketAsync(webSocket);
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
    }
});

app.Run();
