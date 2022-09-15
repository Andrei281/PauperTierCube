﻿function prepareDecksPage() {

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

// "Filter" button has been clicked. Prepare and navigate to new page
function GenerateFilteredDecksWindow() {

    // Acquire info for generic filters
    let deckIDFilterVal = document.getElementById('deckIDFilter').value;
    let playerNameFilterVal = document.getElementById('playerNameFilter').value;
    let stratFilterVal = document.getElementById('stratFilter').value;
    let colorFilterVals = AcquireFilterDivValues(document.getElementById('colorsFilter'));
    let dateFilterVal = document.getElementById('dateFilter').value;

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
        let filterVals = [deckIDFilterVal, playerNameFilterVal, stratFilterVal, colorFilterVals, dateFilterVal, minWinsFilterVal,
            maxWinsFilterVal, minLossesFilterVal, maxLossesFilterVal, minAverageManaValueFilterVal, maxAverageManaValueFilterVal,
            minLandsFilterVal, maxLandsFilterVal, minNonlandsFilterVal, maxNonlandsFilterVal/*, primarySortVal, secondarySortVal*/];
        localStorage.clear();
        for (let i = 0; i < filterVals.length; i++) {
            localStorage.setItem("filterVal" + i, filterVals[i]);
        }

        // Navigate to new page
        window.location.assign('https://localhost:5001/Home/DecksFilterPopUp');
    }
}

// New page has loaded. Fetch and display decks
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
    let url = '/data/DeckData?deckIDFilter=' + encodeURIComponent(localStorage.getItem('filterVal0'))
        + '&playerNameFilter=' + encodeURIComponent(localStorage.getItem('filterVal1'))
        + '&stratFilter=' + encodeURIComponent(localStorage.getItem('filterVal2'))
        + '&colorFilter=' + encodeURIComponent(localStorage.getItem('filterVal3'))
        + '&dateFilter=' + encodeURIComponent(localStorage.getItem('filterVal4'))
        + '&minWinsFilter=' + encodeURIComponent(localStorage.getItem('filterVal5'))
        + '&maxWinsFilter=' + encodeURIComponent(localStorage.getItem('filterVal6'))
        + '&minLossesFilter=' + localStorage.getItem('filterVal7')
        + '&maxLossesFilter=' + localStorage.getItem('filterVal8')
        + '&minAverageManaValueFilter=' + localStorage.getItem('filterVal9')
        + '&maxAverageManaValueFilter=' + localStorage.getItem('filterVal10')
        + '&minLandsFilter=' + localStorage.getItem('filterVal11')
        + '&maxLandsFilter=' + localStorage.getItem('filterVal12')
        + '&minNonlandsFilter=' + localStorage.getItem('filterVal13')
        + '&maxNonlandsFilter=' + localStorage.getItem('filterVal14');
    //+ '&primarySort=' + localStorage.getItem('filterVal15')
    //+ '&secondarySort=' + localStorage.getItem('filterVal16');
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
                FillDecksDiv(decks);
            }
        }).catch(err => {
            if (err) { }
            alert("Error fetching data: " + err);
        });
}

function FillDecksDiv(decks) {
    document.getElementById('wrapperDiv').innerHTML = "";
    var deckCountHeader = document.createElement('div');
    deckCountHeader.setAttribute('style', 'height:8%;width:100%;background-color:white;border:3px inset gray;border-bottom:none;font-weight:bold;font-size:25px;display:flex;align-items:center;justify-content:center');
    deckCountHeader.innerHTML = 'Decks - (' + decks.length + ')';
    wrapperDiv.appendChild(deckCountHeader);
    var deckDestinationElement = document.createElement('div');
    deckDestinationElement.setAttribute('class', 'DefaultDiv');

    // Fill deckDestinationElement with decks

    wrapperDiv.appendChild(deckDestinationElement);
}