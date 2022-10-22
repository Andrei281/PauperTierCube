// For pages with tabs (i.e. List.cshtml or Decks.cshtml), function to open 1 tabcontent while closing all others
function openTabContent(evt, tabContentDivId, heightToRetain) {
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
    document.getElementById(tabContentDivId).setAttribute("style", "display: flex; height:" + heightToRetain + "px");
    evt.currentTarget.className += " active";
}

// For checkbox filters, checkboxed values are returned in a certain array format
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

// General color-char to color-word converter
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

function DisplayToolTip(cardElement, fullCard) {
    // Create image
    let cardImg = document.createElement('img');
    cardImg.src = 'data:image/jpg;base64,' + fullCard.image;
    cardImg.setAttribute('style', 'width: 250px; height: 350px');

    // Create stats div
    let statsDiv = document.createElement('div');
    statsDiv.setAttribute('style', 'font-size: 18px; height: fit-content; margin-left: 10px; padding: 10px; display: flex; flex-direction: column; align-items: center');
    let tierDiv = document.createElement('div');
    tierDiv.setAttribute("style", "display: flex");
    tierDiv.innerHTML = "Tier - " + fullCard.tier;
    let tierColorDiv = document.createElement('div');
    if (fullCard.tier == "Bronze") {
        tierColorDiv.setAttribute("style", "margin-left: 10px; border: solid; width: 25px; height: 25px; background-color: #EFA67D");
    } else if (fullCard.tier == "Silver") {
        tierColorDiv.setAttribute("style", "margin-left: 10px; border: solid; width: 25px; height: 25px; background-color: #DBDAD9");
    } else {
        tierColorDiv.setAttribute("style", "margin-left: 10px; border: solid; width: 25px; height: 25px; background-color: #F2E979BF");
    }
    tierDiv.appendChild(tierColorDiv);
    statsDiv.appendChild(tierDiv);
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

    // Initialize tooltip properties (without location)
    toolTipDiv.setAttribute('style', 'background-color:lightgray;border:solid;border-radius:10px;opacity:0;z-index:3;width:fit-content;height:fit-content;position:absolute;display:flex;padding:10px');

    // Apply final tooltip properties (with location)
    toolTipTopAndLeft = FindToolTipTopAndLeft(cardElement, toolTipDiv);
    toolTipDiv.setAttribute("style", "background-color:lightgray;border:solid;border-radius:10px;opacity:0;z-index:3;width:fit-content;position:absolute;display:flex;padding:10px;top:" + toolTipTopAndLeft[0] + "px;left:" + toolTipTopAndLeft[1] + "px");

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

function FindToolTipTopAndLeft(baseElement, toolTipDiv) {

    // Use tooltip properties and base element location to locate tooltip
    let baseElementPosition = GetAbsolutePosition(baseElement);
    let toolTipLeft = ((baseElementPosition.left + baseElementPosition.right) / 2) - (toolTipDiv.clientWidth / 2);
    let toolTipTop = baseElementPosition.top - toolTipDiv.clientHeight - 8;

    // If too high on screen, position tooltip below cursor
    if (toolTipTop < 0) {
        if (baseElement.innerText) {
            toolTipTop = baseElementPosition.bottom + 2;
        } else {
            toolTipTop = baseElementPosition.bottom + parseInt(baseElement.style.borderWidth);
        }
    }

    // If too far to one side, nudge the other way
    if (toolTipLeft < 0) {
        toolTipLeft = 15;
    } else if (toolTipLeft > document.body.clientWidth - toolTipDiv.clientWidth) {
        toolTipLeft = document.body.clientWidth - toolTipDiv.clientWidth - 15;
    }

    return [toolTipTop, toolTipLeft];
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

function VanishToolTip() {
    document.getElementById("toolTipDiv").innerHTML = '';
    toolTipDiv.style.opacity = 0;
}