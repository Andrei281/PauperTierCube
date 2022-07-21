The following are Entity Framework commands to apply in the NuGet Package Manager Console:

For new projects:
Scaffold-DbContext "Server=(computer name);Database=(localdb);Integrated Security=false;User Id=(sql login);Password=(sql password)" -Provider Microsoft.EntityFrameworkCore.SqlServer -OutputDir Models

Enter following command in the Nuget Package Manager Console whenever the sql database structure changes:
Scaffold-DbContext "Data Source=(computer name); Initial Catalog=(localdb); User ID=(sql login); Password=(sql password); Integrated Security=True; Connect Timeout=30" Microsoft.EntityFrameworkCore.SqlServer -OutputDir Models -verbose -Force

Note: When using ^^ command, first make sure the project has no errors.
Note: ^^ command will delete the [Key] we've inserted into the Cards model. Make sure to reenter [Key] above the Name field. In CubeStatsContext, comment out entity.HasNoKey(); at Card.
Note: ^^ command will reenter sensitive info into CubeStatsContext.cs. Replace this sensitive info using the following lines:

        using Microsoft.Extensions.Configuration;

        public CubeStatsContext(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        protected readonly IConfiguration _configuration;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                string connectionString = _configuration.GetConnectionString("WebApiDatabase");
                optionsBuilder.UseSqlServer(connectionString);
            }
        }