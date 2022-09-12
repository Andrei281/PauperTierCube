function prepareDecksPage() {
    document.getElementById("filterButton").addEventListener("click", () => GenerateFilteredDecksWindow());
}

// "Filter" button has been clicked. Prepare and navigate to new page
function GenerateFilteredCubeWindow() {
    // Acquire info for base stats filters
    let primaryFilterVal = document.getElementById('primaryFilterInput').value;
    let nameFilterVal = document.getElementById('nameFilterInput').value;
    let tierFilterVals = AcquireFilterDivValues(document.getElementById('tierFilterInput'));
    let colorIdentityFilterVals = AcquireFilterDivValues(document.getElementById('colorIdentityFilterInput'));
    let minManaValueFilterVal = document.getElementById('minManaValueFilterInput').value;
    let maxManaValueFilterVal = document.getElementById('maxManaValueFilterInput').value;
    let typeFilterVals = AcquireFilterDivValues(document.getElementById('typeFilterInput'));
    let draftabilityStatusFilterVals = AcquireFilterDivValues(document.getElementById('draftabilityStatusFilterInput'));
    let displayFilterVal = document.getElementById('displayFilterInput').value;

    // Acquire info for game stats filters
    let minGamesPlayedFilterVal = document.getElementById('minGamesPlayedFilterInput').value;
    let maxGamesPlayedFilterVal = document.getElementById('maxGamesPlayedFilterInput').value;
    let minWinRateFilterVal = document.getElementById('minWinRateFilterInput').value;
    let maxWinRateFilterVal = document.getElementById('maxWinRateFilterInput').value;

    // Acquire info for sorting filters
    let primarySortVal = document.getElementById("primarySortInput").value;
    let secondarySortVal = document.getElementById("secondarySortInput").value;

    // Check browser support
    if (typeof (Storage) !== "undefined") {
        // Store filter info in browser session
        let filterVals = [primaryFilterVal, displayFilterVal, nameFilterVal, colorIdentityFilterVals, minManaValueFilterVal, maxManaValueFilterVal,
            typeFilterVals, tierFilterVals, draftabilityStatusFilterVals, minWinRateFilterVal, maxWinRateFilterVal, minGamesPlayedFilterVal,
            maxGamesPlayedFilterVal, primarySortVal, secondarySortVal];
        for (let i = 0; i < filterVals.length; i++) {
            localStorage.setItem("filterVal" + i, filterVals[i]);
        }
        // Navigate to new page
        window.location.assign('https://localhost:5001/Home/ListFilterPopUp');
    }
}

function AcquireFilterDivValues(filterDiv) {
    let itemReturnList = [];
    for (let childElementIndex = 0; childElementIndex < filterDiv.children.length; childElementIndex++) {
        for (let grandchildElementIndex = 0; grandchildElementIndex < filterDiv.children[childElementIndex].childNodes.length; grandchildElementIndex++) {
            if (filterDiv.children[childElementIndex].childNodes[grandchildElementIndex].nodeName == "INPUT" && filterDiv.children[childElementIndex].childNodes[grandchildElementIndex].checked) {
                let returnItem = filterDiv.children[childElementIndex].childNodes[grandchildElementIndex].value;
                itemReturnList.push(returnItem);
            }
        }
    }
    return itemReturnList;
}

// New page has loaded. Fetch and display cards
function FetchCardData() {
    // Show loading icon
    let loadingGifContainer = document.createElement("div");
    loadingGifContainer.setAttribute("style", "margin: auto");
    let loadingGif = document.createElement("img");
    loadingGif.setAttribute("src", "https://www.wpfaster.org/wp-content/uploads/2013/06/loading-gif.gif");
    loadingGif.setAttribute("style", "margin: auto; width: 50px; height: 50px");
    loadingGifContainer.appendChild(loadingGif);
    document.getElementById('wrapperDiv').appendChild(loadingGifContainer);

    // Begin fetching database info
    let primaryFilter = localStorage.getItem('filterVal0');
    let displayFilter = localStorage.getItem('filterVal1');
    let url = '/data/CubeData?nameFilter=' + encodeURIComponent(localStorage.getItem('filterVal2'))
        + '&colorIdentityFilter=' + encodeURIComponent(localStorage.getItem('filterVal3'))
        + '&minManaValueFilter=' + encodeURIComponent(localStorage.getItem('filterVal4'))
        + '&maxManaValueFilter=' + encodeURIComponent(localStorage.getItem('filterVal5'))
        + '&typeFilter=' + encodeURIComponent(localStorage.getItem('filterVal6'))
        + '&tierFilter=' + encodeURIComponent(localStorage.getItem('filterVal7'))
        + '&draftabilityFilter=' + encodeURIComponent(localStorage.getItem('filterVal8'))
        + '&displayFilter=' + encodeURIComponent(displayFilter)
        + '&minWinRateFilter=' + localStorage.getItem('filterVal9')
        + '&maxWinRateFilter=' + localStorage.getItem('filterVal10')
        + '&minGamesPlayedFilter=' + localStorage.getItem('filterVal11')
        + '&maxGamesPlayedFilter=' + localStorage.getItem('filterVal12')
        + '&primarySort=' + localStorage.getItem('filterVal13')
        + '&secondarySort=' + localStorage.getItem('filterVal14');
    fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', // no-cors, *cors, same-origin
    })
        .then(res => {
            if (res.status == 200) {
                return res.json();
            } else { throw "Error fetching cards: " + res; }
        })
        .then(cards => {
            if (cards) {
                if (!Array.isArray(cards)) throw 'cards in server response is not an array.'
                if (primaryFilter == 'none') {
                    // Default page structure: Display all cards in one div
                    document.getElementById('wrapperDiv').innerHTML = "";
                    FillNoneDiv(cards, displayFilter);
                } else if (primaryFilter == 'tier') {
                    // Alternative page structure: Separate cards into different divs by tier
                    document.getElementById('wrapperDiv').innerHTML = "";
                    FillTierDiv('Bronze', cards, '#EFA67D', true, displayFilter);
                    FillTierDiv('Silver', cards, '#DBDAD9', null, displayFilter);
                    FillTierDiv('Gold', cards, '#F2E979BF', null, displayFilter);
                } else if (primaryFilter == 'colorIdentity') {
                    // Alternative page structure: Separate cards into different divs by color identity
                    document.getElementById('wrapperDiv').innerHTML = "";
                    FillColorIdentityDiv('#ffff80', '#ffffe6', 'W', cards, displayFilter, 'shrunk'); // These are initialized opposite of how they will appear, due to the nature of ToggleColorIdentityDivVisibility()
                    FillColorIdentityDiv('#99ddff', '#e6ffff', 'U', cards, displayFilter, 'shrunk');
                    FillColorIdentityDiv('#df9fdf', '#f3e6ff', 'B', cards, displayFilter, 'shrunk');
                    FillColorIdentityDiv('#ff8080', '#ffe6e6', 'R', cards, displayFilter, 'visible');
                    FillColorIdentityDiv('#99ff99', '#e6ffe6', 'G', cards, displayFilter, 'visible');
                    FillColorIdentityDiv('#fed793', '#ffe0cc', 'Multiple', cards, displayFilter, 'visible');
                    FillColorIdentityDiv('#DBDAD9', '#e0e0eb', 'Colorless', cards, displayFilter, 'visible');
                }
            }
        }).catch(err => {
            if (err) { }
            alert("Error fetching data: " + err);
        });
}

function FillNoneDiv(cards, displayFilter) {
    var cardCountHeader = document.createElement('div');
    cardCountHeader.setAttribute('style', 'position:absolute;height:8%;width:100%;background-color:white;border:3px inset gray;border-bottom:none;display:flex');
    var cardCountDestinationElement = document.createElement('div');
    cardCountDestinationElement.setAttribute('style', 'font-weight:bold;font-size:25px;text-align:center;width:100%;align-self:center')
    cardCountHeader.appendChild(cardCountDestinationElement)
    cardCountDestinationElement.innerHTML = 'Cards - (' + cards.length + ')';
    wrapperDiv.appendChild(cardCountHeader);
    var cardDestinationElement = document.createElement('div');
    cardDestinationElement.setAttribute('class', 'NoneDiv');
    wrapperDiv.appendChild(cardDestinationElement);
    if (displayFilter == 'text') {
        FillWithText(cards, cardDestinationElement, "width:max-content;margin-right:20px;float:left");
    } else if (displayFilter == 'images') {
        cardDestinationElement.setAttribute('style', 'padding-bottom:0px');
        FillWithImages(cards, cardDestinationElement, 'width: 215px; height: 301px; cursor: pointer; margin-bottom: 10px;');
    }
}

// For color identity div card-count-area: convert color char to string
function getFullColorIdentityWord(colorIdentity) {
    if (colorIdentity == 'W') {
        return 'White';
    }
    else if (colorIdentity == 'U') {
        return 'Blue';
    }
    else if (colorIdentity == 'B') {
        return 'Black';
    }
    else if (colorIdentity == 'R') {
        return 'Red';
    }
    else if (colorIdentity == 'G') {
        return 'Green';
    }
    else {
        return colorIdentity;
    }
}