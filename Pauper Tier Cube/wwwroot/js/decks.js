// We're in decks page. Prepare various elements...
async function prepareDecksPage() {

    // Show loading icon
    let loadingGifContainer = document.createElement("div");
    loadingGifContainer.setAttribute("style", "margin: auto");
    let loadingGif = document.createElement("img");
    loadingGif.setAttribute("src", "https://www.wpfaster.org/wp-content/uploads/2013/06/loading-gif.gif");
    loadingGif.setAttribute("style", "margin: auto; width: 50px; height: 50px");
    loadingGifContainer.appendChild(loadingGif);
    document.getElementById('decksDestination').appendChild(loadingGifContainer);

    // Acquire preliminary deck info
    let preliminaryDeckData = await fetch('/data/DeckData?&primarySort=DatePlayed&secondarySort=Strat&countDrafts=true', {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', // no-cors, *cors, same-origin
    })
        .then(res => {
            if (res.status == 200) {
                return res.json();
            } else { throw "Error fetching decks: " + res; }
        })
        .then(deckdata => {
            if (deckdata) {
                if (!Array.isArray(deckdata)) throw 'decks in server response is not an array.'
                return deckdata;
            }
        }).catch(err => {
            alert("Error fetching data: " + err);
        });

    // Apply deck info to various filter elements
    let deckIds = GetPropertyFromDecks(preliminaryDeckData[0], 'deckId', false);
    let deckStrats = GetPropertyFromDecks(preliminaryDeckData[0], 'strat', true);
    ApplyDropdownInfo(document.getElementById('deckIds'), deckIds);
    ApplyDropdownInfo(document.getElementById('strats'), deckStrats);
    document.getElementById('pastDrafts').setAttribute('value', preliminaryDeckData[1]);

    // Insert preliminary, fetched decks into page
    FillDecksDiv(preliminaryDeckData[0]);

    // Prepare filter button
    document.getElementById('filterButton').setAttribute('style', 'background-color:#F08E00;margin-top:20px;margin-bottom:10px;width:100%;opacity:1;pointer-events:initial');
    document.getElementById("filterButton").addEventListener("click", () => FetchDeckData());
}

// Function to turn a list of decks into a list of property instances of a single property among those decks
function GetPropertyFromDecks(decks, property, getDistinct) {
    if (getDistinct) {

        // Return instances of deck property with no repeats
        let distinctPropertyInstances = [];
        for (let i = 0; i < decks.length; i++) {
            if (!distinctPropertyInstances.includes(decks[i][property])) {
                distinctPropertyInstances.push(decks[i][property]);
            }
        }
        return distinctPropertyInstances;
    } else {

        // Return instances of deck property. Repeats are irrelevant
        let propertyInstances = []
        for (let i = 0; i < decks.length; i++) {
            propertyInstances.push(decks[i][property]);
        }
        return propertyInstances;
    }
}

// Function to fill a dropdown with filter options
function ApplyDropdownInfo(dropdownElement, propertyInstances) {
    for (let i = 0; i < propertyInstances.length; i++) {
        let propertyInstanceElement = document.createElement('option');
        propertyInstanceElement.innerHTML = propertyInstances[i];
        dropdownElement.appendChild(propertyInstanceElement);
    }
}

// Fetch filtered decks
async function FetchDeckData() {

    // Show loading icon
    let loadingGifContainer = document.createElement("div");
    loadingGifContainer.setAttribute("style", "margin: auto");
    let loadingGif = document.createElement("img");
    loadingGif.setAttribute("src", "https://www.wpfaster.org/wp-content/uploads/2013/06/loading-gif.gif");
    loadingGif.setAttribute("style", "margin: auto; width: 50px; height: 50px");
    loadingGifContainer.appendChild(loadingGif);
    document.getElementById('decksDestination').appendChild(loadingGifContainer);

    // Begin fetching database info
    url = '/data/DeckData?deckIdFilter=' + document.getElementById('deckIdFilter').value
        + '&playerNameFilter=' + document.getElementById('playerNameFilter').value
        + '&stratFilter=' + document.getElementById('stratFilter').value
        + '&colorFilter=' + AcquireFilterDivValues(document.getElementById('colorsFilter'))
        + '&pastDraftsFilter=' + document.getElementById('pastDrafts').value
        + '&minWinsFilter=' + document.getElementById('minWins').value
        + '&maxWinsFilter=' + document.getElementById('maxWins').value
        + '&minLossesFilter=' + document.getElementById('minLosses').value
        + '&maxLossesFilter=' + document.getElementById('maxLosses').value
        + '&minAverageManaValueFilter=' + document.getElementById('minAverageManaValueFilter').value
        + '&maxAverageManaValueFilter=' + document.getElementById('maxAverageManaValueFilter').value
        + '&minLandsFilter=' + document.getElementById('minLands').value
        + '&maxLandsFilter=' + document.getElementById('maxLands').value
        + '&minNonlandsFilter=' + document.getElementById('minNonlands').value
        + '&maxNonlandsFilter=' + document.getElementById('maxNonlands').value
        + '&primarySort=' + document.getElementById("primarySortInput").value
        + '&secondarySort=' + document.getElementById("secondarySortInput").value
        + '&countDrafts=false';
    await fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', // no-cors, *cors, same-origin
    })
        .then(res => {
            if (res.status == 200) {
                return res.json();
            } else { throw "Error fetching decks: " + res; }
        })
        .then(decks => {
            if (decks) {
                if (!Array.isArray(decks)) throw 'decks in server response is not an array.'
                /*                loadingGifContainer.remove();*/
                FillDecksDiv(decks);
            }
        }).catch(err => {
            if (err) { }
            loadingGifContainer.remove();
            alert("Error fetching data: " + err);
        });
}

function FillDecksDiv(decks) {

    // Create title div used to count decks
    var deckDestinationElement = document.getElementById('decksDestination');
    deckDestinationElement.innerHTML = "";
    var deckCountHeader = document.createElement('div');
    deckCountHeader.setAttribute('style', 'width:100%;background-color:white;border:3px inset gray;border-bottom:none;font-weight:bold;font-size:25px;display:flex;align-items:center;justify-content:center;padding:10px');
    deckCountHeader.innerHTML = 'Decks - (' + decks.length + ')';
    deckDestinationElement.appendChild(deckCountHeader);

    // Fill deckDestination with decks
    for (let i = 0; i < decks.length; i++) {

        // Create full deck div
        let deckDiv = document.createElement('div');
        deckDiv.setAttribute('class', 'DeckDiv');

        // Inside full deck div: Create HallOfFame icon (if applicable)
        if (decks[i].hallOfFame) {
            let hallOfFameDiv = document.createElement('div');
            let starImage = document.createElement('img');
            starImage.setAttribute('src', '	https://opengameart.org/sites/default/files/styles/medium/public/sss_1.png');
            starImage.setAttribute('style', 'width:30px;height:30px');
            hallOfFameDiv.appendChild(starImage);
            deckDiv.appendChild(hallOfFameDiv);
        }

        // Inside full deck div: Create date div
        let dateDiv = document.createElement('div');
        dateDiv.innerHTML = decks[i].datePlayed.slice(0, 10);
        deckDiv.appendChild(dateDiv);

        // Inside full deck div: Create playerName div
        let playerNameDiv = document.createElement('div');
        playerNameDiv.innerHTML = "By : " + decks[i].playerName;
        deckDiv.appendChild(playerNameDiv);

        // Inside full deck div: Create wins/losses div
        let winsDiv = document.createElement('div');
        winsDiv.innerHTML = "W / L : " + decks[i].gamesWon + " / " + decks[i].gamesLost;
        deckDiv.appendChild(winsDiv);

        // Inside full deck div: Create colors div
        let colorsDiv = document.createElement('div');
        colorsDiv.setAttribute('style', 'display:flex');
        let deckColors = decks[i].colors.split('');
        for (let j = 0; j < deckColors.length; j++) {
            let colorOfDiv = deckColors[j];
            let backgroundColor = ApplyColor(colorOfDiv);
            let colorDiv = document.createElement('div');
            colorDiv.setAttribute('class', 'ColorIndicator');
            if (j == deckColors.length - 1) {
                //colorDiv.setAttribute('style', 'border:solid;width:25px;height:25px;background-color:' + backgroundColor);
                colorDiv.setAttribute('style', 'background-color:' + backgroundColor);
            } else {
                //colorDiv.setAttribute('style', 'border:solid;width:25px;height:25px;margin-right:5px;background-color:' + backgroundColor);
                colorDiv.setAttribute('style', 'margin-right:5px;background-color:' + backgroundColor);
            }
            colorsDiv.appendChild(colorDiv);
        }
        deckDiv.appendChild(colorsDiv);

        // Apply tooltip capabilities to deck div
        var timeOut;
        deckDiv.addEventListener("mouseenter", function () {
            let that = this;
            timeOut = setTimeout(function () { DisplayDeckToolTip(that, decks[i]) }, 400);
        });
        deckDiv.addEventListener("mouseleave", function () {
            clearTimeout(timeOut);
            VanishToolTip();
        });

        // Deck div is done. Insert into destination element
        deckDestinationElement.appendChild(deckDiv);
    }
}

function ApplyColor(colorOfDiv) {
    if (colorOfDiv == 'W') {
        return '#fbe82d';
    } else if (colorOfDiv == 'U') {
        return '#2a9dff';
    } else if (colorOfDiv == 'B') {
        return '#9900cc';
    } else if (colorOfDiv == 'R') {
        return '#fa2d35';
    } else {
        return '#4de141';
    }
}

function DisplayDeckToolTip(deckElement, deck) {
    // Create stats div
    let statsDiv = document.createElement('div');
    statsDiv.setAttribute('style', 'font-size:18px;padding:10px;display:flex;flex-direction:column;align-items:center');

    // Insert stats into stats div
    let deckIdDiv = document.createElement('div');
    deckIdDiv.setAttribute("class", "TooltipStat");
    deckIdDiv.innerHTML = "ID - " + deck.deckId;
    statsDiv.appendChild(deckIdDiv);

    let stratDiv = document.createElement('div');
    stratDiv.setAttribute("class", "TooltipStat");
    stratDiv.innerHTML = "Strategy - " + deck.strat;
    statsDiv.appendChild(stratDiv);

    let podSizeDiv = document.createElement('div');
    podSizeDiv.setAttribute("class", "TooltipStat");
    podSizeDiv.innerHTML = "Pod Size - " + deck.podSize;
    statsDiv.appendChild(podSizeDiv);

    let formatDiv = document.createElement('div');
    formatDiv.setAttribute("class", "TooltipStat");
    formatDiv.innerHTML = "Format - " + deck.draftingFormat;
    statsDiv.appendChild(formatDiv);

    let avgManaValueDiv = document.createElement('div');
    avgManaValueDiv.setAttribute("class", "TooltipStat");
    avgManaValueDiv.innerHTML = "Average Mana Value - " + deck.avgManaValue;
    statsDiv.appendChild(avgManaValueDiv);

    let landsDiv = document.createElement('div');
    landsDiv.setAttribute("class", "TooltipStat");
    landsDiv.innerHTML = "Lands / Spells - " + deck.landCount + " / " + deck.nonlandCount;
    statsDiv.appendChild(landsDiv);

    // Insert stats div into tooltip
    let toolTipDiv = document.getElementById("toolTipDiv");
    toolTipDiv.innerHTML = '';
    toolTipDiv.appendChild(statsDiv);

    // Initialize tooltip properties (without location)
    toolTipDiv.setAttribute('style', 'background-color:lightgray;border:solid;border-radius:10px;opacity:0;z-index:3;width:fit-content;height:fit-content;position:absolute;display:flex;padding:10px');

    // Apply tooltip location
    toolTipTopAndLeft = FindToolTipTopAndLeft(deckElement, toolTipDiv);
    toolTipDiv.setAttribute("style", "background-color:lightgray;border:solid;border-radius:10px;opacity:0;z-index:3;position:absolute;display:flex;padding:10px;top:" + toolTipTopAndLeft[0] + "px;left:" + toolTipTopAndLeft[1] + "px");

    // Make tooltip fade in
    let op = 0.1;
    let timer = setInterval(function () {
        toolTipDiv.style.opacity = op;
        op += op * 0.1;
        if (op >= 1) {
            clearInterval(timer);
            toolTipDiv.style.opacity = 1;
        }
    }, 10);
}