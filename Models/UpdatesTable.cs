using System;
using System.Collections.Generic;

#nullable disable

namespace Pauper_Tier_Cube.Models
{
    public partial class UpdatesTable
    {
        public string Name { get; set; }
        public string Tier { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string EndReason { get; set; }
    }
}
