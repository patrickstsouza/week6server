var xhr; // define the global variable to process the AJAX request
function callDivChange() {
    xhr = new XMLHttpRequest();
    xhr.open("GET", "test.html", true);
    xhr.onreadystatechange = processDivChange;
    try {
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }
    catch (e) {
        // this only works in internet explorer
    }
    xhr.send();
}
function processDivChange() {
    if (xhr.readyState < 4) // while waiting response from server
        document.getElementById('div1').innerHTML = "Loading...";
    else if (xhr.readyState === 4) { // 4 = Response from server has been completely loaded.
        if (xhr.status == 200 && xhr.status < 300)
            // http status between 200 to 299 are all successful
            document.getElementById('div1').innerHTML = xhr.responseText;
    }
}