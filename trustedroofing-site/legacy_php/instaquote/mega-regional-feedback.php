<?php
// /instaquote/mega-regional-feedback.php
// Logs when a user refines a regional estimate

ini_set('display_errors', 0);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
  exit;
}

$address = trim((string)($data['address'] ?? ''));
$baseSqft = (float)($data['baseSqft'] ?? 0);
$shownSqft = (float)($data['shownSqft'] ?? 0);
$sizeChoice = trim((string)($data['sizeChoice'] ?? ''));
$complexityChoice = trim((string)($data['complexityChoice'] ?? ''));
$reason = trim((string)($data['reason'] ?? ''));

if ($address === '') {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Address required']);
  exit;
}

$logPath = '/home/megaroofing/private/instaquote_regional_feedback.csv';
$isNew = !file_exists($logPath);

$fp = @fopen($logPath, 'a');
if (!$fp) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Unable to write log']);
  exit;
}

if (flock($fp, LOCK_EX)) {
  if ($isNew) {
    fputcsv($fp, ['ts', 'address', 'baseSqft', 'shownSqft', 'sizeChoice', 'complexityChoice', 'reason']);
  }
  fputcsv($fp, [
    date('c'),
    $address,
    $baseSqft,
    $shownSqft,
    $sizeChoice,
    $complexityChoice,
    $reason
  ]);
  fflush($fp);
  flock($fp, LOCK_UN);
}

fclose($fp);

echo json_encode(['ok' => true]);
