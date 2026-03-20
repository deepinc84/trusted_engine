<?php
// /instaquote/mega-estimate.php
// Returns roof area + pitch using Google Solar API
// v4: try HIGH then MEDIUM, include regionalRanges when fallback

ini_set('display_errors', 0);
header('Content-Type: application/json');

// 1) Load API keys from private file
$keysPath = '/home/megaroofing/private/api-keys.php';
if (!is_readable($keysPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'API key file missing']);
    exit;
}

$keys = require $keysPath;
$solarKey = $keys['GOOGLE_SOLAR_API_KEY'] ?? '';
if ($solarKey === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Solar API key missing']);
    exit;
}

// Helper to call remote JSON
function http_get_json(string $url): ?array {
    $opts = [
        'http' => [
            'method'  => 'GET',
            'timeout' => 10,
        ],
    ];
    $context = stream_context_create($opts);
    $resp = @file_get_contents($url, false, $context);
    if ($resp === false) {
        return null;
    }
    $json = json_decode($resp, true);
    return is_array($json) ? $json : null;
}

// Complexity band from segment count
function complexity_band(int $segmentCount): string {
    if ($segmentCount <= 0) return 'unknown';
    if ($segmentCount <= 5) return 'low';
    if ($segmentCount <= 12) return 'medium';
    return 'high';
}

// Fallback regional roof size estimate when Solar is not available
function regional_roof_estimate(string $address): array {
    $addrLower = strtolower($address);

    if (strpos($addrLower, 'calgary') !== false) {
        $min = 1400;
        $max = 2200;
    } elseif (strpos($addrLower, ' ab') !== false || strpos($addrLower, 'alberta') !== false) {
        $min = 1300;
        $max = 2400;
    } else {
        $min = 1200;
        $max = 2600;
    }

    $center = ($min + $max) / 2;

    return [
        'min_sqft' => $min,
        'max_sqft' => $max,
        'center'   => $center,
    ];
}

// 2) Read JSON body
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$address = trim($data['address'] ?? '');
$placeId = isset($data['placeId']) ? trim((string)$data['placeId']) : '';
$latIn   = array_key_exists('lat', $data) ? $data['lat'] : null;
$lngIn   = array_key_exists('lng', $data) ? $data['lng'] : null;

if ($address === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Address is required']);
    exit;
}

// 3) Determine lat/lng
$lat = null;
$lng = null;

// Prefer explicit lat/lng sent from frontend autocomplete
if ($latIn !== null && $lngIn !== null && is_numeric($latIn) && is_numeric($lngIn)) {
    $lat = (float)$latIn;
    $lng = (float)$lngIn;
} else {
    // Normalize the address to Calgary / AB / Canada for better geocode hit rate
    $normalized = $address;
    $hay = strtolower($address);

    if (strpos($hay, 'calgary') === false) $normalized .= ', Calgary';
    if (strpos($hay, ' ab') === false && strpos($hay, 'alberta') === false) $normalized .= ', AB';
    if (strpos($hay, 'canada') === false) $normalized .= ', Canada';

    $geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' .
              urlencode($normalized) .
              '&key=' . urlencode($solarKey);

    $geoJson = http_get_json($geoUrl);
    if (!$geoJson || ($geoJson['status'] ?? '') !== 'OK' || empty($geoJson['results'][0]['geometry']['location'])) {
        http_response_code(502);
        echo json_encode(['ok' => false, 'error' => 'Failed to geocode address']);
        exit;
    }

    $loc = $geoJson['results'][0]['geometry']['location'];
    $lat = (float)$loc['lat'];
    $lng = (float)$loc['lng'];
}

// 4) Call Google Solar buildingInsights:findClosest
function solar_find_closest(float $lat, float $lng, string $quality, string $key): ?array {
    $url = sprintf(
        'https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=%F&location.longitude=%F&requiredQuality=%s&key=%s',
        $lat,
        $lng,
        urlencode($quality),
        urlencode($key)
    );
    return http_get_json($url);
}

// Try HIGH first, then MEDIUM
$solarJson = solar_find_closest($lat, $lng, 'HIGH', $solarKey);
if (!$solarJson || empty($solarJson['solarPotential'])) {
    $solarJson = solar_find_closest($lat, $lng, 'MEDIUM', $solarKey);
}

// Defaults
$roofAreaSqft    = null;
$roofSquares     = null;
$pitchDeg        = null;
$dataSource      = null;
$areaSource      = null;
$complexityScore = null;
$complexityBand  = 'unknown';
$regionalRanges  = null;

// Try Solar
if ($solarJson && !empty($solarJson['solarPotential'])) {
    $potential = $solarJson['solarPotential'];

    $areaM2 = null;
    if (isset($potential['wholeRoofStats']['areaMeters2'])) {
        $areaM2 = (float)$potential['wholeRoofStats']['areaMeters2'];
    } elseif (isset($potential['maxArrayAreaMeters2'])) {
        $areaM2 = (float)$potential['maxArrayAreaMeters2'];
    }

    if ($areaM2 && $areaM2 > 0) {
        $areaSqft     = $areaM2 * 10.7639;
        $roofAreaSqft = $areaSqft;
        $roofSquares  = $areaSqft / 100.0;

        // Complexity from segment count
        $segmentCount = 0;
        if (!empty($potential['roofSegmentStats']) && is_array($potential['roofSegmentStats'])) {
            $segmentCount = count($potential['roofSegmentStats']);
        }
        $complexityScore = $segmentCount;
        $complexityBand  = complexity_band($segmentCount);

        // Avg pitch
        if (!empty($potential['roofSegmentStats']) && is_array($potential['roofSegmentStats'])) {
            $sum = 0.0;
            $count = 0;
            foreach ($potential['roofSegmentStats'] as $seg) {
                if (isset($seg['pitchDegrees'])) {
                    $sum += (float)$seg['pitchDegrees'];
                    $count++;
                }
            }
            if ($count > 0) $pitchDeg = $sum / $count;
        }

        $dataSource = 'Google Solar API';
        $areaSource = 'solar';
    }
}

// If Solar failed, use regional fallback
if ($roofAreaSqft === null) {
    $fallback = regional_roof_estimate($address);
    $regionalRanges = $fallback;

    $roofAreaSqft = $fallback['center'];
    $roofSquares  = $roofAreaSqft / 100.0;
    $pitchDeg     = 25.0;

    $dataSource   = 'Estimated size for your region';
    $areaSource   = 'regional';
    $complexityScore = null;
    $complexityBand  = 'unknown';
}

// 5) Send response
echo json_encode([
    'ok'              => true,
    'address'         => $address,
    'placeId'         => $placeId,
    'lat'             => $lat,
    'lng'             => $lng,
    'roofAreaSqft'    => round($roofAreaSqft),
    'roofSquares'     => round($roofSquares, 1),
    'pitchDegrees'    => $pitchDeg !== null ? round($pitchDeg, 1) : null,
    'dataSource'      => $dataSource,
    'areaSource'      => $areaSource,
    'complexityScore' => $complexityScore,
    'complexityBand'  => $complexityBand,
    'regionalRanges'  => $regionalRanges, // null unless fallback was used
]);
