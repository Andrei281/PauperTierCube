using System;
using System.Collections.Generic;

namespace Pauper_Tier_Cube.Models
{
    public partial class CardsInCube
    {
        public string Name { get; set; } = null!;
        public string Tier { get; set; } = null!;
        public string? Draftability { get; set; }
    }
}
