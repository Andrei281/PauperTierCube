// We're on the decks filtering page. Prepare various elements...
function prepareDecksPage() {

    // Acquire and apply deck info to deckId and strat select elements
    FetchAndAppendDeckDataToSelectElements();

    // Save height of tallest div for all content divs
    document.getElementById("genericStatsButtonContent").setAttribute("style", "display: flex");
    let divHeightToRetain = document.getElementById("genericStatsButtonContent").clientHeight;

    // Make buttons display their respective contents
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener("click", () => openTabContent(event, tablinks[i].id + "Content", divHeightToRetain));
    }
    document.getElementById("genericStatsButtonContent").click();

    // Prepare filter button
    document.getElementById("filterButton").addEventListener("click", () => GenerateFilteredDecksWindow());
}

// Fetching deck data specifically for filter dropdowns
function FetchAndAppendDeckDataToSelectElements() {

    // By default, we know we're getting info about all decks for our dropdowns
    fetch('/data/DeckData?&primarySort=DatePlayed&secondarySort=Strat&countDrafts=true', {
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
                let deckIds = GetPropertyFromDecks(deckdata[0], 'deckId', false);
                let deckStrats = GetPropertyFromDecks(deckdata[0], 'strat', true);
                ApplyDropdownInfo(document.getElementById('deckIds'), deckIds);
                ApplyDropdownInfo(document.getElementById('strats'), deckStrats);
                document.getElementById('pastDrafts').setAttribute('value', deckdata[1]);
                document.getElementById('filterButton').setAttribute('style', 'margin-top:20px;width:50%;opacity:1;pointer-events:initial');
            }
        }).catch(err => {
            if (err) { }
            alert("Error fetching data: " + err);
        });
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

// "Filter" button has been clicked. Prepare and navigate to new page
function GenerateFilteredDecksWindow() {

    // Acquire info for generic filters
    let deckIdFilterVal = document.getElementById('deckIdFilter').value;
    let playerNameFilterVal = document.getElementById('playerNameFilter').value;
    let stratFilterVal = document.getElementById('stratFilter').value;
    let colorFilterVals = AcquireFilterDivValues(document.getElementById('colorsFilter'));

    // Acquire info for numeric filters
    let minWinsFilterVal = document.getElementById('minWins').value;
    let maxWinsFilterVal = document.getElementById('maxWins').value;
    let minLossesFilterVal = document.getElementById('minLosses').value;
    let maxLossesFilterVal = document.getElementById('maxLosses').value;
    let minAverageManaValueFilterVal = document.getElementById('minAverageManaValueFilter').value;
    let maxAverageManaValueFilterVal = document.getElementById('maxAverageManaValueFilter').value;
    let minLandsFilterVal = document.getElementById('minLands').value;
    let maxLandsFilterVal = document.getElementById('maxLands').value;
    let minNonlandsFilterVal = document.getElementById('minNonlands').value;
    let maxNonlandsFilterVal = document.getElementById('maxNonlands').value;
    let pastDraftsFilterVal = document.getElementById('pastDrafts').value;

    // Acquire info for sorting filters
    let primarySortVal = document.getElementById("primarySortInput").value;
    let secondarySortVal = document.getElementById("secondarySortInput").value;

    // Check browser support
    if (typeof (Storage) !== "undefined") {

        // Store filter info in browser session
        let filterVals = [deckIdFilterVal, playerNameFilterVal, stratFilterVal, colorFilterVals, pastDraftsFilterVal, minWinsFilterVal,
            maxWinsFilterVal, minLossesFilterVal, maxLossesFilterVal, minAverageManaValueFilterVal, maxAverageManaValueFilterVal,
            minLandsFilterVal, maxLandsFilterVal, minNonlandsFilterVal, maxNonlandsFilterVal, primarySortVal, secondarySortVal];
        localStorage.clear();
        for (let i = 0; i < filterVals.length; i++) {
            localStorage.setItem("filterVal" + i, filterVals[i]);
        }

        // Navigate to new page
        window.location.assign('https://localhost:5001/Home/DecksFilterPopUp');
    }
}

// Fetch filtered decks
function FetchDeckData() {

    // Show loading icon
    let loadingGifContainer = document.createElement("div");
    loadingGifContainer.setAttribute("style", "margin: auto");
    let loadingGif = document.createElement("img");
    loadingGif.setAttribute("src", "https://www.wpfaster.org/wp-content/uploads/2013/06/loading-gif.gif");
    loadingGif.setAttribute("style", "margin: auto; width: 50px; height: 50px");
    loadingGifContainer.appendChild(loadingGif);
    document.getElementById('wrapperDiv').appendChild(loadingGifContainer);

    // Begin fetching database info
    url = '/data/DeckData?deckIdFilter=' + encodeURIComponent(localStorage.getItem('filterVal0'))
        + '&playerNameFilter=' + encodeURIComponent(localStorage.getItem('filterVal1'))
        + '&stratFilter=' + encodeURIComponent(localStorage.getItem('filterVal2'))
        + '&colorFilter=' + encodeURIComponent(localStorage.getItem('filterVal3'))
        + '&pastDraftsFilter=' + encodeURIComponent(localStorage.getItem('filterVal4'))
        + '&minWinsFilter=' + encodeURIComponent(localStorage.getItem('filterVal5'))
        + '&maxWinsFilter=' + encodeURIComponent(localStorage.getItem('filterVal6'))
        + '&minLossesFilter=' + localStorage.getItem('filterVal7')
        + '&maxLossesFilter=' + localStorage.getItem('filterVal8')
        + '&minAverageManaValueFilter=' + localStorage.getItem('filterVal9')
        + '&maxAverageManaValueFilter=' + localStorage.getItem('filterVal10')
        + '&minLandsFilter=' + localStorage.getItem('filterVal11')
        + '&maxLandsFilter=' + localStorage.getItem('filterVal12')
        + '&minNonlandsFilter=' + localStorage.getItem('filterVal13')
        + '&maxNonlandsFilter=' + localStorage.getItem('filterVal14')
        + '&primarySort=' + localStorage.getItem('filterVal15')
        + '&secondarySort=' + localStorage.getItem('filterVal16')
        + '&countDrafts=false';
    fetch(url, {
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
                loadingGifContainer.remove();
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
    document.getElementById('wrapperDiv').innerHTML = "";
    var deckCountHeader = document.createElement('div');
    deckCountHeader.setAttribute('style', 'height:8%;width:100%;background-color:white;border:3px inset gray;border-bottom:none;font-weight:bold;font-size:25px;display:flex;align-items:center;justify-content:center');
    deckCountHeader.innerHTML = 'Decks - (' + decks.length + ')';
    wrapperDiv.appendChild(deckCountHeader);

    // Create div used to display decks
    var deckDestinationElement = document.createElement('div');
    deckDestinationElement.setAttribute('class', 'DefaultDiv');

    // Fill deckDestinationElement with decks
    for (let i = 0; i < decks.length; i++) {

        // Create full deck div
        let deckDiv = document.createElement('div');
        deckDiv.setAttribute('class', 'DeckDiv');

        // Inside full deck div: Create date div
        let dateDiv = document.createElement('div');
        dateDiv.innerHTML = decks[i].datePlayed.slice(0, 10);
        deckDiv.appendChild(dateDiv);

        // Inside full deck div: Create playerName div
        let playerNameDiv = document.createElement('div');
        playerNameDiv.innerHTML = "By: " + decks[i].playerName;
        deckDiv.appendChild(playerNameDiv);

        // Inside full deck div: Create wins/losses div
        let winsDiv = document.createElement('div');
        winsDiv.innerHTML = "W/L: " + decks[i].gamesWon + " / " + decks[i].gamesLost;
        deckDiv.appendChild(winsDiv);

        // Inside full deck div: Create lands/nonlands div
        let landsDiv = document.createElement('div');
        landsDiv.innerHTML = "Lands/Spells: " + decks[i].landCount + " / " + decks[i].nonlandCount;
        deckDiv.appendChild(landsDiv);

        // Inside full deck div: Create colors div
        let colorsDiv = document.createElement('div');
        colorsDiv.setAttribute('style', 'display:flex');
        let deckColors = decks[i].colors.split('');
        for (let j = 0; j < deckColors.length; j++) {
            let colorOfDiv = deckColors[j];
            let backgroundColor = ApplyColor(colorOfDiv);
            let colorDiv = document.createElement('div');
            if (j == deckColors.length - 1) {
                colorDiv.setAttribute('style', 'border:solid;width:25px;height:25px;background-color:' + backgroundColor);
            } else {
                colorDiv.setAttribute('style', 'border:solid;width:25px;height:25px;margin-right:5px;background-color:' + backgroundColor);
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
            cardElement.style.backgroundColor = backgroundColor;
        });

        // Deck div is done. Insert into destination element
        deckDestinationElement.appendChild(deckDiv);
    }

    wrapperDiv.appendChild(deckDestinationElement);
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

    if (deck.hallOfFame) {
        let hallOfFameDiv = document.createElement('div');
        let starImage = document.createElement('img');
        starImage.setAttribute('src', '	https://opengameart.org/sites/default/files/styles/medium/public/sss_1.png');
        starImage.setAttribute('style', 'width:30px;height:30px');
        hallOfFameDiv.appendChild(starImage);
        statsDiv.appendChild(hallOfFameDiv);
    }

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