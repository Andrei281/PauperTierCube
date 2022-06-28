using System;
using System.Collections.Generic;

#nullable disable

namespace Pauper_Tier_Cube.Models
{
    public partial class ReverseDraftCardsReceived
    {
        public string CardName { get; set; }
        public string CardTier { get; set; }
        public string CardColorIdentity { get; set; }
        public int? CardCmc { get; set; }
        public string CardType1 { get; set; }
        public string CardType2 { get; set; }
        public int? DraftsPicked { get; set; }
        public string PlayerName { get; set; }
        public string DraftabilityStatus { get; set; }
    }
}
