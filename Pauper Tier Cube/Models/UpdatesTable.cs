using System;
using System.Collections.Generic;

namespace Pauper_Tier_Cube.Models
{
    public partial class UpdatesTable
    {
        public string Name { get; set; } = null!;
        public string Tier { get; set; } = null!;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? EndReason { get; set; }
    }
}
