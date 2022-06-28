The following are Entity Framework commands to apply in the NuGet Package Manager Console:

For new projects:
Scaffold-DbContext "Server=DESKTOP-0Q2ECRN;Database=CubeStats;Integrated Security=false;User Id=sa;Password=`$TRONG123" -Provider Microsoft.EntityFrameworkCore.SqlServer -OutputDir Models

To apply SQL table updates:
scaffold-dbcontext "Server=DESKTOP-0Q2ECRN;Database=CubeStats;Integrated Security=false;User Id=sa;Password=`$TRONG123" -Provider Microsoft.EntityFrameworkCore.SqlServer -OutputDir Models -force