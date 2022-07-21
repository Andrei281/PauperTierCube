using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Pauper_Tier_Cube.Models
{
    public partial class Card
    {
        [Key]
        public string Name { get; set; } = null!;
        public string? ColorIdentity { get; set; }
        public int? Cmc { get; set; }
        public string? CombinedTypes { get; set; }
        public byte[]? Image { get; set; }
    }
}
