<?php
// /instaquote/save-lead.php

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// Read raw JSON body
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON payload']);
    exit;
}

// Basic required fields
$address         = trim($data['address']         ?? '');
$name            = trim($data['name']            ?? '');
$email           = trim($data['email']           ?? '');
$phone           = trim($data['phone']           ?? '');
$budgetResponse  = trim($data['budgetResponse']  ?? '');
$timeline        = trim($data['timeline']        ?? '');

if ($address === '' || $name === '' || $email === '' || $phone === '' || $budgetResponse === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing required fields']);
    exit;
}

// Optional numeric/other fields
$roofAreaSqft = $data['roofAreaSqft'] ?? null;
$roofSquares  = $data['roofSquares']  ?? null;
$pitch        = $data['pitch']        ?? null;
$goodLow      = $data['goodLow']      ?? null;
$goodHigh     = $data['goodHigh']     ?? null;
$dataSource   = $data['dataSource']   ?? null;
$source       = $data['source']       ?? 'instantquote';

// Lead scoring / grade will come later
$leadScore = null;
$leadGrade = null;  // 'H', 'W', 'C' eventually

// ------------------------------------------------------------------
// LOAD CONFIG  (matches your existing /private/config.php structure)
// ------------------------------------------------------------------

$configPath = '/home/megaroofing/private/config.php';
if (!is_readable($configPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Config file not found']);
    exit;
}

$config = require $configPath;

if (
    !is_array($config) ||
    !isset($config['databases']) ||
    !isset($config['databases']['instaquote'])
) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'instaquote DB config not found']);
    exit;
}

$dbConf = $config['databases']['instaquote'];

$host    = $dbConf['host']    ?? '127.0.0.1';
$port    = $dbConf['port']    ?? 3306;
$dbName  = $dbConf['name']    ?? '';
$user    = $dbConf['user']    ?? '';
$pass    = $dbConf['pass']    ?? '';
$charset = $dbConf['charset'] ?? 'utf8mb4';

// Your config uses 'instaquote_leads', but the actual DB is
// 'megaroofing_instaquote_leads' – fix that here without
// touching config.php.
if ($dbName === 'instaquote_leads') {
    $dbName = 'megaroofing_instaquote_leads';
}

$dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit;
}

// ------------------------------------------------------------------
// INSERT LEAD
// Table structure from your screenshot: instaquote_leads
// ------------------------------------------------------------------

try {
    $sql = "INSERT INTO instaquote_leads
            (
                address,
                name,
                email,
                phone,
                budget_response,
                timeline,
                roof_area_sqft,
                roof_squares,
                pitch,
                good_low,
                good_high,
                better_low,
                better_high,
                best_low,
                best_high,
                eaves_low,
                eaves_high,
                siding_low,
                siding_high,
                lead_score,
                lead_grade,
                data_source,
                source,
                email_sent,
                email_sent_at,
                raw_json
            )
            VALUES
            (
                :address,
                :name,
                :email,
                :phone,
                :budget_response,
                :timeline,
                :roof_area_sqft,
                :roof_squares,
                :pitch,
                :good_low,
                :good_high,
                NULL,      -- better_low
                NULL,      -- better_high
                NULL,      -- best_low
                NULL,      -- best_high
                NULL,      -- eaves_low
                NULL,      -- eaves_high
                NULL,      -- siding_low
                NULL,      -- siding_high
                :lead_score,
                :lead_grade,
                :data_source,
                :source,
                0,         -- email_sent
                NULL,      -- email_sent_at
                :raw_json
            )";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':address'         => $address,
        ':name'            => $name,
        ':email'           => $email,
        ':phone'           => $phone,
        ':budget_response' => $budgetResponse,
        ':timeline'        => $timeline !== '' ? $timeline : null,
        ':roof_area_sqft'  => $roofAreaSqft !== null ? (int)$roofAreaSqft : null,
        ':roof_squares'    => $roofSquares   !== null ? (float)$roofSquares : null,
        ':pitch'           => $pitch !== null ? (string)$pitch : null,
        ':good_low'        => $goodLow  !== null ? (int)$goodLow : null,
        ':good_high'       => $goodHigh !== null ? (int)$goodHigh : null,
        ':lead_score'      => $leadScore,
        ':lead_grade'      => $leadGrade,
        ':data_source'     => $dataSource ?: null,
        ':source'          => $source,
        ':raw_json'        => $raw,
    ]);

    echo json_encode(['ok' => true]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'ok'    => false,
        'error' => 'DB error: ' . $e->getMessage()
    ]);
    exit;
}
