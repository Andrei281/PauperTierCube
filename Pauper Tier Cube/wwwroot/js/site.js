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

    let maxResults = 10000;

    let filterVals = [primaryFilterVal, nameFilterVal, tierFilterVals, colorIdentityFilterVals, minManaValueFilterVal, maxManaValueFilterVal, typeFilterVals, draftabilityStatusFilterVals, displayFilterVal, maxResults];

    // Check browser support
    if (typeof (Storage) !== "undefined") {
        // Store filter info in browser session
        for (let i = 0; i < filterVals.length; i++) {
            localStorage.setItem("filterVal" + i, filterVals[i]);
        }

        // Navigate to new page
        window.location.assign('https://localhost:5001/Home/FilterPopUp');
    }
}

function PrepareFetchCardData() {
    let primaryFilterVal = localStorage.getItem('filterVal0');
    let nameFilterVal = localStorage.getItem('filterVal1');
    let tierFilterVals = localStorage.getItem('filterVal2');
    let colorIdentityFilterVals = localStorage.getItem('filterVal3');
    let minManaValueFilterVal = localStorage.getItem('filterVal4');
    let maxManaValueFilterVal = localStorage.getItem('filterVal5');
    let typeFilterVals = localStorage.getItem('filterVal6');
    let draftabilityStatusFilterVals = localStorage.getItem('filterVal7');
    let displayFilterVal = localStorage.getItem('filterVal8');
    let maxResults = localStorage.getItem('filterVal9');
    FetchCardData(primaryFilterVal, nameFilterVal, tierFilterVals, colorIdentityFilterVals, minManaValueFilterVal,
        maxManaValueFilterVal, typeFilterVals, draftabilityStatusFilterVals, displayFilterVal, maxResults);
}

function FetchCardData(
    primaryFilter,
    nameFilter,
    tierFilter,
    colorIdentityFilter,
    minManaValueFilter,
    maxManaValueFilter,
    typeFilter,
    draftabilityStatusFilter,
    displayFilter,
    maxResults) {
    if (isNaN(maxResults)) throw 'maxResults must be a number';
    if (maxResults < 0) throw 'maxResults must be greater than zero';
    let url = '/data/CubeData?nameFilter=' + encodeURIComponent(nameFilter)
        + '&tierFilter=' + encodeURIComponent(tierFilter)
        + '&colorIdentityFilter=' + encodeURIComponent(colorIdentityFilter)
        + '&minManaValueFilter=' + encodeURIComponent(minManaValueFilter)
        + '&maxManaValueFilter=' + encodeURIComponent(maxManaValueFilter)
        + '&typeFilter=' + encodeURIComponent(typeFilter)
        + '&draftabilityStatusFilter=' + encodeURIComponent(draftabilityStatusFilter)
        + '&displayFilter=' + encodeURIComponent(displayFilter)
        + '&maxResults=' + maxResults
        + '&randomizerForPack=false';
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
        .then(data => {
            if (data) {
                if (!Array.isArray(data.cards) || !Array.isArray(data.cardsInCube)) throw 'data.Cards or data.CardsInCube in server response is not an array.'
                if (primaryFilter == 'none') {
                    document.getElementById('wrapperDiv').innerHTML = "";
                    FillNoneDiv(data, displayFilter);
                } else if (primaryFilter == 'tier') {
                    document.getElementById('wrapperDiv').innerHTML = "";
                    FillTierDiv('Bronze', data, '#EFA67D', true, displayFilter);
                    FillTierDiv('Silver', data, '#DBDAD9', null, displayFilter);
                    FillTierDiv('Gold', data, '#F2E979BF', null, displayFilter);
                } else if (primaryFilter == 'colorIdentity') {
                    document.getElementById('wrapperDiv').innerHTML = "";
                    FillColorIdentityDiv('#ffff80', '#ffffe6', 'W', data, displayFilter, 'shrunk'); // These are initialized opposite of how they will appear, due to the nature of ToggleColorIdentityDivVisibility()
                    FillColorIdentityDiv('#99ddff', '#e6ffff', 'U', data, displayFilter, 'shrunk');
                    FillColorIdentityDiv('#df9fdf', '#f3e6ff', 'B', data, displayFilter, 'shrunk');
                    FillColorIdentityDiv('#ff8080', '#ffe6e6', 'R', data, displayFilter, 'visible');
                    FillColorIdentityDiv('#99ff99', '#e6ffe6', 'G', data, displayFilter, 'visible');
                    FillColorIdentityDiv('#fed793', '#ffe0cc', 'Multiple', data, displayFilter, 'visible');
                    FillColorIdentityDiv('#DBDAD9', '#e0e0eb', 'Colorless', data, displayFilter, 'visible');
                }
            }
        }).catch(err => {
            if (err) { }
            alert("Error fetching data: " + err);
        });
}

function FillNoneDiv(data, displayFilter) {
    var cardCountHeader = document.createElement('div');
    cardCountHeader.setAttribute('style', 'position:absolute;height:8%;width:100%;background-color:white;border:3px inset gray;border-bottom:none;display:flex');
    var cardCountDestinationElement = document.createElement('div');
    cardCountDestinationElement.setAttribute('style', 'font-weight:bold;font-size:25px;text-align:center;width:100%;align-self:center')
    cardCountHeader.appendChild(cardCountDestinationElement)
    var cardsInCubeNames = data.cardsInCube.map(function (card) { return card.name; });
    var cards = data.cards.filter(function (card) {
        if (cardsInCubeNames.includes(card.name)) return card;
    });
    cardCountDestinationElement.innerHTML = 'Cards - (' + cards.length + ')';
    wrapperDiv.appendChild(cardCountHeader);
    var cardDestinationElement = document.createElement('div');
    cardDestinationElement.setAttribute('class', 'NoneDiv');
    wrapperDiv.appendChild(cardDestinationElement);
    if (displayFilter == 'text') {
        for (let index = 0; index < cards.length; index++) {
            let card = cards[index];
            let cardElement = document.createElement('div');
            cardElement.setAttribute('class', 'CardListItem');
            cardElement.setAttribute('style', 'width:max-content;margin-right:20px;float:left');
            cardElement.innerHTML = card.name;
            var timeOut;
            cardElement.addEventListener("mouseenter", function () {
                let that = this;
                timeOut = setTimeout(function () { DisplayToolTip(that) }, 400);
            });
            cardElement.addEventListener("mouseleave", function () {
                clearTimeout(timeOut);
                VanishToolTip();
            });
            cardDestinationElement.appendChild(cardElement);
        }
    } else if (displayFilter == 'images') {
        cardDestinationElement.setAttribute('style', 'padding-bottom:0px');
        fillWithImages(cards, cardDestinationElement, 'width:215px;margin-right:10px;margin-bottom:10px;float:left');
    }
}

function FillTierDiv(tier, data, divColor, firstDivStatus, displayFilter) {
    // Retrieve card data: filter through cardsInCube table
    var cardsInCubeNames = data.cardsInCube.map(function (card) { return card.name; });
    var cardsWithTier = data.cardsInCube.filter(function (card) {
        if (cardsInCubeNames.includes(card.name)) return card.tier == tier;
    });
    // Filter result through cards table
    var cardsWithTierNames = cardsWithTier.map(function (card) { return card.name; });
    var cardsWithFullStats = data.cards.filter(function (card) {
        if (cardsWithTierNames.includes(card.name)) return card;
    });

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
    cardCountDiv.innerHTML = tier + ' - (' + cardsWithFullStats.length + ')';
    cardCountArea.appendChild(cardCountDiv);
    cardDestinationWrapper.appendChild(cardCountArea);

    // Put card area in tier div
    let cardDestinationElement = document.createElement('div');
    cardDestinationElement.setAttribute('class', 'TierDiv');
    if (displayFilter == 'text') {
        for (let index = 0; index < cardsWithFullStats.length; index++) {
            let card = cardsWithFullStats[index];
            let cardElement = document.createElement('div');
            cardElement.setAttribute('class', 'CardListItem');
            cardElement.innerHTML = card.name;
            var timeOut;
            cardElement.addEventListener("mouseenter", function () {
                let that = this;
                timeOut = setTimeout(function () { DisplayToolTip(that) }, 400);
            });
            cardElement.addEventListener("mouseleave", function () {
                clearTimeout(timeOut);
                VanishToolTip();
            });
            cardDestinationElement.appendChild(cardElement);
        }
    } else if (displayFilter == 'images') {
        cardDestinationElement.setAttribute('style', 'padding-bottom:0px')
        fillWithImages(cardsWithFullStats, cardDestinationElement, 'width:215px;margin-bottom:10px')
    }
    cardDestinationWrapper.appendChild(cardDestinationElement);

    // Put the full tier div in the wrapper
    wrapperDiv.appendChild(cardDestinationWrapper);
}

function FillColorIdentityDiv(cardCountDivColor, cardDivColor, colorIdentity, data, cardDisplayFilter, visibility) {
    // Retrieve card data
    var cardNames = data.cardsInCube.map(function (card) { return card.name; });
    var cards = data.cards.filter(function (card) {
        if (cardNames.includes(card.name)) return card.colorIdentity == colorIdentity;
    });

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
    let colorIdentityFullWord = getFullWord(colorIdentity);
    cardCountDiv.innerHTML = colorIdentityFullWord + ' - (' + cards.length + ')';
    cardCountArea.appendChild(cardCountDiv);
    cardCountAreaWithColor.appendChild(cardCountArea);
    fullColorIdentityColumn.appendChild(cardCountAreaWithColor);

    // Put card area in color identity column
    var cardAreaWithColor = document.createElement('div');
    cardAreaWithColor.setAttribute('style', 'height:95%;width:100%;text-align:center;overflow-y:scroll;padding-top:20px;padding-bottom:20px;background-color:' + cardDivColor);
    var cardArea = document.createElement('div');
    cardArea.setAttribute('style', 'visibility:hidden');
    if (cardDisplayFilter == 'text') {
        for (let index = 0; index < cards.length; index++) {
            let card = cards[index];
            let cardElement = document.createElement('div');
            cardElement.setAttribute('class', 'CardListItem');
            cardElement.innerHTML = card.name;
            var timeOut;
            cardElement.addEventListener("mouseenter", function () {
                let that = this;
                timeOut = setTimeout(function () { DisplayToolTip(that) }, 400);
            });
            cardElement.addEventListener("mouseleave", function () {
                clearTimeout(timeOut);
                VanishToolTip();
            });
            cardArea.appendChild(cardElement);
        }
    } else if (cardDisplayFilter == 'images') {
        fillWithImages(cards, cardArea, 'width:95%;margin-bottom:10px');
    }
    cardAreaWithColor.appendChild(cardArea);
    fullColorIdentityColumn.appendChild(cardAreaWithColor);

    // Put the full color identity column in the wrapper
    wrapperDiv.appendChild(fullColorIdentityColumn);

    // Initialize the visibility of the color identity column (we input the opposite of what we want to get what we want)
    ToggleColorIdentityDivVisibility(fullColorIdentityColumn);
}

function getFullWord(colorIdentity) {
    if (colorIdentity == 'W') {
        return 'White';
    } else if (colorIdentity == 'U') {
        return 'Blue';
    } else if (colorIdentity == 'B') {
        return 'Black';
    } else if (colorIdentity == 'R') {
        return 'Red';
    } else if (colorIdentity == 'G') {
        return 'Green';
    } else {
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

function GenerateRandomPackWindow() {
    let height = 0.75 * window.screen.height;
    let width = 0.60 * window.screen.width;
    let left = 0.2 * window.screen.width;
    let top = 0.125 * window.screen.height;
    window.location.assign('https://localhost:5001/Home/PackPopUp', 'randomPackPopUp', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes');
}

function GenerateRandomPack() {
    let containerDivs = document.getElementsByClassName("container");
    for (i = 0; i < containerDivs.length; i++) {
        if (containerDivs[i].parentElement == document.body) {
            containerDivs[i].setAttribute("style", "margin-left:0px;padding:0px");
            break;
        }
    }

    const cardMargin = 5;
    const cardWidth = 215;
    setGeneratedPackDivWidths(cardMargin, cardWidth);

    let cardStyle = 'margin:' + cardMargin + 'px;width:' + cardWidth + 'px;float:unset'
    let tiers = ["bronze", "silver", "gold"];

    // Fetch 5 random bronzes, 10 random silvers, and 5 random golds
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
        .then(data => {
            if (data) {
                if (!Array.isArray(data.cardsInCube)) {
                    throw 'data.Cards or data.CardsInCube in server response is not an array.'
                }

                fillWithImages(data.cardsInCube, cardDestination, cardStyle);
            }
        }).catch(err => {
            if (err) { }
            alert("Error fetching data: " + err);
        });
}

function fillWithImages(cards, cardDestinationElement, cardStyle) {
    for (let index = 0; index < cards.length; index++) {
        let card = cards[index];
        if (card.image) {
            let cardImgElement = document.createElement('img');
            cardImgElement.setAttribute('style', cardStyle);
            cardImgElement.src = 'data:image/jpg;base64,' + card.image;
            cardDestinationElement.appendChild(cardImgElement);
        } else {
            throw 'Something went wrong.';
        }
    }
}

function DisplayToolTip(cardTextDiv) {
    let cardName = cardTextDiv.innerHTML;
    let url = '/scryfallAPI/GetData?cardName=' + encodeURIComponent(cardName);

    let data = fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors', // no-cors, *cors, same-origin
    })
        .then(res => {
            if (res.status == 200) {
                return res.json();
            } else {
                throw "Error fetching data: " + res;
            }
        })
        .then(scryfallAPI => {
            let imageData = scryfallAPI?.imageData;
            if (imageData) {
                let toolTipDiv = document.getElementById("toolTipDiv");
                let cardTextPosition = GetAbsolutePosition(cardTextDiv);
                let toolTipPadding = 5;

                let imageWidth = 215;
                let toolTipWidth = imageWidth + (2 * toolTipPadding);
                let toolTipLeft = ((cardTextPosition.left + cardTextPosition.right) / 2) - (toolTipWidth / 2);

                let imageHeight = 301;
                let toolTipHeight = imageHeight + (2 * toolTipPadding);
                let toolTipTop;
                if ((cardTextPosition.top - toolTipHeight) < 0) {
                    toolTipTop = cardTextPosition.bottom + toolTipPadding;
                } else toolTipTop = cardTextPosition.top - toolTipHeight;

                let cardImg = document.createElement('img');
                cardImg.src = 'data:image/jpg;base64,' + imageData;
                cardImg.setAttribute('style', 'height:' + imageHeight + 'px');

                toolTipDiv.innerHTML = '';
                toolTipDiv.appendChild(cardImg);

                toolTipDiv.setAttribute('style', 'opacity:0;z-index:3;width:fit-content;position:absolute;padding:' + toolTipPadding + 'px;top:' + toolTipTop + 'px;left:' + toolTipLeft + 'px');
                let op = 0.1;
                let timer = setInterval(function () {
                    toolTipDiv.style.opacity = op;
                    op += op * 0.1;
                    if (op >= 1) {
                        clearInterval(timer);
                        toolTipDiv.style.opacity = 1;
                    }
                }, 10);
            } else {
                throw 'Something went wrong.';
            }
        });
    return data;
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