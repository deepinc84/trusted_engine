<?php
// /instaquote/admin/forgot-password.php
session_start();
require __DIR__ . '/db.php';

$errors  = [];
$notices = [];

// CSRF
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

$resetLink = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrf)) {
        $errors[] = 'Invalid CSRF token.';
    } else {
        $email = trim($_POST['email'] ?? '');
        if ($email === '') {
            $errors[] = 'Please enter your admin email.';
        } else {
            // Find active user
            $stmt = $pdo->prepare(
                "SELECT id, email, status
                 FROM instaquote_admin_users
                 WHERE email = :email AND status = 'active'
                 LIMIT 1"
            );
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if (!$user) {
                // Don't leak whether the email exists
                $notices[] = 'If that email belongs to an active admin account, a reset link has been generated.';
            } else {
                $userId = (int)$user['id'];

                // Generate token + hash
                $token     = bin2hex(random_bytes(32));
                $tokenHash = hash('sha256', $token);
                $expiresAt = (new DateTime('+1 hour'))->format('Y-m-d H:i:s');

                // Insert reset row
                $stmt = $pdo->prepare(
                    "INSERT INTO instaquote_password_resets
                     (user_id, token_hash, expires_at)
                     VALUES (:user_id, :token_hash, :expires_at)"
                );
                $stmt->execute([
                    ':user_id'    => $userId,
                    ':token_hash' => $tokenHash,
                    ':expires_at' => $expiresAt,
                ]);

                // Build reset link (you can later switch this to mail())
                $resetLink = sprintf(
                    'https://megaroofing.ca/instaquote/admin/reset-password.php?token=%s',
                    urlencode($token)
                );

                $notices[] = 'A password reset link has been generated.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Forgot Password | RoofQuote Admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50">
<div class="min-h-screen flex flex-col">
  <header class="bg-white border-b">
    <div class="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900">RoofQuote Admin</span>
      </div>
      <a href="index.php"
         class="text-xs text-slate-600 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50">
        Back to login
      </a>
    </div>
  </header>

  <main class="flex-1">
    <div class="max-w-md mx-auto px-4 py-8">

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

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 class="text-lg font-semibold mb-2">Forgot your password?</h1>
        <p class="text-xs text-slate-500 mb-4">
          Enter your admin email. If it matches an active account, a password reset link will be generated.
        </p>
        <form method="post" class="space-y-4">
          <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Admin email</label>
            <input type="email" name="email" required
                   class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
          </div>
          <button type="submit"
                  class="w-full mt-2 rounded-lg bg-red-600 text-white text-sm font-semibold py-2 hover:bg-red-700">
            Generate reset link
          </button>
        </form>

        <?php if ($resetLink): ?>
          <div class="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
            <div class="font-semibold mb-1">Debug (during development):</div>
            <div>Reset link:</div>
            <div class="break-all text-blue-700">
              <?= htmlspecialchars($resetLink) ?>
            </div>
            <div class="mt-1 text-slate-500">
              In production, this would be emailed to the user instead of shown here.
            </div>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </main>

  <footer class="text-center text-[11px] text-gray-400 py-4">
    © <?= date('Y') ?> Mega Roofing · RoofQuote Admin
  </footer>
</div>
</body>
</html>
