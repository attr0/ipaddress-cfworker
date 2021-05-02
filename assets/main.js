const API = "https://ip.hlz.ink"

document.addEventListener("DOMContentLoaded", event => {
    init_page()
})

function $(id) {
    return document.getElementById(id)
}

function setText(obj, text) {
    obj.innerText = text
}

async function init_page() {
    const localIP = await fetchHandler("/jsonall")
    fillin(localIP, false)
    console.log(localIP)
}

async function fetchHandler(url) {
    return await fetch(API + url).then(res => {
        if (res.status == 200) {
            return res.json();
        }
        throw new Error("API Request Error")
    }).catch(error => {
        console.log(error)
        return -1;
    })
}


async function enter_submit(event) {
    if (event.keyCode == 13) {
        await searchHandler();
    }
}

function checkIPForm(ip) {
    const ipReg = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/ig;
    return ipReg.test(ip)
}

async function searchHandler() {
    const ipaddr = $('queryInput').value
    if (!checkIPForm(ipaddr)) {
        raiseSnack("Input isn't a IP address!")
        return;
    }
    const res = await fetchHandler('/ip/' + ipaddr)
    fillin(res)
}

function raiseSnack(text) {
    mdui.snackbar({
        "message": text,
        "position": "top",
        "timeout": 1000
    })
}

function fillin(obj, display = true) {
    if (obj == -1 || obj == {} || obj == '' || obj == null) {
        setText($('ip'), 'Error! Try refresh & Check input')
        setText($('city'), "")
        setText($('region'), "")
        setText($('country'), "")
        setText($('continent'), "")
        setText($('position'), "")
        setText($('asn'), "")
        setText($('timezone'), "")
        return;
    }
    if (display) raiseSnack("Search Successfully")
    setText($('ip'), obj['ip'])
    setText($('city'), obj['city'])
    setText($('region'), obj['region'])
    setText($('country'), obj['country'])
    setText($('continent'), obj['continent'])
    setText($('position'), obj['latitude'] + ', ' + obj['longitude'])
    setText($('asn'), obj['asn'])
    setText($('timezone'), obj['timezone'])

}


function switchSearchBox() {
    const sc = $('search-container')
    if (sc.style.getPropertyValue('display') == '') sc.style.setProperty('display', 'none')
    else sc.style.setProperty('display', '')
}