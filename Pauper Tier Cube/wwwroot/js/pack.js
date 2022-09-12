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
                FillWithImages(cards, cardDestination, cardStyle);
            }
        }).catch(err => {
            if (err) { }
            alert("Error fetching data: " + err);
        });
}