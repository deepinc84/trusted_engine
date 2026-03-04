
<?php
// /instaquote/admin/data/index.php

session_start();
ini_set('display_errors', 0);

// CONFIG AND DB CONNECTION
$configPath = '/home/megaroofing/private/config.php';
if (!is_readable($configPath)) {
    die('Config file not found.');
}

$config = require $configPath;

if (
    !is_array($config) ||
    !isset($config['databases']) ||
    !is_array($config['databases']) ||
    !isset($config['databases']['instaquote'])
) {
    die('instaquote DB config missing.');
}

$dbCfg = $config['databases']['instaquote'];

$dsn = sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
    $dbCfg['host'],
    $dbCfg['port'],
    $dbCfg['name']
);

try {
    $pdo = new PDO(
        $dsn,
        $dbCfg['user'],
        $dbCfg['pass'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (Throwable $e) {
    die('Database connection failed.');
}

// CREATE TABLE IF NEEDED
function ensureAccuracyTable(PDO $pdo): void {
    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS instaquote_accuracy_data (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  lead_id                   INT UNSIGNED NOT NULL,
  google_roof_sqft          INT UNSIGNED NULL,
  google_roof_pitch_deg     DECIMAL(5,2) NULL,
  insta_siding_sqft_estimate INT UNSIGNED NULL,
  insta_gutter_lft_estimate INT UNSIGNED NULL,
  insta_good_low            INT UNSIGNED NULL,
  insta_good_high           INT UNSIGNED NULL,
  insta_better_low          INT UNSIGNED NULL,
  insta_better_high         INT UNSIGNED NULL,
  insta_best_low            INT UNSIGNED NULL,
  insta_best_high           INT UNSIGNED NULL,
  siding_low                INT UNSIGNED NULL,
  siding_high               INT UNSIGNED NULL,
  gutter_low                INT UNSIGNED NULL,
  gutter_high               INT UNSIGNED NULL,
  hardie_low                INT UNSIGNED NULL,
  hardie_high               INT UNSIGNED NULL,
  gutter6_low               INT UNSIGNED NULL,
  gutter6_high              INT UNSIGNED NULL,
  actual_roof_sqft          INT UNSIGNED NULL,
  actual_roof_pitch_deg     DECIMAL(5,2) NULL,
  actual_siding_sqft        INT UNSIGNED NULL,
  actual_gutter_lft         INT UNSIGNED NULL,
  collection_closed         TINYINT(1) NOT NULL DEFAULT 0,
  collection_closed_at      DATETIME NULL,
  CONSTRAINT fk_accuracy_lead
    FOREIGN KEY (lead_id)
    REFERENCES instaquote_leads(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;

    $pdo->exec($sql);
}

ensureAccuracyTable($pdo);

// CSRF
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

function requireCsrf(string $token): void {
    if (
        !isset($_SESSION['csrf_token']) ||
        !hash_equals($_SESSION['csrf_token'], $token)
    ) {
        die('Invalid CSRF token.');
    }
}

$errors  = [];
$notices = [];

// CSV EXPORT
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    $stmt = $pdo->query(
        "SELECT
            a.*,
            l.address,
            l.name,
            l.email,
            l.phone
         FROM instaquote_accuracy_data a
         INNER JOIN instaquote_leads l ON a.lead_id = l.id
         ORDER BY a.created_at DESC"
    );
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="instaquote_accuracy_data.csv"');

    $out = fopen('php://output', 'w');

    // Header row
    fputcsv($out, [
        'id',
        'lead_id',
        'created_at',
        'updated_at',
        'collection_closed',
        'collection_closed_at',
        'lead_name',
        'lead_email',
        'lead_phone',
        'lead_address',
        'google_roof_sqft',
        'google_roof_pitch_deg',
        'insta_siding_sqft_estimate',
        'insta_gutter_lft_estimate',
        'insta_good_low',
        'insta_good_high',
        'insta_better_low',
        'insta_better_high',
        'insta_best_low',
        'insta_best_high',
        'siding_low',
        'siding_high',
        'gutter_low',
        'gutter_high',
        'hardie_low',
        'hardie_high',
        'gutter6_low',
        'gutter6_high',
        'actual_roof_sqft',
        'actual_roof_pitch_deg',
        'actual_siding_sqft',
        'actual_gutter_lft'
    ]);

    foreach ($rows as $r) {
        fputcsv($out, [
            $r['id'],
            $r['lead_id'],
            $r['created_at'],
            $r['updated_at'],
            $r['collection_closed'],
            $r['collection_closed_at'],
            $r['name'] ?? '',
            $r['email'] ?? '',
            $r['phone'] ?? '',
            $r['address'] ?? '',
            $r['google_roof_sqft'],
            $r['google_roof_pitch_deg'],
            $r['insta_siding_sqft_estimate'],
            $r['insta_gutter_lft_estimate'],
            $r['insta_good_low'],
            $r['insta_good_high'],
            $r['insta_better_low'],
            $r['insta_better_high'],
            $r['insta_best_low'],
            $r['insta_best_high'],
            $r['siding_low'],
            $r['siding_high'],
            $r['gutter_low'],
            $r['gutter_high'],
            $r['hardie_low'],
            $r['hardie_high'],
            $r['gutter6_low'],
            $r['gutter6_high'],
            $r['actual_roof_sqft'],
            $r['actual_roof_pitch_deg'],
            $r['actual_siding_sqft'],
            $r['actual_gutter_lft'],
        ]);
    }

    fclose($out);
    exit;
}

// HANDLE POST (update actuals, close collection)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $csrf   = $_POST['csrf'] ?? '';
    requireCsrf($csrf);

    if ($action === 'update_row') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id <= 0) {
            $errors[] = 'Invalid row.';
        } else {
            $actualRoofSqft   = trim($_POST['actual_roof_sqft'] ?? '');
            $actualPitchDeg   = trim($_POST['actual_roof_pitch_deg'] ?? '');
            $actualSidingSqft = trim($_POST['actual_siding_sqft'] ?? '');
            $actualGutterLft  = trim($_POST['actual_gutter_lft'] ?? '');
            $closeCollection  = isset($_POST['close_collection']) ? 1 : 0;

            $params = [
                ':id'                  => $id,
                ':actual_roof_sqft'    => ($actualRoofSqft === '' ? null : (int)$actualRoofSqft),
                ':actual_roof_pitch'   => ($actualPitchDeg === '' ? null : (float)$actualPitchDeg),
                ':actual_siding_sqft'  => ($actualSidingSqft === '' ? null : (int)$actualSidingSqft),
                ':actual_gutter_lft'   => ($actualGutterLft === '' ? null : (int)$actualGutterLft),
                ':collection_closed'   => $closeCollection,
            ];

            $extraSet = '';
            if ($closeCollection) {
                $extraSet = ', collection_closed_at = CASE WHEN collection_closed = 0 THEN NOW() ELSE collection_closed_at END';
            }

            $sql = "
                UPDATE instaquote_accuracy_data
                SET
                  actual_roof_sqft       = :actual_roof_sqft,
                  actual_roof_pitch_deg  = :actual_roof_pitch,
                  actual_siding_sqft     = :actual_siding_sqft,
                  actual_gutter_lft      = :actual_gutter_lft,
                  collection_closed      = :collection_closed
                  $extraSet
                WHERE id = :id
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $notices[] = 'Row updated.';
        }
    }
}

// LOAD DATA FOR DASHBOARD
// You can change the limit if you want, or filter on collection_closed
$filter = $_GET['filter'] ?? 'open';
$where  = '';
if ($filter === 'open') {
    $where = 'WHERE a.collection_closed = 0';
} elseif ($filter === 'closed') {
    $where = 'WHERE a.collection_closed = 1';
}

$sql = "
    SELECT
        a.*,
        l.address,
        l.name,
        l.email,
        l.phone
    FROM instaquote_accuracy_data a
    INNER JOIN instaquote_leads l ON a.lead_id = l.id
    $where
    ORDER BY a.created_at DESC
    LIMIT 100
";
$stmt = $pdo->query($sql);
$rows = $stmt->fetchAll();

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>InstaQuote Data Lab | Mega Roofing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50">
<div class="min-h-screen flex flex-col">

  <header class="bg-white border-b">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900">InstaQuote Data Lab</span>
        <span class="text-xs text-gray-500">
          Algorithm training data for InstaQuote and MegaScope
        </span>
      </div>
      <div class="flex items-center gap-3">
        <a href="/instaquote/admin/index.php"
           class="text-xs text-slate-600 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50">
          Back to InstaQuote Admin
        </a>
        <a href="?export=csv"
           class="text-xs text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-50">
          Download CSV
        </a>
      </div>
    </div>
  </header>

  <main class="flex-1">
    <div class="max-w-6xl mx-auto px-4 py-6">

      <?php if (!empty($errors)): ?>
        <div class="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <?php foreach ($errors as $e): ?>
            <div><?= htmlspecialchars($e) ?></div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <?php if (!empty($notices)): ?>
        <div class="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          <?php foreach ($notices as $n): ?>
            <div><?= htmlspecialchars($n) ?></div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-lg font-semibold text-slate-900">Collected Data</h1>
          <p class="text-xs text-slate-500">
            Non editable InstaQuote and Google data on the left. Actual measurements on the right.
          </p>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-500">Filter</span>
          <a href="?filter=open"
             class="px-2 py-1 rounded-full border text-xs
                    <?= $filter === 'open' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600' ?>">
            Open only
          </a>
          <a href="?filter=closed"
             class="px-2 py-1 rounded-full border text-xs
                    <?= $filter === 'closed' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600' ?>">
            Closed only
          </a>
          <a href="?filter=all"
             class="px-2 py-1 rounded-full border text-xs
                    <?= $filter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600' ?>">
            All
          </a>
        </div>
      </div>

      <?php if (empty($rows)): ?>
        <p class="text-xs text-slate-500">
          No accuracy data found yet. Once InstaQuote starts writing to
          <span class="font-mono text-[11px]">instaquote_accuracy_data</span>,
          it will show up here.
        </p>
      <?php else: ?>
        <div class="space-y-4">
          <?php foreach ($rows as $r): ?>
            <?php
              $isClosed = (int)$r['collection_closed'] === 1;
            ?>
            <div class="bg-white border border-slate-200 rounded-2xl p-4">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <div class="text-sm font-semibold text-slate-900">
                    <?= htmlspecialchars($r['address'] ?? 'Unknown address') ?>
                  </div>
                  <div class="text-[11px] text-slate-500">
                    Lead #<?= (int)$r['lead_id'] ?>
                    <?php if (!empty($r['name'])): ?>
                      · <?= htmlspecialchars($r['name']) ?>
                    <?php endif; ?>
                    <?php if (!empty($r['email'])): ?>
                      · <?= htmlspecialchars($r['email']) ?>
                    <?php endif; ?>
                    <?php if (!empty($r['phone'])): ?>
                      · <?= htmlspecialchars($r['phone']) ?>
                    <?php endif; ?>
                  </div>
                </div>
                <div class="text-right">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium
                    <?= $isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700' ?>">
                    <?= $isClosed ? 'Collection closed' : 'Collection open' ?>
                  </span>
                  <div class="text-[11px] text-slate-400 mt-1">
                    Created <?= htmlspecialchars($r['created_at']) ?>
                  </div>
                </div>
              </div>

              <div class="grid md:grid-cols-2 gap-4 text-xs">
                <!-- LEFT: STORED GOOGLE AND INSTAQUOTE DATA (READ ONLY) -->
                <div class="border border-slate-100 rounded-xl p-3 bg-slate-50">
                  <div class="font-semibold text-slate-800 mb-2">InstaQuote and Google data</div>

                  <div class="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div class="text-slate-500">Google roof sqft</div>
                    <div class="text-slate-800">
                      <?= htmlspecialchars($r['google_roof_sqft'] ?? '') ?>
                    </div>

                    <div class="text-slate-500">Google pitch (deg)</div>
                    <div class="text-slate-800">
                      <?= htmlspecialchars($r['google_roof_pitch_deg'] ?? '') ?>
                    </div>

                    <div class="text-slate-500">Insta siding sqft</div>
                    <div class="text-slate-800">
                      <?= htmlspecialchars($r['insta_siding_sqft_estimate'] ?? '') ?>
                    </div>

                    <div class="text-slate-500">Insta gutters lft</div>
                    <div class="text-slate-800">
                      <?= htmlspecialchars($r['insta_gutter_lft_estimate'] ?? '') ?>
                    </div>
                  </div>

                  <div class="mt-3 border-t border-slate-200 pt-2">
                    <div class="font-semibold text-[11px] text-slate-700 mb-1">
                      Roof price bands (good / better / best)
                    </div>
                    <div class="space-y-0.5">
                      <div class="flex justify-between">
                        <span class="text-slate-500">Good</span>
                        <span class="text-slate-800">
                          <?= htmlspecialchars($r['insta_good_low'] ?? '') ?>
                          to
                          <?= htmlspecialchars($r['insta_good_high'] ?? '') ?>
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Better</span>
                        <span class="text-slate-800">
                          <?= htmlspecialchars($r['insta_better_low'] ?? '') ?>
                          to
                          <?= htmlspecialchars($r['insta_better_high'] ?? '') ?>
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Best</span>
                        <span class="text-slate-800">
                          <?= htmlspecialchars($r['insta_best_low'] ?? '') ?>
                          to
                          <?= htmlspecialchars($r['insta_best_high'] ?? '') ?>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-3 border-t border-slate-200 pt-2">
                    <div class="font-semibold text-[11px] text-slate-700 mb-1">
                      Siding, gutters, upgrades (low high)
                    </div>
                    <div class="space-y-0.5">
                      <div class="flex justify-between">
                        <span class="text-slate-500">Siding</span>
                        <span class="text-slate-800">
                          <?= htmlspecialchars($r['siding_low'] ?? '') ?>
                          to
                          <?= htmlspecialchars($r['siding_high'] ?? '') ?>
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Gutters</span>
                        <span class="text-slate-800">
                          <?= htmlspecialchars($r['gutter_low'] ?? '') ?>
                          to
                          <?= htmlspecialchars($r['gutter_high'] ?? '') ?>
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Hardie</span>
                        <span class="text-slate-800">
                          <?= htmlspecialchars($r['hardie_low'] ?? '') ?>
                          to
                          <?= htmlspecialchars($r['hardie_high'] ?? '') ?>
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-slate-500">Six inch gutters</span>
                        <span class="text-slate-800">
                          <?= htmlspecialchars($r['gutter6_low'] ?? '') ?>
                          to
                          <?= htmlspecialchars($r['gutter6_high'] ?? '') ?>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- RIGHT: ACTUAL MEASUREMENTS AND CONTROLS -->
                <div class="border border-slate-100 rounded-xl p-3 bg-white">
                  <div class="font-semibold text-slate-800 mb-2">Actuals and collection status</div>

                  <form method="post" class="space-y-3">
                    <input type="hidden" name="action" value="update_row">
                    <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
                    <input type="hidden" name="id" value="<?= (int)$r['id'] ?>">

                    <div class="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label class="block text-slate-600 mb-1">
                          Actual roof sqft
                        </label>
                        <input
                          type="number"
                          name="actual_roof_sqft"
                          value="<?= htmlspecialchars($r['actual_roof_sqft'] ?? '') ?>"
                          class="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                      </div>
                      <div>
                        <label class="block text-slate-600 mb-1">
                          Actual pitch (deg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="actual_roof_pitch_deg"
                          value="<?= htmlspecialchars($r['actual_roof_pitch_deg'] ?? '') ?>"
                          class="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                      </div>
                      <div>
                        <label class="block text-slate-600 mb-1">
                          Actual siding sqft
                        </label>
                        <input
                          type="number"
                          name="actual_siding_sqft"
                          value="<?= htmlspecialchars($r['actual_siding_sqft'] ?? '') ?>"
                          class="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                      </div>
                      <div>
                        <label class="block text-slate-600 mb-1">
                          Actual gutters lft
                        </label>
                        <input
                          type="number"
                          name="actual_gutter_lft"
                          value="<?= htmlspecialchars($r['actual_gutter_lft'] ?? '') ?>"
                          class="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                      </div>
                    </div>

                    <div class="flex items-center justify-between mt-2">
                      <label class="inline-flex items-center gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          name="close_collection"
                          value="1"
                          <?= $isClosed ? 'checked' : '' ?>
                          class="rounded border-slate-300 text-red-600 focus:ring-red-500"
                        >
                        <span>Close data collection for this lead</span>
                      </label>
                      <?php if (!empty($r['collection_closed_at'])): ?>
                        <span class="text-[11px] text-slate-400">
                          Closed <?= htmlspecialchars($r['collection_closed_at']) ?>
                        </span>
                      <?php endif; ?>
                    </div>

                    <div class="pt-2">
                      <button type="submit"
                              class="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 hover:bg-black">
                        Save row
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

    </div>
  </main>

  <footer class="text-center text-[11px] text-gray-400 py-4">
    © <?= date('Y') ?> Mega Roofing · InstaQuote Data Lab
  </footer>
</div>
</body>
</html>
