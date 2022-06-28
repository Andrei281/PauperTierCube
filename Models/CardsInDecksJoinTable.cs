using System;
using System.Collections.Generic;

#nullable disable

namespace Pauper_Tier_Cube.Models
{
    public partial class CardsInDecksJoinTable
    {
        public string DeckId { get; set; }
        public string Name { get; set; }
        public int? CopiesUsed { get; set; }
        public int? CopiesAvailable { get; set; }

        public virtual Deck Deck { get; set; }
    }
}
