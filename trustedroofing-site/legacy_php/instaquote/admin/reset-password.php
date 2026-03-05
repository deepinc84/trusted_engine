<?php
// /instaquote/admin/reset-password.php
session_start();
require __DIR__ . '/db.php';

$errors  = [];
$notices = [];

// CSRF
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

// Get token from URL
$token = $_GET['token'] ?? '';
$token = trim($token);

if ($token === '') {
    $errors[] = 'Invalid or missing token.';
    $validReset = null;
} else {
    $tokenHash = hash('sha256', $token);

    $stmt = $pdo->prepare(
        "SELECT r.id AS reset_id,
                r.user_id,
                r.expires_at,
                r.used_at,
                u.email
         FROM instaquote_password_resets r
         JOIN instaquote_admin_users u ON u.id = r.user_id
         WHERE r.token_hash = :token_hash
         ORDER BY r.id DESC
         LIMIT 1"
    );
    $stmt->execute([':token_hash' => $tokenHash]);
    $validReset = $stmt->fetch();

    if (!$validReset) {
        $errors[] = 'Invalid or expired reset link.';
    } else {
        // Check expiry + used
        $now = new DateTimeImmutable('now');
        $exp = new DateTimeImmutable($validReset['expires_at']);

        if ($validReset['used_at'] !== null) {
            $errors[] = 'This reset link has already been used.';
        } elseif ($exp < $now) {
            $errors[] = 'This reset link has expired.';
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $validReset) {
    $csrf = $_POST['csrf'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrf)) {
        $errors[] = 'Invalid CSRF token.';
    } else {
        $newPassword     = (string)($_POST['new_password'] ?? '');
        $confirmPassword = (string)($_POST['confirm_password'] ?? '');

        if ($newPassword === '' || $confirmPassword === '') {
            $errors[] = 'Please fill in both password fields.';
        } elseif ($newPassword !== $confirmPassword) {
            $errors[] = 'New password and confirmation do not match.';
        } elseif (strlen($newPassword) < 8) {
            $errors[] = 'New password should be at least 8 characters.';
        } else {
            // Update user password
            $hash = password_hash($newPassword, PASSWORD_DEFAULT);
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare(
                    "UPDATE instaquote_admin_users
                     SET password_hash = :hash
                     WHERE id = :id"
                );
                $stmt->execute([
                    ':hash' => $hash,
                    ':id'   => $validReset['user_id'],
                ]);

                $stmt = $pdo->prepare(
                    "UPDATE instaquote_password_resets
                     SET used_at = NOW()
                     WHERE id = :id"
                );
                $stmt->execute([':id' => $validReset['reset_id']]);

                $pdo->commit();
                $notices[] = 'Your password has been reset. You can now log in.';
            } catch (Throwable $e) {
                $pdo->rollBack();
                $errors[] = 'Failed to reset password. Please try again.';
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Password | RoofQuote Admin</title>
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

      <?php if ($validReset && empty($notices)): ?>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h1 class="text-lg font-semibold mb-2">Set a new password</h1>
          <p class="text-xs text-slate-500 mb-4">
            Resetting password for <span class="font-semibold"><?= htmlspecialchars($validReset['email']) ?></span>.
          </p>
          <form method="post" class="space-y-4">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">New password</label>
              <input type="password" name="new_password" required
                     class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Confirm new password</label>
              <input type="password" name="confirm_password" required
                     class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
            </div>
            <button type="submit"
                    class="w-full mt-2 rounded-lg bg-red-600 text-white text-sm font-semibold py-2 hover:bg-red-700">
              Reset password
            </button>
          </form>
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
