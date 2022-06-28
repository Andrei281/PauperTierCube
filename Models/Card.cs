using System;
using System.Collections.Generic;

#nullable disable

namespace Pauper_Tier_Cube.Models
{
    public partial class CardWithImage : Card // created by manually
    {
        public CardWithImage(Card card)
        {
            Name = card.Name;
            ColorIdentity = card.ColorIdentity;
            Cmc = card.Cmc;
            CombinedTypes = card.CombinedTypes;
        }

        public byte[] Image { get; set; }
    }

    public partial class Card // created by migration
    {
        public string Name { get; set; }
        public string ColorIdentity { get; set; }
        public int? Cmc { get; set; }
        public string CombinedTypes { get; set; }
    }
}
