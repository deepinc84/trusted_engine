<?php
// /instaquote/admin/change-password.php

session_start();
require __DIR__ . '/db.php';

$errors  = [];
$notices = [];

// fetch current user
function getCurrentUser(PDO $pdo): ?array {
    if (!isset($_SESSION['admin_user_id'])) {
        return null;
    }
    $stmt = $pdo->prepare(
        "SELECT id, email, name, password_hash, role, status
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

$currentUser = getCurrentUser($pdo);
if (!$currentUser) {
    header('Location: index.php');
    exit;
}

// CSRF token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $csrf)) {
        $errors[] = 'Invalid CSRF token.';
    } else {
        $currentPassword = (string)($_POST['current_password'] ?? '');
        $newPassword     = (string)($_POST['new_password'] ?? '');
        $confirmPassword = (string)($_POST['confirm_password'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
            $errors[] = 'Please fill in all fields.';
        } elseif (!password_verify($currentPassword, $currentUser['password_hash'])) {
            $errors[] = 'Your current password is incorrect.';
        } elseif ($newPassword !== $confirmPassword) {
            $errors[] = 'New password and confirmation do not match.';
        } elseif (strlen($newPassword) < 8) {
            $errors[] = 'New password should be at least 8 characters.';
        } else {
            $hash = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare(
                "UPDATE instaquote_admin_users
                 SET password_hash = :hash
                 WHERE id = :id"
            );
            $stmt->execute([
                ':hash' => $hash,
                ':id'   => $currentUser['id'],
            ]);
            $notices[] = 'Your password has been updated.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Change Password | RoofQuote Admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50">
<div class="min-h-screen flex flex-col">

  <header class="bg-white border-b">
    <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-gray-900">RoofQuote Admin</span>
        <span class="text-xs text-gray-500">
          Logged in as <?= htmlspecialchars($currentUser['email']) ?>
        </span>
      </div>
      <div class="flex items-center gap-3">
        <a href="index.php"
           class="text-xs text-slate-600 border border-slate-200 px-3 py-1 rounded-full hover:bg-slate-50">
          Back to Dashboard
        </a>
        <a href="index.php?action=logout"
           class="text-xs text-red-600 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50">
          Logout
        </a>
      </div>
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
        <h1 class="text-lg font-semibold mb-4">Change Password</h1>
        <form method="post" class="space-y-4">
          <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrfToken) ?>">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Current password</label>
            <input type="password" name="current_password" required
                   class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">
          </div>
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
            Update Password
          </button>
        </form>
      </div>
    </div>
  </main>

  <footer class="text-center text-[11px] text-gray-400 py-4">
    © <?= date('Y') ?> Mega Roofing · RoofQuote Admin
  </footer>
</div>
</body>
</html>
