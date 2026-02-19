<?php
// /geo-app/widget.php
// Returns ready-to-insert HTML for the carousel.

require __DIR__ . '/db.php'; // uses $pdo on the server only

$keyword     = trim($_GET['keyword'] ?? '');
$limitParam  = isset($_GET['limit']) ? trim($_GET['limit']) : ''; // blank allowed

// Fixed company info
$companyName    = 'Mega Roofing and Exteriors';
$companyStreet  = '143 Huggard Rd';
$companyCity    = 'Calgary';
$companyRegion  = 'AB';
$companyPostal  = 'T3Z 2C2';
$companyCountry = 'CA';
$companyPhone   = '+1-403-980-1053';

if ($keyword === '') {
    echo '<!-- GeoBoost: keyword missing -->';
    exit;
}

/*
-----------------------------------------
 LIMIT LOGIC:
 - If limit is blank/missing → NO LIMIT → return ALL posts
 - If limit has a number → enforce limits
-----------------------------------------
*/
$limitSql = '';
if ($limitParam !== '') {
    $limit = (int)$limitParam;
    if ($limit < 1)   $limit = 1;
    if ($limit > 500) $limit = 500; // safety cap
    $limitSql = " LIMIT $limit";
}

/*
-----------------------------------------
 QUERY
-----------------------------------------
*/
$sql = "
    SELECT id, user_name, keyword, street_address, city, province,
           postal_code, image_url, created_at, post_og, json_ld
    FROM geo_posts
    WHERE keyword = :kw
    ORDER BY created_at DESC
    $limitSql
";

$stmt = $pdo->prepare($sql);
$stmt->execute([':kw' => $keyword]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!$rows) {
    echo '<div class="geo-boost-empty">No recent jobs for this service yet.</div>';
    exit;
}
?>
<style>
  .geo-boost-widget{
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
    color:#111827;
    background:#ffffff;
    border-radius:16px;
    border:1px solid #e5e7eb;
    padding:14px 16px 18px;
    box-shadow:0 8px 20px rgba(0,0,0,0.06);
  }
  .geo-boost-header{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
    margin-bottom:10px;
  }
  .geo-boost-header-title{
    font-weight:700;
    font-size:15px;
  }

 .geo-boost-track{
  display:flex;        /* default when visible */
  overflow-x:auto;
  gap:14px;
  padding:4px 2px;
}

  .geo-boost-card{
    flex:0 0 auto;
    min-width:260px;
    max-width:280px;
    border-radius:14px;
    border:1px solid #e5e7eb;
    background:#fff;
    box-shadow:0 4px 10px rgba(0,0,0,0.04);
    overflow:hidden;
    display:flex;
    flex-direction:column;
  }

  .geo-boost-card img{
    width:100%;
    height:160px;
    object-fit:cover;
    display:block;
  }
  .geo-boost-body{
    padding:10px 12px 12px;
    font-size:13px;
  }
  .geo-boost-title{
    font-weight:600;
    font-size:14px;
    margin-bottom:2px;
  }
  .geo-boost-location{
    font-size:12px;
    color:#6b7280;
    margin-bottom:6px;
  }
  .geo-boost-meta{
    font-size:11px;
    color:#9ca3af;
    margin-bottom:6px;
  }
  .geo-boost-toggle{
    margin-top:4px;
    padding:5px 9px;
    border-radius:999px;
    border:none;
    background:#B22222;
    color:#fff;
    font-size:11px;
    font-weight:600;
    cursor:pointer;
  }
  .geo-boost-panel{
    margin-top:6px;
    font-size:12px;
    color:#374151;
    line-height:1.4;
    max-height:0;
    overflow:hidden;
    transition:max-height .2s ease;
  }

  .collapse-carousel{
  border:none;
  background:transparent;
  color:#B22222; /* Mega red */
  font-size:18px;
  font-weight:700;
  cursor:pointer;
  padding:0 4px;
  line-height:1;
}
  .collapse-carousel:hover{
    transform:scale(1.1);
    color:#961d1d;
  }
  .collapse-carousel.is-open{
    transform:scale(1.1);
  }

  @media (max-width: 767px) {
    .geo-boost-widget .geo-boost-track {
      display: flex !important;   /* override WP/Uncode/lazyload */
      max-height: none !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .geo-boost-widget .collapse-carousel {
      display: none !important;   /* hide + / - button */
    }
  }
</style>

<div class="geo-boost-widget">
  <div class="geo-boost-header">
    <div class="geo-boost-header-title">
      Recent <?php echo htmlspecialchars(ucwords($keyword), ENT_QUOTES); ?> jobs
    </div>

    <!-- Collapse/expand button: starts "closed" -->
    <button
      type="button"
      class="collapse-carousel"
      data-collapse-track
      data-open="0"
      aria-expanded="false"
    >
      +
    </button>
  </div>

  <!-- Track starts hidden via inline style -->
  <div class="geo-boost-track" style="display:none;"
       itemscope itemtype="https://schema.org/ItemList">
    <?php foreach ($rows as $row): ?>
      <?php
        $street   = trim($row['street_address'] ?? '');
        $city     = trim($row['city'] ?? '');
        $province = trim($row['province'] ?? '');
        $postal   = trim($row['postal_code'] ?? '');
        $country  = $companyCountry; // jobs are all in Canada for now

        $loc  = trim(($street ? $street . ', ' : '') . $city . ' ' . $province);
        $dateISO = $row['created_at'] ? date('c', strtotime($row['created_at'])) : '';
        $date = $row['created_at'] ? date('Y-m-d', strtotime($row['created_at'])) : '';

        // lat/lng are optional – only used if present
        $lat = $row['latitude']  ?? '';
        $lng = $row['longitude'] ?? '';
      ?>
      <article class="geo-boost-card"
               itemscope itemtype="https://schema.org/Service"
               itemprop="itemListElement">

        <?php if (!empty($row['keyword'])): ?>
          <meta itemprop="serviceType"
                content="<?php echo htmlspecialchars($row['keyword'], ENT_QUOTES); ?>">
          <meta itemprop="name"
                content="<?php echo htmlspecialchars(ucwords($row['keyword']), ENT_QUOTES); ?>">
        <?php endif; ?>

        <?php if ($dateISO): ?>
          <meta itemprop="temporal"
                content="<?php echo htmlspecialchars($dateISO, ENT_QUOTES); ?>">
        <?php endif; ?>

        <?php if (!empty($row['image_url'])): ?>
          <img src="<?php echo htmlspecialchars($row['image_url'], ENT_QUOTES); ?>"
               alt="<?php echo htmlspecialchars($row['keyword'].' near '.$loc, ENT_QUOTES); ?>"
               loading="lazy"
               itemprop="image">
        <?php endif; ?>
        <div class="geo-boost-body">

          <div class="geo-boost-title">
            <?php echo htmlspecialchars(ucwords($row['keyword']), ENT_QUOTES); ?>
          </div>
          <!-- simple text areaServed -->
          <div class="geo-boost-location" itemprop="areaServed">
            <?php echo htmlspecialchars($loc, ENT_QUOTES); ?>
          </div>
          <div class="geo-boost-meta">
            <?php if ($date): ?>Job date: <?php echo htmlspecialchars($date, ENT_QUOTES); ?> · <?php endif; ?>
            Tech: <?php echo htmlspecialchars($row['user_name'], ENT_QUOTES); ?>
          </div>

          <!-- provider: Mega + tech as employee, hidden -->
          <div itemprop="provider"
               itemscope
               itemtype="https://schema.org/LocalBusiness"
               style="display:none;">
            <meta itemprop="name"
                  content="<?php echo htmlspecialchars($companyName, ENT_QUOTES); ?>">
            <meta itemprop="telephone"
                  content="<?php echo htmlspecialchars($companyPhone, ENT_QUOTES); ?>">
            <div itemprop="address"
                 itemscope
                 itemtype="https://schema.org/PostalAddress">
              <meta itemprop="streetAddress"
                    content="<?php echo htmlspecialchars($companyStreet, ENT_QUOTES); ?>">
              <meta itemprop="addressLocality"
                    content="<?php echo htmlspecialchars($companyCity, ENT_QUOTES); ?>">
              <meta itemprop="addressRegion"
                    content="<?php echo htmlspecialchars($companyRegion, ENT_QUOTES); ?>">
              <meta itemprop="postalCode"
                    content="<?php echo htmlspecialchars($companyPostal, ENT_QUOTES); ?>">
              <meta itemprop="addressCountry"
                    content="<?php echo htmlspecialchars($companyCountry, ENT_QUOTES); ?>">
            </div>
            <?php if (!empty($row['user_name'])): ?>
              <div itemprop="employee"
                   itemscope
                   itemtype="https://schema.org/Person">
                <meta itemprop="name"
                      content="<?php echo htmlspecialchars($row['user_name'], ENT_QUOTES); ?>">
              </div>
            <?php endif; ?>
          </div>

          <button type="button" class="geo-boost-toggle" data-geo-toggle>
            View details
          </button>

          <div class="geo-boost-panel" data-open="0">
            <div class="geo-boost-text" itemprop="description">
              <?php echo nl2br(htmlspecialchars($row['post_og'], ENT_QUOTES)); ?>
            </div>

            <!-- structured areaServed: Place + address (+ optional geo) -->
            <div itemprop="areaServed"
                 itemscope
                 itemtype="https://schema.org/Place"
                 style="display:none;">
              <meta itemprop="name"
                    content="<?php echo htmlspecialchars(($row['keyword'] ?? '').' near '.$loc, ENT_QUOTES); ?>">
              <div itemprop="address"
                   itemscope
                   itemtype="https://schema.org/PostalAddress">
                <?php if ($street): ?>
                  <meta itemprop="streetAddress"
                        content="<?php echo htmlspecialchars($street, ENT_QUOTES); ?>">
                <?php endif; ?>
                <?php if ($city): ?>
                  <meta itemprop="addressLocality"
                        content="<?php echo htmlspecialchars($city, ENT_QUOTES); ?>">
                <?php endif; ?>
                <?php if ($province): ?>
                  <meta itemprop="addressRegion"
                        content="<?php echo htmlspecialchars($province, ENT_QUOTES); ?>">
                <?php endif; ?>
                <?php if ($postal): ?>
                  <meta itemprop="postalCode"
                        content="<?php echo htmlspecialchars($postal, ENT_QUOTES); ?>">
                <?php endif; ?>
                <meta itemprop="addressCountry"
                      content="<?php echo htmlspecialchars($country, ENT_QUOTES); ?>">
              </div>
              <?php if ($lat !== '' && $lng !== ''): ?>
                <div itemprop="geo"
                     itemscope
                     itemtype="https://schema.org/GeoCoordinates">
                  <meta itemprop="latitude"
                        content="<?php echo htmlspecialchars($lat, ENT_QUOTES); ?>">
                  <meta itemprop="longitude"
                        content="<?php echo htmlspecialchars($lng, ENT_QUOTES); ?>">
                </div>
              <?php endif; ?>
            </div>

            <?php if (!empty($row['json_ld'])): ?>
              <script type="application/ld+json">
              <?php echo $row['json_ld']; ?>
              </script>
            <?php endif; ?>
          </div>
        </div>
      </article>
    <?php endforeach; ?>
  </div>
</div>
