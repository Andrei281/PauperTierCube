// We're on the decks filtering page. Prepare various elements...
function prepareDecksPage() {

    // Display current date for olderThanDateFilter
    document.getElementById("olderThanDateFilter").valueAsDate = new Date()

    // Acquire and apply deck info to deckId and strat select elements
    FetchAndAppendDeckDataToSelectElements(document.getElementById("olderThanDateFilter").value);

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
function FetchAndAppendDeckDataToSelectElements(olderThanDateValue) {
    fetch('/data/DeckData?olderThanDateFilter=' + olderThanDateValue, {
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
                let deckIds = GetPropertyFromDecks(decks, 'deckId', false);
                let deckStrats = GetPropertyFromDecks(decks, 'strat', true);
                ApplyDropdownInfo(document.getElementById('deckIds'), deckIds);
                ApplyDropdownInfo(document.getElementById('strats'), deckStrats);
                console.log();
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
    let newerThanDateFilterVal = document.getElementById('newerThanDateFilter').value;
    let olderThanDateFilterVal = document.getElementById('olderThanDateFilter').value;

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

    //// Acquire info for sorting filters
    //let primarySortVal = document.getElementById("primarySortInput").value;
    //let secondarySortVal = document.getElementById("secondarySortInput").value;

    // Check browser support
    if (typeof (Storage) !== "undefined") {

        // Store filter info in browser session
        let filterVals = [deckIdFilterVal, playerNameFilterVal, stratFilterVal, colorFilterVals, newerThanDateFilterVal, olderThanDateFilterVal,
            minWinsFilterVal, maxWinsFilterVal, minLossesFilterVal, maxLossesFilterVal, minAverageManaValueFilterVal, maxAverageManaValueFilterVal,
            minLandsFilterVal, maxLandsFilterVal, minNonlandsFilterVal, maxNonlandsFilterVal/*, primarySortVal, secondarySortVal*/];
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
    // Use different urls depending on whether we're using filters
    url = '/data/DeckData?deckIdFilter=' + encodeURIComponent(localStorage.getItem('filterVal0'))
        + '&playerNameFilter=' + encodeURIComponent(localStorage.getItem('filterVal1'))
        + '&stratFilter=' + encodeURIComponent(localStorage.getItem('filterVal2'))
        + '&colorFilter=' + encodeURIComponent(localStorage.getItem('filterVal3'))
        + '&newerThanDateFilter=' + encodeURIComponent(localStorage.getItem('filterVal4'))
        + '&olderThanDateFilter=' + encodeURIComponent(localStorage.getItem('filterVal5'))
        + '&minWinsFilter=' + encodeURIComponent(localStorage.getItem('filterVal6'))
        + '&maxWinsFilter=' + encodeURIComponent(localStorage.getItem('filterVal7'))
        + '&minLossesFilter=' + localStorage.getItem('filterVal8')
        + '&maxLossesFilter=' + localStorage.getItem('filterVal9')
        + '&minAverageManaValueFilter=' + localStorage.getItem('filterVal10')
        + '&maxAverageManaValueFilter=' + localStorage.getItem('filterVal11')
        + '&minLandsFilter=' + localStorage.getItem('filterVal12')
        + '&maxLandsFilter=' + localStorage.getItem('filterVal13')
        + '&minNonlandsFilter=' + localStorage.getItem('filterVal14')
        + '&maxNonlandsFilter=' + localStorage.getItem('filterVal15');
    //+ '&primarySort=' + localStorage.getItem('filterVal16')
    //+ '&secondarySort=' + localStorage.getItem('filterVal17');
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

        // Inside full deck div: Create deckID div
        let deckIDDiv = document.createElement('div');
        deckIDDiv.innerHTML = "ID: " + decks[i].deckId;
        deckDiv.appendChild(deckIDDiv);

        // Inside full deck div: Create playerName div
        let playerNameDiv = document.createElement('div');
        playerNameDiv.innerHTML = "Player: " + decks[i].playerName;
        deckDiv.appendChild(playerNameDiv);

        // Inside full deck div: Create date div
        let dateDiv = document.createElement('div');
        dateDiv.innerHTML = decks[i].datePlayed.slice(0, 10);
        deckDiv.appendChild(dateDiv);

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

        // Inside full deck div: Create wins/losses div
        let winsDiv = document.createElement('div');
        winsDiv.innerHTML = "W/L: " + decks[i].gamesWon + " / " + decks[i].gamesLost;
        deckDiv.appendChild(winsDiv);

        // Inside full deck div: Create lands/nonlands div
        let landsDiv = document.createElement('div');
        landsDiv.innerHTML = "Lands/Nonlands: " + decks[i].landCount + "/" + decks[i].nonlandCount;
        deckDiv.appendChild(landsDiv);

        // Inside full deck div: Create nonlands div
        let avgManaValueDiv = document.createElement('div');
        avgManaValueDiv.innerHTML = "Mean Mana Value: " + decks[i].avgManaValue;
        deckDiv.appendChild(avgManaValueDiv);

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