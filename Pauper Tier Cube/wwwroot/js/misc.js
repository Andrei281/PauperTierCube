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