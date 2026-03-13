<?php
// /geo-app/dashboard/index.php
require __DIR__ . '/../db.php'; // $pdo

// --- Get distinct months for filter dropdown ---
$months = [];
$monthStmt = $pdo->query("SELECT DISTINCT DATE_FORMAT(created_at,'%Y-%m') AS ym FROM geo_posts ORDER BY ym DESC");
$months = $monthStmt->fetchAll(PDO::FETCH_COLUMN);

// --- Read filters from querystring ---
$filterMonth  = $_GET['month']  ?? '';
$filterAuthor = trim($_GET['author']  ?? '');
$filterKeyword= trim($_GET['keyword'] ?? '');

// --- Build query dynamically ---
$sql = "SELECT id, user_name, keyword, street_address, city, created_at, word_count, post_og
        FROM geo_posts
        WHERE 1";

$params = [];

if ($filterAuthor !== '') {
    $sql .= " AND user_name LIKE :author";
    $params[':author'] = '%'.$filterAuthor.'%';
}

if ($filterKeyword !== '') {
    $sql .= " AND keyword LIKE :kw";
    $params[':kw'] = '%'.$filterKeyword.'%';
}

if ($filterMonth !== '') {
    // Expecting YYYY-MM
    [$y, $m] = explode('-', $filterMonth);
    $start = sprintf('%04d-%02d-01', (int)$y, (int)$m);
    // first day of next month
    $nextMonth = (int)$m + 1;
    $nextYear  = (int)$y;
    if ($nextMonth === 13) { $nextMonth = 1; $nextYear++; }
    $end = sprintf('%04d-%02d-01', $nextYear, $nextMonth);

    $sql .= " AND created_at >= :start AND created_at < :end";
    $params[':start'] = $start;
    $params[':end']   = $end;
}

$sql .= " ORDER BY created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

// -------- Similarity helpers --------
function normalize_text_for_similarity($text) {
    $text = strtolower($text);
    // replace non letters/numbers with space
    $text = preg_replace('/[^a-z0-9]+/i', ' ', $text);
    $text = trim($text);
    if ($text === '') return [];
    $words = preg_split('/\s+/', $text);
    // filter out very short words (like "a", "to")
    $filtered = [];
    foreach ($words as $w) {
        if (strlen($w) >= 3) {
            $filtered[] = $w;
        }
    }
    // unique set
    return array_values(array_unique($filtered));
}

function jaccard_similarity(array $a, array $b) {
    if (!$a || !$b) return 0.0;
    $setA = array_flip($a);
    $setB = array_flip($b);

    $intersect = 0;
    foreach ($setA as $word => $_) {
        if (isset($setB[$word])) {
            $intersect++;
        }
    }
    $union = count($setA) + count($setB) - $intersect;
    if ($union === 0) return 0.0;
    return $intersect / $union;
}

// -------- Build similarity flags (across ALL posts, not just filtered) --------
$simFlags = [];
if (!empty($posts)) {
    // Precompute word sets
    $wordSets = [];
    foreach ($posts as $idx => $p) {
        $wordSets[$idx] = normalize_text_for_similarity($p['post_og']);
    }

    $threshold = 0.60; // 60% overlap
    $maxPairs  = 50;   // safety cap

    for ($i = 0; $i < count($posts); $i++) {
        for ($j = $i + 1; $j < count($posts); $j++) {
            $sim = jaccard_similarity($wordSets[$i], $wordSets[$j]);
            if ($sim >= $threshold) {
                $simFlags[] = [
                    'sim' => $sim,
                    'a'   => $posts[$i],
                    'b'   => $posts[$j],
                ];
                if (count($simFlags) >= $maxPairs) {
                    break 2;
                }
            }
        }
    }

    // sort by similarity descending
    usort($simFlags, function($x, $y) {
        return $y['sim'] <=> $x['sim'];
    });
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Geo Posts Dashboard | Mega Roofing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root{
      --mega-red:#B22222;
      --mega-red-dark:#8f1b1b;
      --ink:#1f2937;
      --muted:#6b7280;
      --bg:#f7f7f8;
      --white:#ffffff;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;
      color:var(--ink);
      background: radial-gradient(1200px 800px at 50% -10%, #fff 0, #fff 40%, #fdeaea 100%);
      min-height:100vh;
      display:flex;
      align-items:flex-start;
      justify-content:center;
      padding:32px 12px;
    }
    .card{
      width:100%;
      max-width:1100px;
      background:var(--white);
      border-radius:18px;
      box-shadow:0 10px 30px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.04);
      border:1px solid #eee;
      overflow:hidden;
    }
    .card-header{
      background:linear-gradient(135deg,var(--mega-red),#d23333);
      padding:20px 24px;
      color:#fff;
      display:flex;
      align-items:center;
      justify-content:space-between;
      flex-wrap:wrap;
      gap:12px;
    }
    .brand{
      display:flex;
      align-items:center;
      gap:12px;
    }
    .brand img{
      height:42px;
    }
    .brand h1{
      margin:0;
      font-size:20px;
      letter-spacing:0.2px;
    }
    .card-body{
      padding:20px 24px 24px;
    }

    .filters{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:12px;
      margin-bottom:16px;
    }
    @media(max-width:900px){
      .filters{grid-template-columns:1fr 1fr;}
    }
    @media(max-width:600px){
      .filters{grid-template-columns:1fr;}
    }
    label{
      font-size:12px;
      font-weight:600;
      color:var(--muted);
      text-transform:uppercase;
      letter-spacing:.05em;
    }
    .filters input,.filters select{
      width:100%;
      padding:8px 10px;
      border-radius:10px;
      border:1px solid #e5e7eb;
      font-size:14px;
      margin-top:4px;
    }
    .filters button{
      margin-top:22px;
      padding:10px 14px;
      border-radius:999px;
      border:none;
      cursor:pointer;
      background:var(--mega-red);
      color:#fff;
      font-weight:600;
      box-shadow:0 4px 10px rgba(178,34,34,.25);
    }
    .filters button:hover{background:var(--mega-red-dark);}

    table{
      width:100%;
      border-collapse:collapse;
      font-size:14px;
    }
    thead{
      background:#f3f4f6;
    }
    th,td{
      padding:10px 8px;
      border-bottom:1px solid #e5e7eb;
      text-align:left;
      vertical-align:top;
    }
    th{
      font-size:12px;
      text-transform:uppercase;
      letter-spacing:.06em;
      color:var(--muted);
    }
    tbody tr:hover{
      background:#f9fafb;
    }
    .tag{
      display:inline-block;
      padding:2px 7px;
      border-radius:999px;
      background:#fff0f0;
      color:var(--mega-red);
      font-size:11px;
      border:1px solid #fed7d7;
    }
    .small{
      font-size:12px;
      color:var(--muted);
    }
    .btn-link{
      display:inline-flex;
      align-items:center;
      padding:6px 10px;
      border-radius:999px;
      border:1px solid #e5e7eb;
      font-size:12px;
      text-decoration:none;
      color:var(--mega-red);
      font-weight:600;
    }
    .btn-link:hover{
      border-color:var(--mega-red);
      background:#fff5f5;
    }
    .empty{
      padding:16px 4px;
      font-size:14px;
      color:var(--muted);
    }
    .section-title{
      margin-top:24px;
      margin-bottom:6px;
      font-size:15px;
      font-weight:700;
    }
    .section-sub{
      font-size:12px;
      color:var(--muted);
      margin-bottom:8px;
    }
    .chip{
      display:inline-block;
      padding:2px 8px;
      border-radius:999px;
      font-size:11px;
      background:#eef2ff;
      color:#3730a3;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="brand">
        <img src="https://megaroofing.ca/wp-content/uploads/2024/06/Logo-1.png" alt="Mega Roofing & Exteriors">
        <h1>Geo Posts Dashboard</h1>
      </div>
      <div style="font-size:12px;opacity:.9;">Created by Peter Handsor, CME, RSE</div>
    </div>
    <div class="card-body">
      <form class="filters" method="get">
        <div>
          <label for="month">Month</label>
          <select id="month" name="month">
            <option value="">All months</option>
            <?php foreach ($months as $ym): ?>
              <option value="<?php echo htmlspecialchars($ym,ENT_QUOTES); ?>" <?php echo $ym===$filterMonth?'selected':''; ?>>
                <?php echo htmlspecialchars(date('F Y', strtotime($ym.'-01')),ENT_QUOTES); ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label for="author">Author</label>
          <input type="text" id="author" name="author" placeholder="e.g. Peter" value="<?php echo htmlspecialchars($filterAuthor,ENT_QUOTES); ?>">
        </div>
        <div>
          <label for="keyword">Keyword</label>
          <input type="text" id="keyword" name="keyword" placeholder="e.g. roof repair" value="<?php echo htmlspecialchars($filterKeyword,ENT_QUOTES); ?>">
        </div>
        <div>
          <button type="submit">Filter posts</button>
        </div>
      </form>

      <?php if (empty($posts)): ?>
        <div class="empty">No posts found for the current filters.</div>
      <?php else: ?>
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Author</th>
                <th>Keyword</th>
                <th>Location</th>
                <th>Date</th>
                <th>Words</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($posts as $p): ?>
                <tr>
                  <td>#<?php echo (int)$p['id']; ?></td>
                  <td><?php echo htmlspecialchars($p['user_name'],ENT_QUOTES); ?></td>
                  <td><span class="tag"><?php echo htmlspecialchars($p['keyword'],ENT_QUOTES); ?></span></td>
                  <td class="small">
                    <?php echo htmlspecialchars($p['street_address'].' '.$p['city'],ENT_QUOTES); ?>
                  </td>
                  <td class="small">
                    <?php echo htmlspecialchars(date('Y-m-d H:i', strtotime($p['created_at'])),ENT_QUOTES); ?>
                  </td>
                  <td class="small"><?php echo (int)$p['word_count']; ?></td>
                  <td>
                    <a class="btn-link" href="edit_post.php?id=<?php echo (int)$p['id']; ?>">Edit</a>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php endif; ?>

      <!-- Similarity flags -->
      <?php if (!empty($simFlags)): ?>
        <div class="section-title">Similar content flags</div>
        <div class="section-sub">
          These pairs have high text overlap based on the original post body. Managers can tweak wording so each post is unique.
        </div>
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr>
                <th>Similarity</th>
                <th>Post A</th>
                <th>Post B</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($simFlags as $pair): 
                $a = $pair['a']; $b = $pair['b']; ?>
                <tr>
                  <td class="small">
                    <span class="chip"><?php echo number_format($pair['sim'] * 100, 1); ?>%</span>
                  </td>
                  <td class="small">
                    #<?php echo (int)$a['id']; ?> –
                    <?php echo htmlspecialchars($a['keyword'],ENT_QUOTES); ?><br>
                    <span class="small">
                      <?php echo htmlspecialchars($a['user_name'],ENT_QUOTES); ?>,
                      <?php echo htmlspecialchars(date('Y-m-d', strtotime($a['created_at'])),ENT_QUOTES); ?>
                    </span>
                  </td>
                  <td class="small">
                    #<?php echo (int)$b['id']; ?> –
                    <?php echo htmlspecialchars($b['keyword'],ENT_QUOTES); ?><br>
                    <span class="small">
                      <?php echo htmlspecialchars($b['user_name'],ENT_QUOTES); ?>,
                      <?php echo htmlspecialchars(date('Y-m-d', strtotime($b['created_at'])),ENT_QUOTES); ?>
                    </span>
                  </td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
      <?php else: ?>
        <div class="section-title">Similar content flags</div>
        <div class="section-sub">
          No highly similar posts detected at this time.
        </div>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
