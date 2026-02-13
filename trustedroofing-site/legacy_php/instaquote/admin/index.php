<?php
// /instaquote/admin/index.php

session_start();
ini_set('display_errors', 0);

// ---- CONFIG / DB SETUP --------------------------------------------------
// ---- CONFIG / DB SETUP --------------------------------------------------

$configPath = '/home/megaroofing/private/config.php';
if (!is_readable($configPath)) {
    die('Config file not found.');
}

$config = require $configPath;

// Must exist: $config['databases']['instaquote']
if (
    !is_array($config) ||
    !isset($config['databases']) ||
    !isset($config['databases']['instaquote'])
) {
    die('instaquote DB config missing.');
}

$dbCfg = $config['databases']['instaquote'];

$host    = $dbCfg['host']    ?? '127.0.0.1';
$port    = $dbCfg['port']    ?? 3306;
$dbName  = $dbCfg['name']    ?? '';
$user    = $dbCfg['user']    ?? '';
$pass    = $dbCfg['pass']    ?? '';
$charset = $dbCfg['charset'] ?? 'utf8mb4';

// Your config uses the short DB name "instaquote_leads"
// Your actual MySQL database is "megaroofing_instaquote_leads"
if ($dbName === 'instaquote_leads') {
    $dbName = 'megaroofing_instaquote_leads';
}

$dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";

try {
    $pdo = new PDO(
        $dsn,
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (Throwable $e) {
    die('Database connection failed: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'));
}


// ---- TABLES: ensure admin_users exists, clean pending > 7 days -----------

function ensureAdminTables(PDO $pdo): void {
    $sql = <<<SQL
CREATE TABLE IF NOT EXISTS instaquote_admin_users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email         VARCHAR(160) NOT NULL UNIQUE,
  name          VARCHAR(120) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('master','admin') NOT NULL DEFAULT 'admin',
  status        ENUM('pending','active','revoked') NOT NULL DEFAULT 'pending',
  approved_at   DATETIME NULL,
  last_login_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL;
    $pdo->exec($sql);
}

function cleanupOldPending(PDO $pdo): void {
    $sql = "DELETE FROM instaquote_admin_users
            WHERE status = 'pending'
              AND created_at < (NOW() - INTERVAL 7 DAY)";
    $pdo->exec($sql);
}

ensureAdminTables($pdo);
cleanupOldPending($pdo);

// ---- HELPERS ------------------------------------------------------------

function getCurrentUser(PDO $pdo): ?array {
    if (!isset($_SESSION['admin_user_id'])) {
        return null;
    }
    $stmt = $pdo->prepare(
        "SELECT id, email, name, role, status
         FROM instaquote_admin_users
         WHERE id = :id"
    );
    $stmt->execute([':id' => $_SESSION['admin_user_id']]);
    $user = $stmt->fetch();
    if (!$user || $user['status'] !== 'active') {
        return null;
    }
    return $user;
}

function requireCsrfToken(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!isset($_POST['csrf'], $_SESSION['csrf_token']) ||
            !hash_equals($_SESSION['csrf_token'], $_POST['csrf'])) {
            die('Invalid CSRF token.');
        }
    }
}

// CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

$errors  = [];
$notices = [];

// ---- LOGOUT -------------------------------------------------------------

if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_unset();
    session_destroy();
    header('Location: index.php');
    exit;
}

// ---- HANDLE POST ACTIONS ------------------------------------------------

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrfToken();
    $action = $_POST['action'] ?? '';

    // LOGIN ---------------------------------------------------------------
    if ($action === 'login') {
        $email    = trim($_POST['email'] ?? '');
        $password = (string)($_POST['password'] ?? '');

        if ($email === '' || $password === '') {
            $errors[] = 'Please enter both email and password.';
        } else {
            $stmt = $pdo->prepare(
                "SELECT * FROM instaquote_admin_users
                 WHERE email = :email AND status = 'active' LIMIT 1"
            );
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if (!$user || !password_verify($password, $user['password_hash'])) {
                $errors[] = 'Invalid email or password.';
            } else {
                $_SESSION['admin_user_id'] = $user['id'];
                $pdo->prepare(
                    "UPDATE instaquote_admin_users
                     SET last_login_at = NOW()
                     WHERE id = :id"
                )->execute([':id' => $user['id']]);
                header('Location: index.php');
                exit;
            }
        }
    }

    // REQUEST ACCESS ------------------------------------------------------
    if ($action === 'request_access') {
        $name     = trim($_POST['name'] ?? '');
        $email    = trim($_POST['email'] ?? '');
        $password = (string)($_POST['password'] ?? '');
        $confirm  = (string)($_POST['confirm_password'] ?? '');

        if ($name === '' || $email === '' || $password === '' || $confirm === '') {
            $errors[] = 'Please fill in all request fields.';
        } elseif (!preg_match('/@megaroofing\.ca$/i', $email)) {
            $errors[] = 'Only @megaroofing.ca email addresses are allowed.';
        } elseif ($password !== $confirm) {
            $errors[] = 'Passwords do not match.';
        } else {
            $stmt = $pdo->prepare(
                "SELECT id, status FROM instaquote_admin_users WHERE email = :email"
            );
            $stmt->execute([':email' => $email]);
            $existing = $stmt->fetch();

            if ($existing && $existing['status'] === 'active') {
                $errors[] = 'An active admin account already exists for this email.';
            } elseif ($existing && $existing['status'] === 'pending') {
                $errors[] = 'There is already a pending request for this email.';
            } else {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                if ($existing) {
                    $stmt = $pdo->prepare(
                        "UPDATE instaquote_admin_users
                         SET name = :name,
                             password_hash = :hash,
                             status = 'pending',
                             role = 'admin',
                             created_at = NOW(),
                             approved_at = NULL
                         WHERE id = :id"
                    );
                    $stmt->execute([
                        ':name' => $name,
                        ':hash' => $hash,
                        ':id'   => $existing['id'],
                    ]);
                } else {
                    $stmt = $pdo->prepare(
                        "INSERT INTO instaquote_admin_users
                         (email, name, password_hash, role, status)
                         VALUES (:email, :name, :hash, 'admin', 'pending')"
                    );
                    $stmt->execute([
                        ':email' => $email,
                        ':name'  => $name,
                        ':hash'  => $hash,
                    ]);
                }
                $notices[] = 'Request submitted. A master admin must approve your access.';
            }
        }
    }

    // MASTER: APPROVE PENDING USER ---------------------------------------
    if ($action === 'approve_user') {
        $currentUser = getCurrentUser($pdo);
        if (!$currentUser || $currentUser['role'] !== 'master') {
            $errors[] = 'Only master admins can approve users.';
        } else {
            $userId = (int)($_POST['user_id'] ?? 0);
            if ($userId > 0) {
                $stmt = $pdo->prepare(
                    "UPDATE instaquote_admin_users
                     SET status = 'active', approved_at = NOW()
                     WHERE id = :id AND status = 'pending'"
                );
                $stmt->execute([':id' => $userId]);
                $notices[] = 'User approved.';
            }
        }
    }

    // MASTER: REVOKE USER -------------------------------------------------
    if ($action === 'revoke_user') {
        $currentUser = getCurrentUser($pdo);
        if (!$currentUser || $currentUser['role'] !== 'master') {
            $errors[] = 'Only master admins can revoke users.';
        } else {
            $userId = (int)($_POST['user_id'] ?? 0);
            if ($userId > 0) {
                $stmt = $pdo->prepare(
                    "UPDATE instaquote_admin_users
                     SET status = 'revoked'
                     WHERE id = :id AND role = 'admin'"
                );
                $stmt->execute([':id' => $userId]);
                $notices[] = 'User revoked.';
            }
        }
    }
}

// ---- DASHBOARD DATA (if logged in) -------------------------------------

$currentUser = getCurrentUser($pdo);

$totalLeads = $hotLeads = $warmLeads = $coldLeads = 0;
$pipelineValue = 0;
$recentLeads = [];
$pendingUsers = [];

if ($currentUser) {
    $totalLeads = (int)$pdo->query(
        "SELECT COUNT(*) AS c FROM instaquote_leads"
    )->fetch()['c'];

    $hotLeads = (int)$pdo->query(
        "SELECT COUNT(*) AS c FROM instaquote_leads WHERE lead_grade = 'H'"
    )->fetch()['c'];

    $warmLeads = (int)$pdo->query(
        "SELECT COUNT(*) AS c FROM instaquote_leads WHERE lead_grade = 'W'"
    )->fetch()['c'];

    $coldLeads = (int)$pdo->query(
        "SELECT COUNT(*) AS c FROM instaquote_leads WHERE lead_grade = 'C'"
    )->fetch()['c'];

    $pipelineValueRow = $pdo->query(
        "SELECT COALESCE(SUM(good_high), 0) AS total FROM instaquote_leads"
    )->fetch();
    $pipelineValue = (int)$pipelineValueRow['total'];

    $stmt = $pdo->query(
        "SELECT id, created_at, name, email, phone, address,
                lead_grade, lead_score, good_low, good_high, roof_area_sqft
         FROM instaquote_leads
         ORDER BY created_at DESC
         LIMIT 10"
    );
    $recentLeads = $stmt->fetchAll();

    if ($currentUser['role'] === 'master') {
        $stmt = $pdo->query(
            "SELECT id, email, name, created_at
             FROM instaquote_admin_users
             WHERE status = 'pending'
             ORDER BY created_at ASC"
        );
        $pendingUsers = $stmt->fetchAll();
    }
}

// ---- HTML OUTPUT (same as before) --------------------------------------
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RoofQuote Admin | Mega Roofing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50">
<div class="min-h-screen flex flex-col">

  <header class="bg-white border-b">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900">RoofQuote Admin</span>
        <?php if ($currentUser): ?>
          <span class="text-xs text-gray-500">
            Logged in as <?= htmlspecialchars($currentUser['email']) ?>
            (<?= htmlspecialchars($currentUser['role']) ?>)
          </span>
        <?php endif; ?>
      </div>
          <div class="flex items-center gap-3">
      <?php if ($currentUser): ?>
      <?php if ($currentUser['role'] === 'master'): ?>
          <a href="users.php"
             class="text-xs text-slate-600 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50">
            Users
          </a>
        <?php endif; ?>
        <a href="change-password.php"
           class="text-xs text-slate-600 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50">
          Change password
        </a>
        <a href="index.php?action=logout"
           class="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50">
          Logout
        </a>
      <?php endif; ?>
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

      <?php if (!$currentUser): ?>
        <!-- LOGIN + REQUEST ACCESS -->
        <div class="grid gap-8 md:grid-cols-2 mt-6">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 class="text-lg font-semibold mb-1">Admin Login</h2>
            <p class="text-xs text-gray-500 mb-4">
              Use your approved Mega Roofing admin account to access leads.
            </p>
            <form method="post" class="space-y-4">
              <input type="hidden" name="action" value="login">
              <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" required
                       class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required
                       class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
              </div>
              <button type="submit"
                      class="w-full mt-2 rounded-lg bg-red-600 text-white text-sm font-semibold py-2 hover:bg-red-700">
                Sign In
              </button>
              <div class="flex items-center justify-between mt-1">
  <span class="text-[11px] text-gray-400">
    Only approved admins can log in.
  </span>
  <a href="forgot-password.php"
     class="text-[11px] text-blue-600 hover:underline">
    Forgot password?
  </a>
</div>

            </form>
          </div>

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 class="text-lg font-semibold mb-1">Request Admin Access</h2>
            <p class="text-xs text-gray-500 mb-4">
              Only <span class="font-semibold">@megaroofing.ca</span> addresses are allowed.
              A master admin must approve your request. Pending requests older than 7 days
              are automatically removed.
            </p>
            <form method="post" class="space-y-3">
              <input type="hidden" name="action" value="request_access">
              <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input type="text" name="name" required
                       class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Work Email</label>
                <input type="email" name="email" required
                       placeholder="you@megaroofing.ca"
                       class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" name="password" required
                         class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Confirm</label>
                  <input type="password" name="confirm_password" required
                         class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
                </div>
              </div>
              <button type="submit"
                      class="w-full mt-2 rounded-lg bg-slate-900 text-white text-sm font-semibold py-2 hover:bg-black">
                Submit Request
              </button>
            </form>
          </div>
        </div>

            <?php else: ?>
        <!-- DASHBOARD -->
        <div class="space-y-8 mt-4">

          <!-- Top stats -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-4">
              <div class="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
                Total leads
              </div>
              <div class="text-2xl font-bold text-slate-900">
                <?= number_format($totalLeads) ?>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4">
              <div class="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
                Hot
              </div>
              <div class="text-2xl font-bold text-red-600">
                <?= number_format($hotLeads) ?>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4">
              <div class="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
                Warm
              </div>
              <div class="text-2xl font-bold text-amber-500">
                <?= number_format($warmLeads) ?>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4">
              <div class="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
                Cold
              </div>
              <div class="text-2xl font-bold text-slate-500">
                <?= number_format($coldLeads) ?>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4">
              <div class="text-[11px] text-slate-500 uppercase tracking-wide mb-1">
                Pipeline (Good high)
              </div>
              <div class="text-xl font-bold text-emerald-600">
                $<?= number_format($pipelineValue) ?>
              </div>
            </div>
          </div>

          <!-- Recent leads + Pending users -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Recent leads -->
            <div class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4">
              <div class="flex items-center justify-between mb-3">
                <h2 class="text-sm font-semibold text-slate-900">
                  Recent InstantQuote leads
                </h2>
                <span class="text-[11px] text-slate-400">
                  Last 10 submissions
                </span>
              </div>

              <?php if (empty($recentLeads)): ?>
                <p class="text-xs text-slate-500">
                  No leads yet. Once someone submits the InstantQuote form, they’ll appear here.
                </p>
              <?php else: ?>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-xs">
                    <thead>
                      <tr class="text-left text-slate-500 border-b border-slate-100">
                        <th class="py-2 pr-4">When</th>
                        <th class="py-2 pr-4">Name</th>
                        <th class="py-2 pr-4">Contact</th>
                        <th class="py-2 pr-4">Address</th>
                        <th class="py-2 pr-4">Good range</th>
                        <th class="py-2 pr-4">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php foreach ($recentLeads as $lead): ?>
                        <tr class="border-b border-slate-50 hover:bg-slate-50">
                          <td class="py-2 pr-4 align-top text-slate-500">
                            <?= htmlspecialchars($lead['created_at'] ?? '') ?>
                          </td>
                          <td class="py-2 pr-4 align-top">
                            <div class="font-medium text-slate-900">
                              <?= htmlspecialchars($lead['name'] ?? 'Unknown') ?>
                            </div>
                            <div class="text-[11px] text-slate-400">
                              <?= htmlspecialchars($lead['email'] ?? '') ?>
                            </div>
                          </td>
                          <td class="py-2 pr-4 align-top text-slate-700">
                            <?= htmlspecialchars($lead['phone'] ?? '') ?>
                          </td>
                          <td class="py-2 pr-4 align-top text-slate-700 max-w-xs">
                            <div class="line-clamp-2">
                              <?= htmlspecialchars($lead['address'] ?? '') ?>
                            </div>
                          </td>
                          <td class="py-2 pr-4 align-top">
                            <?php if (!is_null($lead['good_low']) && !is_null($lead['good_high'])): ?>
                              <div class="font-semibold text-slate-900">
                                $<?= number_format($lead['good_low']) ?>
                                –
                                $<?= number_format($lead['good_high']) ?>
                              </div>
                              <?php if (!is_null($lead['roof_area_sqft'])): ?>
                                <div class="text-[11px] text-slate-400">
                                  <?= (int)$lead['roof_area_sqft'] ?> sqft
                                </div>
                              <?php endif; ?>
                            <?php else: ?>
                              <span class="text-[11px] text-slate-400">Pending estimate</span>
                            <?php endif; ?>
                          </td>
                          <td class="py-2 pr-4 align-top">
                            <?php
                              $grade = $lead['lead_grade'] ?? null;
                              $score = $lead['lead_score'] ?? null;
                              $label = '—';
                              $chipClass = 'bg-slate-100 text-slate-600';

                              if ($grade === 'H') { $label = 'Hot';  $chipClass = 'bg-red-100 text-red-700'; }
                              elseif ($grade === 'W') { $label = 'Warm'; $chipClass = 'bg-amber-100 text-amber-700'; }
                              elseif ($grade === 'C') { $label = 'Cold'; $chipClass = 'bg-slate-100 text-slate-600'; }
                            ?>
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium <?= $chipClass ?>">
                              <?= $label ?>
                              <?php if (!is_null($score)): ?>
                                <span class="ml-1 opacity-80">(<?= (int)$score ?>)</span>
                              <?php endif; ?>
                            </span>
                          </td>
                        </tr>
                      <?php endforeach; ?>
                    </tbody>
                  </table>
                </div>
              <?php endif; ?>
            </div>

            <!-- Pending user requests (master only) -->
            <?php if ($currentUser['role'] === 'master'): ?>
              <div class="bg-white border border-slate-200 rounded-2xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm font-semibold text-slate-900">
                    Pending admin requests
                  </h2>
                  <span class="text-[11px] text-slate-400">
                    Auto-purged after 7 days
                  </span>
                </div>

                <?php if (empty($pendingUsers)): ?>
                  <p class="text-xs text-slate-500">
                    No pending requests right now.
                  </p>
                <?php else: ?>
                  <div class="space-y-3">
                    <?php foreach ($pendingUsers as $u): ?>
                      <div class="border border-slate-100 rounded-xl p-3 text-xs flex items-start justify-between gap-3">
                        <div>
                          <div class="font-semibold text-slate-900">
                            <?= htmlspecialchars($u['name'] ?? 'Unknown') ?>
                          </div>
                          <div class="text-slate-500">
                            <?= htmlspecialchars($u['email'] ?? '') ?>
                          </div>
                          <div class="text-[11px] text-slate-400 mt-1">
                            Requested: <?= htmlspecialchars($u['created_at'] ?? '') ?>
                          </div>
                        </div>
                        <div class="flex flex-col gap-1">
                          <form method="post">
                            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
                            <input type="hidden" name="action" value="approve_user">
                            <input type="hidden" name="user_id" value="<?= (int)$u['id'] ?>">
                            <button type="submit"
                                    class="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700">
                              Approve
                            </button>
                          </form>
                          <form method="post">
                            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
                            <input type="hidden" name="action" value="revoke_user">
                            <input type="hidden" name="user_id" value="<?= (int)$u['id'] ?>">
                            <button type="submit"
                                    class="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-300">
                              Reject
                            </button>
                          </form>
                        </div>
                      </div>
                    <?php endforeach; ?>
                  </div>
                <?php endif; ?>
              </div>
            <?php endif; ?>

          </div>

        </div>
      <?php endif; ?>
    </div>
  </main>

  <footer class="text-center text-[11px] text-gray-400 py-4">
    © <?= date('Y') ?> Mega Roofing · RoofQuote Admin
  </footer>
</div>
</body>
</html>
