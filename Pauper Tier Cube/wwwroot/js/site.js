function prepareListPage() {
    let tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].addEventListener("click", () => openTabContent(event, tablinks[i].id + "Content"));
    }
    document.getElementById("filterButton").addEventListener("click", () => GenerateFilteredCubeWindow());
    document.getElementById("minGamesPlayedFilterInput").addEventListener("change", () => ToggleWinRateAccessibility());
    ToggleWinRateAccessibility();
    document.getElementById("baseStatsButton").click();
}

function openTabContent(evt, tabContentDivId) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabContentDivId).style.display = "flex";
    evt.currentTarget.className += " active";
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
    // Get info about filters
    let primaryFilterVal = document.getElementById('primaryFilterInput').value;
    let nameFilterVal = document.getElementById('nameFilterInput').value;
    let tierFilterElement = document.getElementById('tierFilterInput');
    let tierFilterVals = []
        .filter.call(tierFilterElement.childNodes, function (childNode) { return (childNode.nodeName === 'INPUT') && childNode.checked; })
        .map(function (childNode) { return childNode.value; });
    let colorIdentityFilterElement = document.getElementById('colorIdentityFilterInput');
    let colorIdentityFilterVals = []
        .filter.call(colorIdentityFilterElement.childNodes, function (childNode) { return (childNode.nodeName === 'INPUT') && childNode.checked; })
        .map(function (childNode) { return childNode.value; });
    let minManaValueFilterVal = document.getElementById('minManaValueFilterInput').value;
    let maxManaValueFilterVal = document.getElementById('maxManaValueFilterInput').value;
    let typeFilterElement = document.getElementById('typeFilterInput');
    let typeFilterVals = []
        .filter.call(typeFilterElement.childNodes, function (childNode) { return (childNode.nodeName === 'INPUT') && childNode.checked; })
        .map(function (childNode) { return childNode.value; });
    let draftabilityStatusFilterElement = document.getElementById('draftabilityStatusFilterInput');
    let draftabilityStatusFilterVals = []
        .filter.call(draftabilityStatusFilterElement.childNodes, function (childNode) { return (childNode.nodeName === 'INPUT') && childNode.checked; })
        .map(function (childNode) { return childNode.value; });
    let displayFilterVal = document.getElementById('displayFilterInput').value;

    let minWinRateFilterVal = document.getElementById('minWinRateFilterInput').value;
    let maxWinRateFilterVal = document.getElementById('maxWinRateFilterInput').value;
    let minGamesPlayedFilterVal = document.getElementById('minGamesPlayedFilterInput').value;
    let maxGamesPlayedFilterVal = document.getElementById('maxGamesPlayedFilterInput').value;

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
        window.location.assign('https://localhost:5001/Home/FilterPopUp');
    }
}

// New page has loaded. Fetch and display cards
function FetchCardData() {
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
        fillWithText(cards, cardDestinationElement, "width:max-content;margin-right:20px;float:left");
    } else if (displayFilter == 'images') {
        cardDestinationElement.setAttribute('style', 'padding-bottom:0px');
        fillWithImages(cards, cardDestinationElement, 'width:215px;margin-right:10px;margin-bottom:10px;float:left');
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
    cardCountArea.setAttribute('style', 'font-weight:bold;text-align:center;height:5%;border:3px inset gray;border-bottom:none;display:flex;background-color:' + divColor);
    let cardCountDiv = document.createElement('div');
    cardCountDiv.setAttribute('style', 'width:100%;text-align:center;align-self:center');
    cardCountDiv.innerHTML = tier + ' - (' + cardsForThisDiv.length + ')';
    cardCountArea.appendChild(cardCountDiv);
    cardDestinationWrapper.appendChild(cardCountArea);

    // Put card area in tier div
    let cardDestinationElement = document.createElement('div');
    cardDestinationElement.setAttribute('class', 'TierDiv');
    if (displayFilter == 'text') {
        fillWithText(cardsForThisDiv, cardDestinationElement, null);
    } else if (displayFilter == 'images') {
        cardDestinationElement.setAttribute('style', 'padding-bottom:0px')
        fillWithImages(cardsForThisDiv, cardDestinationElement, 'width:80%;margin-bottom:10px')
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
        fillWithText(cardsForThisDiv, cardArea, null);
    } else if (cardDisplayFilter == 'images') {
        fillWithImages(cardsForThisDiv, cardArea, 'width:95%;margin-bottom:10px');
    }
    cardAreaWithColor.appendChild(cardArea);
    fullColorIdentityColumn.appendChild(cardAreaWithColor);

    // Put the full color identity column in the wrapper
    wrapperDiv.appendChild(fullColorIdentityColumn);

    // Initialize the visibility of the color identity column (we input the opposite of what we want to get what we want)
    ToggleColorIdentityDivVisibility(fullColorIdentityColumn);
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

function GenerateRandomPackWindow() {
    let height = 0.75 * window.screen.height;
    let width = 0.60 * window.screen.width;
    let left = 0.2 * window.screen.width;
    let top = 0.125 * window.screen.height;
    window.location.assign('https://localhost:5001/Home/PackPopUp', 'randomPackPopUp', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
}

function GenerateRandomPack() {
    // Readjust styling for certain, generated, parent div during runtime
    let containerDivs = document.getElementsByClassName("container");
    for (i = 0; i < containerDivs.length; i++) {
        if (containerDivs[i].parentElement == document.body) {
            containerDivs[i].setAttribute("style", "margin-left:0px;padding:0px");
            break;
        }
    }

    // Define card-sizing properties
    const cardMargin = 5;
    const cardWidth = 215;
    let cardStyle = 'margin:' + cardMargin + 'px;width:' + cardWidth + 'px;float:unset'

    // Use ^^ properties to define parent div widths
    setGeneratedPackDivWidths(cardMargin, cardWidth);

    // Fetch 5 random bronzes, 10 random silvers, and 5 random golds
    let tiers = ["bronze", "silver", "gold"];
    for (let i = 0; i < tiers.length; i++) {
        if (tiers[i] == "bronze") {
            let bronzeSection = document.getElementById("bronzeSection");
            FetchRandomPackData(tiers[i], 5, cardStyle, bronzeSection);
        } else if (tiers[i] == "silver") {
            let silverSection = document.getElementById("silverSection");
            FetchRandomPackData(tiers[i], 10, cardStyle, silverSection);
        } else if (tiers[i] == "gold") {
            let goldSection = document.getElementById("goldSection");
            FetchRandomPackData(tiers[i], 5, cardStyle, goldSection);
        }
    }
}

function setGeneratedPackDivWidths(cardMargin, cardWidth) {
    let cssObj = window.getComputedStyle(document.getElementById("bronzeSection"), null);
    let divPadding = parseInt(cssObj.getPropertyValue("padding").slice(0, 1));
    let divBorderWidth = parseInt(cssObj.getPropertyValue("border-width").slice(0, 1));
    let packDivWidth = 5 * (2 * cardMargin + cardWidth) + 2 * (divPadding + divBorderWidth);

    document.getElementById("bronzeSection").setAttribute("style", "width:" + packDivWidth + "px;background-color:#EFA67D");
    document.getElementById("silverSection").setAttribute("style", "width:" + packDivWidth + "px;background-color:#DBDAD9");
    document.getElementById("goldSection").setAttribute("style", "width:" + packDivWidth + "px;background-color:#F2E979BF;margin-bottom:0px");
}

function FetchRandomPackData(tier, maxResults, cardStyle, cardDestination) {
    let url = '/data/LoadRandomPackData?tierFilter=' + tier
        + '&maxResults=' + maxResults;
    fetch(url, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', // no-cors, *cors, same-origin
    })
        .then(res => {
            if (res.status == 200) {
                return res.json();
            } else { throw "Error fetching data: " + res; }
        })
        .then(cards => {
            if (cards) {
                if (!Array.isArray(cards)) {
                    throw 'cards in server response is not an array.'
                }
                fillWithImages(cards, cardDestination, cardStyle);
            }
        }).catch(err => {
            if (err) { }
            alert("Error fetching data: " + err);
        });
}

function fillWithText(cards, cardDestinationElement, cardStyle) {
    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        let cardElement = document.createElement('div');
        cardElement.setAttribute('class', 'CardListItem');
        if (cardStyle) {
            cardElement.setAttribute('style', cardStyle);
        }
        cardElement.innerHTML = card.name;
        // Apply tooltip capabilities
        var timeOut;
        cardElement.addEventListener("mouseenter", function () {
            let that = this;
            //timeOut = setTimeout(function () { DisplayToolTip(that, card.image) }, 400);
            timeOut = setTimeout(function () { DisplayToolTip(that, card) }, 400);
        });
        cardElement.addEventListener("mouseleave", function () {
            clearTimeout(timeOut);
            VanishToolTip();
        });
        cardDestinationElement.appendChild(cardElement);
    }
}

function fillWithImages(cards, cardDestinationElement, cardStyle) {
    for (let index = 0; index < cards.length; index++) {
        let card = cards[index];
        if (card.image) {
            let cardImgElement = document.createElement('img');
            cardImgElement.setAttribute('style', cardStyle);
            cardImgElement.src = 'data:image/jpg;base64,' + card.image;
            // Apply tooltip capabilities
            var timeOut;
            cardImgElement.addEventListener("mouseenter", function () {
                let that = this;
                //timeOut = setTimeout(function () { DisplayToolTip(that, card.image) }, 400);
                timeOut = setTimeout(function () { DisplayToolTip(that, card) }, 400);
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

function DisplayToolTip(cardElement, fullCard) {
    let cardElementPosition = GetAbsolutePosition(cardElement);
    let imageWidth = 250;
    let imageHeight = imageWidth * 1.4;

    // Initialize tooltip properties
    let toolTipDiv = document.getElementById("toolTipDiv");
    let toolTipPadding = 5;
    let toolTipWidth = imageWidth + (2 * toolTipPadding);
    let toolTipLeft = ((cardElementPosition.left + cardElementPosition.right) / 2) - (toolTipWidth / 2);

    // If too high on screen, position tooltip below cursor
    let toolTipHeight = imageHeight + (2 * toolTipPadding);
    let toolTipTop = cardElementPosition.top - toolTipHeight;
    if (toolTipTop < 0) {
        toolTipTop = cardElementPosition.bottom + toolTipPadding;
    }

    // Create image
    let cardImg = document.createElement('img');
    cardImg.src = 'data:image/jpg;base64,' + fullCard.image;
    cardImg.setAttribute('style', 'width:' + imageWidth + 'px');

    // Create stats div
    let statsDiv = document.createElement('div');
    statsDiv.setAttribute('style', 'font-size:18px;height:fit-content;background-color:lightgray;margin-left:10px;padding:10px;border-radius:10px;border:solid;display:flex;flex-direction:column;align-items:center');
    let tierDiv = document.createElement('div');
    tierDiv.innerHTML = "Tier - " + fullCard.tier;
    statsDiv.appendChild(tierDiv);
    let gamesPlayedStatsDiv = document.createElement('div');
    gamesPlayedStatsDiv.innerHTML = "Games Played - " + fullCard.gamesPlayed;
    statsDiv.appendChild(gamesPlayedStatsDiv);
    // Only attempt to show win rate percentage if it exists
    let winRatePercentageStatsDiv = document.createElement('div');
    if (fullCard.winRatePercentage != null) {
        winRatePercentageStatsDiv.innerHTML = "Win Rate - " + fullCard.winRatePercentage.toFixed(2) + "%";
    } else {
        winRatePercentageStatsDiv.innerHTML = "Win Rate - N/A";
    }
    statsDiv.appendChild(winRatePercentageStatsDiv);

    // Insert image and stats into tooltip
    toolTipDiv.innerHTML = '';
    toolTipDiv.appendChild(cardImg);
    toolTipDiv.appendChild(statsDiv);

    toolTipDiv.setAttribute('style', 'opacity:0;z-index:3;width:fit-content;position:absolute;display:flex;padding:' + toolTipPadding + 'px;top:' + toolTipTop + 'px;left:' + toolTipLeft + 'px');
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

function VanishToolTip() {
    document.getElementById("toolTipDiv").innerHTML = '';
    toolTipDiv.style.opacity = 0;
}

function GetAbsolutePosition(element) {
    let pos = element.getBoundingClientRect();
    pos = {
        left: pos.left,
        right: pos.right,
        top: pos.top,
        bottom: pos.bottom,
    };
    let sx = window.scrollX ? window.scrollX : window.pageXOffset;
    let sy = window.scrollY ? window.scrollY : window.pageYOffset;
    pos.left += sx;
    pos.right += sx;
    pos.top += sy;
    pos.bottom += sy;
    return pos;
}