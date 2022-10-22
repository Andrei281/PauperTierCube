﻿function prepareListPage() {
    // Save height of tallest div for all content divs
    document.getElementById("baseStatsButtonContent").setAttribute("style", "display: initial");
    let divHeightToRetain = document.getElementById("baseStatsButtonContent").clientHeight;

    // Make buttons display their respective contents
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener("click", () => openTabContent(event, tablinks[i].id + "Content", divHeightToRetain));
    }

    // Misc
    document.getElementById("filterButton").addEventListener("click", () => GenerateFilteredCubeWindow());
    document.getElementById("minGamesPlayedFilterInput").addEventListener("change", () => ToggleWinRateAccessibility());
    ToggleWinRateAccessibility();
    document.getElementById("baseStatsButton").click();
}

// If minGames filter = 0, keep win rate filter inaccessible
function ToggleWinRateAccessibility() {
    if (document.getElementById("minGamesPlayedFilterInput").value == "0") {
        document.getElementById("winRateFilterDiv").setAttribute("style", "opacity: 0.6; pointer-events: none; width: 100px");
        document.getElementById("minWinRateFilterInput").value = "0";
        document.getElementById("maxWinRateFilterInput").value = "100";
    } else {
        document.getElementById("winRateFilterDiv").setAttribute("style", "opacity: 1; pointer-events: auto; width: 100px");
    }
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
        localStorage.clear();
        for (let i = 0; i < filterVals.length; i++) {
            localStorage.setItem("filterVal" + i, filterVals[i]);
        }
        // Navigate to new page
        window.location.assign('https://localhost:5001/Home/ListFilterPopUp');
    }
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
    let url = '/data/CardData?nameFilter=' + encodeURIComponent(localStorage.getItem('filterVal2'))
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
                if (primaryFilter == 'default') {
                    document.getElementById('wrapperDiv').innerHTML = "";

                    // Default page structure: Display all cards in one div
                    FillDefaultDiv(cards, displayFilter);
                } else if (primaryFilter == 'tier') {
                    document.getElementById('wrapperDiv').innerHTML = "";

                    // Alternative page structure: Separate cards into different divs by tier
                    FillTierDiv('Bronze', cards, '#EFA67D', true, displayFilter);
                    FillTierDiv('Silver', cards, '#DBDAD9', null, displayFilter);
                    FillTierDiv('Gold', cards, '#F2E979BF', null, displayFilter);
                } else if (primaryFilter == 'colorIdentity') {
                    document.getElementById('wrapperDiv').innerHTML = "";

                    // Alternative page structure: Separate cards into different divs by color identity
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

function FillDefaultDiv(cards, displayFilter) {

    // Create title div used to count cards
    var cardCountHeader = document.createElement('div');
    cardCountHeader.setAttribute('style', 'height:8%;width:100%;background-color:white;border:3px inset gray;border-bottom:none;font-weight:bold;font-size:25px;display:flex;align-items:center;justify-content:center');
    cardCountHeader.innerHTML = 'Cards - (' + cards.length + ')';
    wrapperDiv.appendChild(cardCountHeader);

    // Create div used to display decks
    var cardDestinationElement = document.createElement('div');
    cardDestinationElement.setAttribute('class', 'DefaultDiv');
    wrapperDiv.appendChild(cardDestinationElement);

    // Display cards as either text or images
    if (displayFilter == 'text') {
        FillWithText(cards, cardDestinationElement, "width:max-content;margin-right:20px;float:left");
    } else if (displayFilter == 'images') {
        cardDestinationElement.setAttribute('style', 'padding-bottom:0px');
        FillWithImages(cards, cardDestinationElement, 'width: 215px; height: 301px; cursor: pointer; margin-bottom: 10px;');
    }
}

function FillTierDiv(tier, cards, divColor, firstDivStatus, displayFilter) {

    // We only want cards that fit the specified tier
    cardsForThisDiv = FilterCardsForSpecificDiv("tier", tier, cards);

    // Initialize full tier div
    var cardDestinationWrapper = document.createElement('div');
    if (firstDivStatus) {
        cardDestinationWrapper.setAttribute('style', 'width:32.66%');
    } else cardDestinationWrapper.setAttribute('style', 'margin-left:1%;width:32.66%');

    // Put card-count area in tier div
    let cardCountArea = document.createElement('div');
    cardCountArea.setAttribute('style', 'font-weight:bold;text-align:center;height:5%;border:3px inset gray;border-bottom:none;display:flex;align-items:center;justify-content:center;background-color:' + divColor);
    cardCountArea.innerHTML = tier + ' - (' + cardsForThisDiv.length + ')';
    cardDestinationWrapper.appendChild(cardCountArea);

    // Put card area in tier div
    let cardDestinationElement = document.createElement('div');
    cardDestinationElement.setAttribute('class', 'TierDiv');
    if (displayFilter == 'text') {
        FillWithText(cardsForThisDiv, cardDestinationElement, "");
    } else if (displayFilter == 'images') {
        cardDestinationElement.setAttribute('style', 'padding-bottom:0px')
        FillWithImages(cardsForThisDiv, cardDestinationElement, 'width: 80%; margin-bottom: 10px; cursor: pointer')
    }
    cardDestinationWrapper.appendChild(cardDestinationElement);

    // Put the full tier div in the wrapper
    wrapperDiv.appendChild(cardDestinationWrapper);
}

function FillColorIdentityDiv(cardCountDivColor, cardDivColor, colorIdentity, cards, cardDisplayFilter, visibility) {

    // We only want cards that fit the specified color identity
    let cardsForThisDiv = FilterCardsForSpecificDiv("colorIdentity", colorIdentity, cards)

    // Initialize the color identity column
    var fullColorIdentityColumn = document.createElement('div');
    fullColorIdentityColumn.setAttribute('class', 'CIDiv');
    fullColorIdentityColumn.setAttribute('visibility', visibility);
    fullColorIdentityColumn.addEventListener('click', function () { ToggleColorIdentityDivVisibility(fullColorIdentityColumn) });
    fullColorIdentityColumn.addEventListener('mouseenter', function () { ToggleColorIdentityDivHighlight(fullColorIdentityColumn, 'mouseEnter') });
    fullColorIdentityColumn.addEventListener('mouseleave', function () { ToggleColorIdentityDivHighlight(fullColorIdentityColumn, 'mouseLeave') });

    // Put card-count area in color identity column
    var cardCountAreaWithColor = document.createElement('div');
    cardCountAreaWithColor.setAttribute('style', 'height:5%;width:100%;background-color:' + cardCountDivColor);
    var cardCountArea = document.createElement('div');
    cardCountArea.setAttribute('style', 'height:100%;display:flex')
    var cardCountDiv = document.createElement('div');
    cardCountDiv.setAttribute('style', 'width:100%;text-align:center;align-self:center');
    let colorIdentityFullWord = getFullColorIdentityWord(colorIdentity);
    cardCountDiv.innerHTML = colorIdentityFullWord + ' - (' + cardsForThisDiv.length + ')';
    cardCountArea.appendChild(cardCountDiv);
    cardCountAreaWithColor.appendChild(cardCountArea);
    fullColorIdentityColumn.appendChild(cardCountAreaWithColor);

    // Put card area in color identity column
    var cardAreaWithColor = document.createElement('div');
    cardAreaWithColor.setAttribute('style', 'height:95%;width:100%;text-align:center;overflow-y:scroll;padding-top:20px;padding-bottom:20px;background-color:' + cardDivColor);
    var cardArea = document.createElement('div');
    cardArea.setAttribute('style', 'visibility:hidden');
    if (cardDisplayFilter == 'text') {
        FillWithText(cardsForThisDiv, cardArea, "");
    } else if (cardDisplayFilter == 'images') {
        FillWithImages(cardsForThisDiv, cardArea, 'width: 95%; margin-bottom: 10px; cursor: pointer');
    }
    cardAreaWithColor.appendChild(cardArea);
    fullColorIdentityColumn.appendChild(cardAreaWithColor);

    // Put the full color identity column in the wrapper
    wrapperDiv.appendChild(fullColorIdentityColumn);

    // Initialize the visibility of the color identity column (we input the opposite of what we want to get what we want)
    ToggleColorIdentityDivVisibility(fullColorIdentityColumn);
}

function ToggleColorIdentityDivVisibility(fullColorIdentityColumn) {
    visibility = fullColorIdentityColumn.getAttribute('visibility');
    if (visibility == 'visible') {
        // Calculate the number of other expanded divs
        cIDivs = document.getElementsByClassName('CIDiv');
        let visibleDivs = []
        for (let i = 0; i < cIDivs.length; i++) {
            if (cIDivs[i].getAttribute('visibility').includes('visible')) {
                visibleDivs.push(cIDivs[i])
            }
        }
        let otherVisibleDivs = visibleDivs.length - 1
        // We'll only shrink this div if there are at least 3 other expanded divs
        if (otherVisibleDivs >= 3) {
            fullColorIdentityColumn.setAttribute('visibility', 'shrunk');
            fullColorIdentityColumn.setAttribute('style', 'width:7%;height:100%');
            fullColorIdentityColumn.children[0].children[0].style['visibility'] = 'hidden';
            fullColorIdentityColumn.children[1].children[0].style['visibility'] = 'hidden';
            fullColorIdentityColumn.children[1].style['overflow'] = 'hidden';
        }
    } else if (visibility == 'shrunk') {
        // No upper limit on number of expanded divs, so we'll just expand this div
        fullColorIdentityColumn.setAttribute('visibility', 'visible');
        fullColorIdentityColumn.setAttribute('style', 'width:24%;height:100%');
        fullColorIdentityColumn.children[0].children[0].style['visibility'] = 'visible';
        fullColorIdentityColumn.children[1].children[0].style['visibility'] = 'visible';
        fullColorIdentityColumn.children[1].style['overflow-y'] = 'scroll';
    }
}

function ToggleColorIdentityDivHighlight(fullColorIdentityColumn, mouseMovement) {
    visibility = fullColorIdentityColumn.getAttribute('visibility')
    // Only shrunken color identity divs should get highlighted
    if (visibility == 'shrunk') {
        if (mouseMovement == 'mouseEnter') {
            // Highlight color identity div
            fullColorIdentityColumn.setAttribute('style', 'width:7%;height:100%;opacity:0.5');
        } else if (mouseMovement == 'mouseLeave') {
            // De-highlight color identity div
            fullColorIdentityColumn.setAttribute('style', 'width:7%;height:100%');
        }
    }
}

function FilterCardsForSpecificDiv(filterType, filterVal, cards) {
    let cardsToReturn = [];
    for (let i = 0; i < cards.length; i++) {
        if (cards[i][filterType] == filterVal) {
            cardsToReturn.push(cards[i])
        }
    }
    return cardsToReturn;
}

function FillWithText(cards, cardDestinationElement, cardStyle) {
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let cardElement = document.createElement('div');
        cardElement.setAttribute('class', 'CardListItem');

        // Initialize card background-color based on tier
        let backgroundColor;
        if (card.tier == "Bronze") {
            backgroundColor = "#EFA67D";
        } else if (card.tier == "Silver") {
            backgroundColor = "#DBDAD9";
        } else {
            backgroundColor = "#F2E979BF";
        }
        cardElement.setAttribute('style', cardStyle + "; background-color: " + backgroundColor);
        cardElement.innerHTML = card.name;

        // Apply tooltip capabilities
        var timeOut;
        cardElement.addEventListener("mouseenter", function () {
            let that = this;
            cardElement.style.backgroundColor = "lightgray";
            timeOut = setTimeout(function () { DisplayCardToolTip(that, card) }, 400);
        });
        cardElement.addEventListener("mouseleave", function () {
            clearTimeout(timeOut);
            VanishToolTip();
            cardElement.style.backgroundColor = backgroundColor;
        });
        cardDestinationElement.appendChild(cardElement);
    }
}

function FillWithImages(cards, cardDestinationElement, cardStyle) {
    for (let index = 0; index < cards.length; index++) {
        let card = cards[index];
        if (card.image) {
            let cardImgElement = document.createElement('img');

            // Initialize card border color based on tier
            let borderStyle = "; border-radius: 10px; border: solid 8px ";
            if (card.tier == "Bronze") {
                borderStyle += "#EFA67D";
            } else if (card.tier == "Silver") {
                borderStyle += "#DBDAD9";
            } else {
                borderStyle += "#e8e079";
            }
            cardImgElement.setAttribute('style', cardStyle + borderStyle);
            cardImgElement.src = 'data:image/jpg;base64,' + card.image;

            // Apply tooltip capabilities
            var timeOut;
            cardImgElement.addEventListener("mouseenter", function () {
                let that = this;
                timeOut = setTimeout(function () { DisplayCardToolTip(that, card) }, 400);
            });
            cardImgElement.addEventListener("mouseleave", function () {
                clearTimeout(timeOut);
                VanishToolTip();
            });
            cardDestinationElement.appendChild(cardImgElement);
        } else {
            throw 'Something went wrong.';
        }
    }
}

function DisplayCardToolTip(cardElement, fullCard) {
    // Create image
    let cardImg = document.createElement('img');
    cardImg.src = 'data:image/jpg;base64,' + fullCard.image;
    cardImg.setAttribute('style', 'width: 250px; height: 350px');

    // Create stats div
    let statsDiv = document.createElement('div');
    statsDiv.setAttribute('style', 'font-size: 18px; height: fit-content; margin-left: 10px; padding: 10px; display: flex; flex-direction: column; align-items: center');
    let gamesPlayedStatsDiv = document.createElement('div');
    gamesPlayedStatsDiv.innerHTML = "Games Played - " + fullCard.gamesPlayed;
    statsDiv.appendChild(gamesPlayedStatsDiv);
    let winRatePercentageStatsDiv = document.createElement('div');
    if (fullCard.winRatePercentage != null) {
        // Win rate percentage exists. Show it
        winRatePercentageStatsDiv.innerHTML = "Win Rate - " + fullCard.winRatePercentage.toFixed(2) + "%";
    } else {
        // Win rate percentage does not exist. Don't show it
        winRatePercentageStatsDiv.innerHTML = "Win Rate - N/A";
    }
    statsDiv.appendChild(winRatePercentageStatsDiv);

    // Insert image and stats into tooltip
    let toolTipDiv = document.getElementById("toolTipDiv");
    toolTipDiv.innerHTML = '';
    toolTipDiv.appendChild(cardImg);
    toolTipDiv.appendChild(statsDiv);

    // Initialize tooltip properties (without location and background-color)
    toolTipDiv.setAttribute('style', 'border:solid;border-radius:10px;opacity:0;z-index:3;width:fit-content;height:fit-content;position:absolute;display:flex;padding:10px');

    // Find tooltip location and background-color
    toolTipTopAndLeft = FindToolTipTopAndLeft(cardElement, toolTipDiv);
    let backgroundColor = "";
    if (fullCard.tier == "Bronze") {
        backgroundColor = "#EFA67D";
    } else if (fullCard.tier == "Silver") {
        backgroundColor = "#DBDAD9";
    } else {
        backgroundColor = "#e8e079";
    }

    // Apply final tooltip properties (with location and background-color)
    toolTipDiv.setAttribute("style", "background-color:" + backgroundColor + ";border:solid;border-radius:10px;opacity:0;z-index:3;width:fit-content;position:absolute;display:flex;padding:10px;top:" + toolTipTopAndLeft[0] + "px;left:" + toolTipTopAndLeft[1] + "px");

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