<?php
/*
miniProxy - A simple PHP web proxy. <https://github.com/joshdick/miniProxy>
Written and maintained by Joshua Dick <http://joshdick.net>.
miniProxy is licensed under the GNU GPL v3 <http://www.gnu.org/licenses/gpl.html>.
*/

/****************************** START CONFIGURATION ******************************/

$urlPrefix = 'http://localhost:8080/';

//To enable CORS (cross-origin resource sharing) for proxied sites, set $forceCORS to true.
$forceCORS = false;

/****************************** END CONFIGURATION ******************************/

ob_start("ob_gzhandler");

if (!function_exists("curl_init")) die ("This proxy requires PHP's cURL extension. Please install/enable it on your server and try again.");

//Helper function used to removes/unset keys from an associative array using case insensitive matching
function removeKeys(&$assoc, $keys2remove) {
    $keys = array_keys($assoc);
    $map = array();
    foreach ($keys as $key) {
        $map[strtolower($key)] = $key;
    }

    foreach ($keys2remove as $key) {
        $key = strtolower($key);
        if (isset($map[$key])) {
            unset($assoc[$map[$key]]);
        }
    }
}

if (!function_exists("getallheaders")) {
    //Adapted from http://www.php.net/manual/en/function.getallheaders.php#99814
    function getallheaders() {
        $result = array();
        foreach($_SERVER as $key => $value) {
            if (substr($key, 0, 5) == "HTTP_") {
                $key = str_replace(" ", "-", ucwords(strtolower(str_replace("_", " ", substr($key, 5)))));
                $result[$key] = $value;
            }
        }
        return $result;
    }
}

define("PROXY_PREFIX", "http" . (isset($_SERVER['HTTPS']) ? "s" : "") . "://" . $_SERVER["SERVER_NAME"] . ($_SERVER["SERVER_PORT"] != 80 ? ":" . $_SERVER["SERVER_PORT"] : "") . $_SERVER["SCRIPT_NAME"] . "/");

//Makes an HTTP request via cURL, using request data that was passed directly to this script.
function makeRequest($url) {

    //Tell cURL to make the request using the brower's user-agent if there is one, or a fallback user-agent otherwise.
    $user_agent = $_SERVER["HTTP_USER_AGENT"];
    if (empty($user_agent)) {
        $user_agent = "Mozilla/5.0 (compatible; miniProxy)";
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_USERAGENT, $user_agent);

    //Get ready to proxy the browser's request headers...
    $browserRequestHeaders = getallheaders();

    //...but let cURL set some headers on its own.
    removeKeys($browserRequestHeaders, array(
        "Host",
        "Content-Length",
        "Accept-Encoding" //Throw away the browser's Accept-Encoding header if any and let cURL make the request using gzip if possible.
    ));

    curl_setopt($ch, CURLOPT_ENCODING, "");
    //Transform the associative array from getallheaders() into an
    //indexed array of header strings to be passed to cURL.
    $curlRequestHeaders = array();
    foreach ($browserRequestHeaders as $name => $value) {
        $curlRequestHeaders[] = $name . ": " . $value;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $curlRequestHeaders);

    //Proxy any received GET/POST/PUT data.
    switch ($_SERVER["REQUEST_METHOD"]) {
        case "POST":
            curl_setopt($ch, CURLOPT_POST, true);
            //For some reason, $HTTP_RAW_POST_DATA isn't working as documented at
            //http://php.net/manual/en/reserved.variables.httprawpostdata.php
            //but the php://input method works. This is likely to be flaky
            //across different server environments.
            //More info here: http://stackoverflow.com/questions/8899239/http-raw-post-data-not-being-populated-after-upgrade-to-php-5-3
            curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
            break;
        case "PUT":
            curl_setopt($ch, CURLOPT_PUT, true);
            curl_setopt($ch, CURLOPT_INFILE, fopen('php://input', 'r'));
            break;
    }

    //Other cURL options.
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt ($ch, CURLOPT_FAILONERROR, true);

    //Set the request URL.
    curl_setopt($ch, CURLOPT_URL, $url);

    //Make the request.
    $response = curl_exec($ch);
    $responseInfo = curl_getinfo($ch);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);

    //Setting CURLOPT_HEADER to true above forces the response headers and body
    //to be output together--separate them.
    $responseHeaders = substr($response, 0, $headerSize);
    $responseBody = substr($response, $headerSize);

    return array("headers" => $responseHeaders, "body" => $responseBody, "responseInfo" => $responseInfo);
}

//Extract and sanitize the requested URL.
$url = substr($_SERVER["REQUEST_URI"], strlen($_SERVER["SCRIPT_NAME"]) + 1);
if (empty($url)) {
    die("<html><head><title>miniProxy</title></head><body><h1>Welcome to miniProxy!</h1>miniProxy can be directly invoked like this: <a href=\"" . PROXY_PREFIX . "http://example.net/\">" . PROXY_PREFIX . "http://example.net/</a><br /><br />Or, you can simply enter a URL below:<br /><br /><form onsubmit=\"window.location.href='" . PROXY_PREFIX . "' + document.getElementById('site').value; return false;\"><input id=\"site\" type=\"text\" size=\"50\" /><input type=\"submit\" value=\"Proxy It!\" /></form></body></html>");
} else if (strpos($url, ":/") !== strpos($url, "://")) {
    //Work around the fact that some web servers (e.g. IIS 8.5) change double slashes appearing in the URL to a single slash.
    //See https://github.com/joshdick/miniProxy/pull/14
    $pos = strpos($url, ":/");
    $url = substr_replace($url, "://", $pos, strlen(":/"));
}
$url = $urlPrefix . $url;
$scheme = parse_url($url, PHP_URL_SCHEME);
if (empty($scheme)) {
    //Assume that any supplied URLs starting with // are HTTP URLs.
    if (strpos($url, "//") === 0) {
        $url = "http:" . $url;
    }
} else if (!preg_match("/^https?$/i", $scheme)) {
    die('Error: Detected a "' . $scheme . '" URL. miniProxy exclusively supports http[s] URLs.');
}

$response = makeRequest($url);
$rawResponseHeaders = $response["headers"];
$responseBody = $response["body"];
$responseInfo = $response["responseInfo"];

//A regex that indicates which server response headers should be stripped out of the proxified response.
$header_blacklist_pattern = "/^Content-Length|^Transfer-Encoding|^Content-Encoding.*gzip/i";

//cURL can make multiple requests internally (while following 302 redirects), and reports
//headers for every request it makes. Only proxy the last set of received response headers,
//corresponding to the final request made by cURL for any given call to makeRequest().
$responseHeaderBlocks = array_filter(explode("\r\n\r\n", $rawResponseHeaders));
$lastHeaderBlock = end($responseHeaderBlocks);
$headerLines = explode("\r\n", $lastHeaderBlock);
foreach ($headerLines as $header) {
    $header = trim($header);
    if (!preg_match($header_blacklist_pattern, $header)) {
        header($header);
    }
}

if ($forceCORS) {
    //This logic is based on code found at: http://stackoverflow.com/a/9866124/278810
    //CORS headers sent below may conflict with CORS headers from the original response,
    //so these headers are sent after the original response headers to ensure their values
    //are the ones that actually end up getting sent to the browser.
    //Explicit [ $replace = true ] is used for these headers even though this is PHP's default behavior.

    //Allow access from any origin.
    header("Access-Control-Allow-Origin: *", true);
    header("Access-Control-Allow-Credentials: true", true);

    //Handle CORS headers received during OPTIONS requests.
    if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
        if (isset($_SERVER["HTTP_ACCESS_CONTROL_REQUEST_METHOD"])) {
            header("Access-Control-Allow-Methods: GET, POST, OPTIONS", true);
        }
        if (isset($_SERVER["HTTP_ACCESS_CONTROL_REQUEST_HEADERS"])) {
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}", true);
        }
        //No further action is needed for OPTIONS requests.
        exit(0);
    }

}

$contentType = "";
if (isset($responseInfo["content_type"])) $contentType = $responseInfo["content_type"];

header("Content-Length: " . strlen($responseBody));
echo $responseBody;
