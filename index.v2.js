/**
 * ipaddress-cfworker by attr0 <me@hlz.ink>
 * Get IP address realted information.
 * 获取IP地址相关的信息
 *
 * Environment Variable Requirement
 * - ASSET_URL
 * - IPINFO_TOKEN
 * - IPDATA_TOKEN
 * - IP2LOCATION_TOKEN
 */

// event listener
addEventListener('fetch', (event) => {
	const res = handleRequest(event.request);
	event.respondWith(res);
});

/**
 * Reqeust Handle
 * @param {Request} request
 */
async function handleRequest(request) {
	const { url } = request;
	const { pathname } = new URL(url);

	// query specific ip
	if (isQuery(pathname)) return respondQuery(request, pathname);

	// Router
	switch (pathname) {
		// api
		case '/json':
		case '/json/ipgeo':
			return respondJsonIPGEO(request);
		case '/json/ipdata':
			return respondJsonIPDATA(request);
		case '/json/ipinfo':
			return respondJsonIPINFO(request);
		case '/json/cf':
			return respondJsonCF(request);
		case '/json/ip2location':
			return respondJsonIP2LOCATION(request);
		case '/cf':
			return respondCF(request);
		case '/robots.txt':
			return new Response(null, { status: 200 });

		// web
		case '/':
			// If the client is headless, response with plain text
			const isHeadless = checkUA(request);
			if (isHeadless.is) return respondText(request, isHeadless.changeLine);
		case '/index.html':
		case '/main.css':
		case '/main.js':
		case '/favicon.ico':
			return handlePage(request);

		// error
		default:
			return makeJsonResponse(null);
	}
}

/**
 *  Check whether client is headless
 * @param {Request} request
 *
 */
function checkUA(request) {
	const UA = request.headers.get('User-Agent');

	// Browser UA check
	let res = UA.indexOf('Mozilla') != -1 || UA.indexOf('Firefox') != -1 || UA.indexOf('Opera') != -1 || UA.indexOf('Chrome') != -1 || UA.indexOf('AppleWebKit') != -1 || UA.indexOf('Safari') != -1;

	// Windows Powershell check
	//  notes: windows curl use Edge/IE UA
	res = res && UA.indexOf('WindowsPowerShell') == -1;

	// only when detect "curl", change line at the end.
	return { is: !res, changeLine: UA.indexOf('curl') != -1 };
}

/**
 * Handle plain-text request from headless requests
 * @param {Request} request
 *
 */
function respondText(request, changeLine) {
	let res = request.headers.get('CF-Connecting-IP');
	if (changeLine) res += '\n';
	return new Response(res, {
		status: 200,
		headers: {
			'content-type': 'text/plain',
			'access-control-allow-origin': '*',
		},
	});
}

/**
 * Handle Web
 * @param {Request} request
 */
async function handlePage(request) {
	// https redirect
	const { url } = request;
	const { host, pathname, search } = new URL(url);
	const destinationURL = 'https://' + host + pathname + search;

	if (request.cf.tlsVersion == null || request.cf.tlsVersion == '') {
		return Response.redirect(destinationURL, 302);
	}

	// handle web resources
	return fetch(ASSET_URL + pathname);
}

/**
 * Create response with Json
 * @param {map} json
 */
function makeJsonResponse(json) {
	// no data
	if (json == null) {
		return new Response('Error 404\nPage Not Found', { status: 404 });
	}

	// with data
	return new Response(JSON.stringify(json), {
		status: 200,
		headers: {
			'Content-Type': 'application/json;charset=UTF-8',
			'access-control-allow-origin': '*',
		},
	});
}

/**
 *  Handle /cf
 * @param {Request} request
 *
 */
function respondCF(request) {
	return makeJsonResponse(request.cf);
}

/**
 * Get Client Country Name
 * @param {string} countryCode
 *
 */
function getCountryName(countryCode) {
	const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
	return regionNames.of(countryCode);
}

/**
 * Get cf Region Name
 * @param {IncomingRequestCfProperties} cf
 *
 */
function getCCityName(cf) {
	if (cf['city'] != null) return cf['city'];
	if (cf['region'] != null) return cf['region'];
	if (cf['regionCode'] != null) return cf['regionCode'];
	return getCountryName(cf['country']);
}

/**
 * Get cf Region Name
 * @param {IncomingRequestCfProperties} cf
 *
 */
function getCFRegionName(cf) {
	if (cf['region'] != null) return cf['region'];
	if (cf['regionCode'] != null) return cf['regionCode'];
	return getCountryName(cf['country']);
}

/**
 * Handle /json/cf
 * @param {Request} request
 *
 */
function respondJsonCF(request) {
	const cf = request.cf;
	const res = {
		ip: request.headers.get('CF-Connecting-IP'),
		city: getCCityName(cf),
		region: getCFRegionName(cf),
		country: getCountryName(cf['country']),
		countryCode: cf['country'],
		// 先维后经
		latitude: cf['latitude'],
		longitude: cf['longitude'],
		asn: cf['asn'],
		asnCode: cf['asn'],
		timezone: cf['timezone'],
	};
	return makeJsonResponse(res);
}

/**
 * Check if the reqeust is a query on a given ip
 * @param {String} path
 *
 */
function isQuery(path) {
	const ipAddrReg = new RegExp('/query/(\\S*)');
	const IP = ipAddrReg.exec(path);

	if (IP && testIPFormat(IP[1])) return true;
	return false;
}

/**
 * Check the input is a valid ipaddress
 * @param {String} ip
 */
function testIPFormat(ip) {
	let ipv46_regex = /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$)/gm;
	return ipv46_regex.test(ip);
}

/**
 * Make Json data of IP address Info
 * @param {IncomingRequestCfProperties} cf
 * @param {URL} path
 *
 */
async function respondQuery(request, path) {
	const ipAddrReg = new RegExp('/query/(\\S*)');
	const ip = ipAddrReg.exec(path)[1];
	return respondJsonIPDATA(request, ip);
}

/**
 * Get IPINFO location
 * @param {String} loc
 *
 */
function getIPINFOLoc(loc, index) {
	return loc.split(',')[index];
}

/**
 * Fetch remote resources as JSON
 * @param {String} url
 */
async function fetchHandler(url) {
	let res = await (await fetch(url)).text();
	if (res == null) return null;
	if (res.indexOf('valid') != -1) return null;
	try {
		return JSON.parse(res);
	} catch (error) {
		return null;
	}
}

/**
 * Get Client Region Name
 * @param {IncomingRequestCfProperties} cf
 * @param {String} ip
 *
 */
async function respondJsonIPINFO(request, ip = null) {
	// set ip address
	if (ip == null) {
		ip = request.headers.get('CF-Connecting-IP');
	}

	try {
		const ipinfo_data = await fetchHandler('http://ipinfo.io/' + ip + '?token=' + IPINFO_TOKEN);
		if (ipinfo_data == null) return makeJsonResponse(null);

		const asnRegx = /AS(?<grp0>[^\D]+) /;
		const res = {
			ip: ip,
			city: ipinfo_data['city'],
			region: ipinfo_data['region'],
			country: getCountryName(ipinfo_data['country']),
			countryCode: ipinfo_data['country'],
			// 先维后经
			latitude: getIPINFOLoc(ipinfo_data['loc'], 0),
			longitude: getIPINFOLoc(ipinfo_data['loc'], 1),
			asn: ipinfo_data['org'],
			asnCode: ipinfo_data['org'].split(' ')[0],
			timezone: ipinfo_data['timezone'],
		};
		return makeJsonResponse(res);
	} catch (error) {
		return makeJsonResponse(null);
	}
}

/**
 * Get Client Region Name
 * @param {IncomingRequestCfProperties} cf
 * @param {String} ip
 *
 */
async function respondJsonIPDATA(request, ip = null) {
	// set ip address
	if (ip == null) {
		ip = request.headers.get('CF-Connecting-IP');
	}

	try {
		const ipdata_data = await fetchHandler('https://api.ipdata.co/' + ip + '?api-key=' + IPDATA_TOKEN);
		if (ipdata_data == null) return makeJsonResponse(null);

		const res = {
			ip: ip,
			city: ipdata_data['city'],
			region: ipdata_data['region'],
			country: ipdata_data['country_name'],
			countryCode: ipdata_data['country_code'],
			// 先维后经
			latitude: parseFloat(ipdata_data['latitude']).toFixed(4),
			longitude: parseFloat(ipdata_data['longitude']).toFixed(4),
			asn: ipdata_data['asn']['asn'] + ' ' + ipdata_data['asn']['name'],
			asnCode: ipdata_data['asn']['asn'],
			timezone: ipdata_data['time_zone']['name'],
		};
		return makeJsonResponse(res);
	} catch (error) {
		return makeJsonResponse(null);
	}
}

/**
 * Get Client Region Name
 * @param {IncomingRequestCfProperties} cf
 * @param {String} ip
 *
 */
async function respondJsonIPGEO(request, ip = null) {
	// set ip address
	if (ip == null) {
		ip = request.headers.get('CF-Connecting-IP');
	}

	try {
		const ipgeo_data = await fetchHandler('https://api.ipgeolocation.io/ipgeo?apiKey=' + IPGEO_TOKEN + '&ip=' + ip);
		if (ipgeo_data == null) return makeJsonResponse(null);

		const res = {
			ip: ip,
			city: ipgeo_data['city'],
			region: ipgeo_data['state_prov'],
			country: ipgeo_data['country_name'],
			countryCode: ipgeo_data['country_code2'],
			// 先维后经
			latitude: parseFloat(ipgeo_data['latitude']).toFixed(4),
			longitude: parseFloat(ipgeo_data['longitude']).toFixed(4),
			asn: 'AS' + request.cf['asn'] + ' ' + ipgeo_data['isp'],
			asnCode: 'AS' + request.cf['asn'],
			timezone: ipgeo_data['time_zone']['name'],
		};
		return makeJsonResponse(res);
	} catch (error) {
		return makeJsonResponse(null);
	}
}

/**
 * Get Client Region Name
 * @param {IncomingRequestCfProperties} cf
 * @param {String} ip
 *
 */
async function respondJsonIP2LOCATION(request, ip = null) {
	// set ip address
	if (ip == null) {
		ip = request.headers.get('CF-Connecting-IP');
	}

	try {
		const ip2location_data = await fetchHandler('https://api.ip2location.io/' + ip + '?key=' + ip2location_TOKEN);
		if (ip2location_data == null) return makeJsonResponse(null);

		const res = {
			ip: ip,
			city: ip2location_data['city_name'],
			region: ip2location_data['region_name'],
			country: ip2location_data['country_name'],
			countryCode: ip2location_data['country_code'],
			latitude: parseFloat(ip2location_data['latitude']).toFixed(4),
			longitude: parseFloat(ip2location_data['longitude']).toFixed(4),
			asn: ip2location_data['as'],
			asnCode: ip2location_data['asn'],
			timezone: ip2location_data['time_zone'],
		};
		return makeJsonResponse(res);
	} catch (error) {
		return makeJsonResponse(null);
	}
}
