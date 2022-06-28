using System;
using System.Collections.Generic;

#nullable disable

namespace Pauper_Tier_Cube.Models
{
    public partial class CardsInCubeWithImage : CardsInCube // created by manually
    {
        public CardsInCubeWithImage(CardsInCube cardInCube)
        {
            Name = cardInCube.Name;
            Tier = cardInCube.Tier;
            Draftability = cardInCube.Draftability;
        }

        public byte[] Image { get; set; }
    }

    public partial class CardsInCube
    {
        public string Name { get; set; }
        public string Tier { get; set; }
        public string Draftability { get; set; }
    }
}
