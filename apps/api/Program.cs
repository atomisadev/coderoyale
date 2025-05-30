var builder = WebApplication.CreateBuilder(args);

var myAllowAllOriginsPolicy = "_myAllowAllOriginsPolicy";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: myAllowAllOriginsPolicy, policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(myAllowAllOriginsPolicy);

app.UseAuthorization();

app.MapControllers();

app.UseWebSockets();


