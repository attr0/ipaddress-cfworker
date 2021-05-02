addEventListener('fetch', event => {
    const res = handleRequest(event.request)
        .catch(error => new Response('cfworker error:\n' + error.stack, {
            status: 502,
            headers: {
                'content-type': 'text/plain',
                'access-control-allow-origin': '*'
            }
        }))
    event.respondWith(res)
})

const ASSET_URL = "https://ipaddress.pages.dev"

/**
 * Reqeust Handle
 * @param {Request} request
 */
async function handleRequest(request) {
    const { url } = request
    const { pathname } = new URL(url)

    // If the client is headless, directly response with IP
    const isHeadless = checkUA(request)

    // query specific ip
    if (isQueryIP(pathname))
        return respondJsonIP(pathname)

    // Router
    switch (pathname) {
        case '/json':
            return respondJson(request)
        case '/jsonall':
            return respondJsonAll(request)
        case '/cf':
            return respondJsonCf(request)
        case '/robots.txt':
            return new Response(null, { status: 200 })
        case '/':
            if (isHeadless.is) return respondIP(request, isHeadless.changeLine)
        case '/main.css':
        case '/main.js':
        case '/favicon.ico':
            return handlePage(request)
        default:
            return new Response("Error 404\nPage Not Found", { status: 404 })
    }
}


function respondJsonCf(request) {
    return makeJsonResponse(request.cf.tlsVersion)
}


/**
 * Handle Page
 * @param {Request} request
 */
async function handlePage(request) {
    const { url } = request
    const { host, pathname, search } = new URL(url)
    const destinationURL = "https://" + host + pathname + search;

    if (request.cf.tlsVersion == null || request.cf.tlsVersion == "") {
        return Response.redirect(destinationURL, 302)
    }

    return fetch(ASSET_URL + pathname)
}

/**
 *  Check whether client is headless
 * @param {String} path
 * 
 */
function isQueryIP(path) {
    const getIPpatt = new RegExp("/ip/(\\S*)")
    const IP = getIPpatt.exec(path)

    if (IP && checkIPForm(IP[1])) return true
    return false
}


/**
 *  Check whether client is headless
 * @param {Request} request
 * 
 */
function checkUA(request) {
    const UA = request.headers.get("User-Agent")
        // Browser-UA check
    let res = UA.indexOf("Mozilla") != -1 || UA.indexOf("Firefox") != -1 ||
        UA.indexOf("Opera") != -1 || UA.indexOf("Chrome") != -1 ||
        UA.indexOf("AppleWebKit") != -1 || UA.indexOf("Safari") != -1

    // Windows Powershell check
    res = res && UA.indexOf("WindowsPowerShell") == -1

    // only when detect "curl", change line at the end.
    return { "is": !res, "changeLine": UA.indexOf("curl") != -1 }
}


/**
 * Respond with plain-text ip address
 * @param {Request} request
 * 
 */
function respondIP(request, changeLine) {
    let res = request.headers.get("CF-Connecting-IP")
    if (changeLine) res += "\n"
    return new Response(res, {
        status: 200,
        headers: {
            'content-type': 'text/plain',
            'access-control-allow-origin': '*'
        }
    })
}

/**
 * Get Client Country Name
 * @param {​IncomingRequestCfProperties} cf
 * 
 */
function getCountryName(cf) {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
    return regionNames.of(cf["country"])
}

/**
 * Get Client Region Name
 * @param {​IncomingRequestCfProperties} cf
 * 
 */
function getRegionName(cf) {
    if (cf["city"] != null) return cf["city"]
    if (cf["region"] != null) return cf["region"]
    if (cf["regionCode"] != null) return cf["regionCode"]
    return getCountryName(cf)
}

const continents_map = {
    "AF": "Africa",
    "NA": "North America",
    "OC": "Oceania",
    "AN": "Antarctica",
    "AS": "Asia",
    "EU": "Europe",
    "SA": "South America"
}

/**
 * Get full name of Continent
 * @param {String} st
 * 
 */
function getContinentName(st) {
    let res = continents_map[st]
    if (res == null) res = st
    return res
}


/** 
 * Respond with Json data of IP address Info
 * @param {Request} request
 * 
 */
function respondJson(request) {
    return makeJsonResponse(makeJson(request))
}

/** 
 * Make Json data of IP address Info
 * @param {Request} request
 * 
 */
function makeJson(request) {
    const cf = request.cf
    const res = {
        "ip": request.headers.get("CF-Connecting-IP"),
        "region": getRegionName(cf),
        "country": getCountryName(cf),
        "countryCode": cf["country"],
        "continent": getContinentName(cf["continent"]),
        "continentCode": cf["continent"],
        "asn": cf["asn"]
    }
    return res
}

/**
 * Create response with Json
 * @param {map} json
 */
function makeJsonResponse(json) {
    return new Response(JSON.stringify(json), {
        status: 200,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'access-control-allow-origin': '*'
        }
    })
}

/**
 * Fetch remote resources as JSON
 * @param {String} url 
 */
async function fetchHandler(url) {
    let res = await (await fetch(url)).text()
    if (res == null) return null
    if (res.indexOf("valid") != -1) return null
    try {
        return JSON.parse(res)
    } catch (error) {
        throw new Error(res)
    }

}

/** 
 * Check string is ipv4 or ipv6 address
 * @param {String} ip
 * 
 */
function checkIPForm(ip) {
    const ipReg = /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/ig;
    return ipReg.test(ip)
}


/** 
 * Make Json data of IP address Info
 * @param {String} ip
 * 
 */
async function makeJsonAll(ip) {
    try {
        const ipinfo_data = await fetchHandler("http://ipinfo.io/" + ip + "?token=" + ipinfo_token)
        const ipinsight_data = await fetchHandler("http://api.ipinsight.io/ip/" + ip + "?token=" + ipinsight_token)
        if (ipinfo_data == null || ipinsight_data == null) return null

        const asnpatt = /AS(?<grp0>[^\D]+) /
        const res = {
            "ip": ip,
            "city": ipinsight_data["city_name"],
            "region": ipinsight_data["region_name"],
            "country": ipinsight_data["country_name"],
            "countryCode": ipinsight_data["country_code"],
            "continent": getContinentName(ipinsight_data["continent_code"]),
            "continentCode": ipinsight_data["continent_code"],
            "latitude": ipinsight_data["latitude"],
            "longitude": ipinsight_data["longitude"],
            "asn": ipinfo_data["org"],
            "asnCode": asnpatt.exec(ipinfo_data["org"])[1],
            "timezone": ipinfo_data["timezone"],
        }
        return res
    } catch (error) {
        return null;
    }
}

/** 
 * Respond all data of ip
 * @param {Request} request
 * 
 */
async function respondJsonAll(request) {
    const ip = request.headers.get("CF-Connecting-IP")
    return makeJsonResponse(await makeJsonAll(ip))
}

/** 
 * Respond all data of ip
 * @param {String} path
 * 
 */
async function respondJsonIP(path) {
    const getIPpatt = new RegExp("/ip/(\\S*)")
    const ip = getIPpatt.exec(path)[1]
    return makeJsonResponse(await makeJsonAll(ip))
}