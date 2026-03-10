<?php
// /geo-app/dashboard/edit_post.php
require __DIR__ . '/../db.php';
require __DIR__ . '/../relevance_score.php';

function word_count($text) {
    $text = trim($text);
    if ($text === '') return 0;
    return count(preg_split('/\s+/', $text));
}

function slugify($text) {
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text ?: 'file';
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    http_response_code(400);
    echo "Missing or invalid ID.";
    exit;
}

// Fetch existing row
$stmt = $pdo->prepare("SELECT * FROM geo_posts WHERE id = :id");
$stmt->execute([':id' => $id]);
$post = $stmt->fetch();

if (!$post) {
    http_response_code(404);
    echo "Post not found.";
    exit;
}

$errors = [];
$success = false;

// Handle update
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $author       = trim($_POST['user_name']      ?? '');
    $keyword      = trim($_POST['keyword']        ?? '');
    $street       = trim($_POST['street_address'] ?? '');
    $city         = trim($_POST['city']           ?? '');
    $province     = trim($_POST['province']       ?? '');
    $postal_code  = trim($_POST['postal_code']    ?? '');
    $country      = trim($_POST['country']        ?? '');
    $post_content = trim($_POST['post_content']   ?? '');

    if ($author === '')      $errors[] = "Author is required.";
    if ($keyword === '')     $errors[] = "Keyword is required.";
    if ($street === '')      $errors[] = "Street is required.";
    if ($city === '')        $errors[] = "City is required.";
    if ($province === '')    $errors[] = "Province is required.";
    if ($postal_code === '') $errors[] = "Postal code is required.";
    if ($country === '')     $errors[] = "Country is required.";

    $wc = word_count($post_content);
    if ($wc < 10 || $wc > 500) {
        $errors[] = "Post content should be between 10 and 500 words.";
    }

    // Start with existing values
    $lat   = $post['latitude'];
    $lng   = $post['longitude'];
    $path  = $post['image_url'];

    // Optional: image replacement
    if (isset($_FILES['post_image']) && $_FILES['post_image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['post_image'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = "Image upload error (code {$file['error']}).";
        } else {
            $maxSize     = 5 * 1024 * 1024; // 5MB
            $allowedExt  = ['jpg', 'jpeg', 'png', 'webp'];
            $allowedMime = ['image/jpeg','image/png','image/webp'];

            if ($file['size'] > $maxSize) {
                $errors[] = "Image too large (max 5 MB).";
            } else {
                $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                if (!in_array($ext, $allowedExt, true)) {
                    $errors[] = "Invalid image type.";
                } else {
                    $finfo = new finfo(FILEINFO_MIME_TYPE);
                    $mime  = $finfo->file($file['tmp_name']);
                    if (!in_array($mime, $allowedMime, true)) {
                        $errors[] = "Invalid image MIME type.";
                    }
                }
            }

            if (empty($errors)) {
                $dateStamp = date('Y-m-d-H-i-s');
                $location  = trim($street.' '.$city);
                $rawName   = "{$keyword} near {$location} {$dateStamp}";
                $slug      = slugify($rawName);

                $uploadDir = __DIR__ . '/../uploads';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

                $filename = $slug.'.'.$ext;
                $target   = $uploadDir.'/'.$filename;

                if (file_exists($target)) {
                    $filename = $slug.'-'.bin2hex(random_bytes(4)).'.'.$ext;
                    $target   = $uploadDir.'/'.$filename;
                }

                if (!move_uploaded_file($file['tmp_name'], $target)) {
                    $errors[] = "Failed to move uploaded image file.";
                } else {
                    // update image URL
                    $path = 'https://megaroofing.ca/geo-app/uploads/'.$filename;
                }
            }
        }
    }

    if (empty($errors)) {
        // Original, unmarked-up post
        $post_og = $post_content;

        // NEW: compute relevance score (0–100) using your scoring engine
        $relevance_score = compute_relevance_score($keyword, $post_og);

        $dateISO = date('c', strtotime($post['created_at']));
        $dateTxt = date('Y-m-d', strtotime($post['created_at']));
        $altTag  = $keyword.' near '.$street.' '.$city.' | Mega Roofing and Exteriors';

        // Width/height not tracked here; keep as 0 which is fine for HTML
        $width = 0;
        $height = 0;

        $post_html =
'<div class="geoBoost">
  <div class="boost-img">
    <img src="'.$path.'" alt="'.$altTag.'" width="'.$width.'" height="'.$height.'" loading="lazy">
  </div>
  <div class="geo-date">
    <time datetime="'.$dateISO.'">'.$dateTxt.'</time>
  </div>
  <div class="geo-post">
    <div class="" itemscope itemtype="https://schema.org/Service">
      <!-- Service core info -->
      <meta itemprop="name" content="Mega Roofing and Exteriors Local Jobs">
      <meta itemprop="serviceType" content="'.$keyword.'">
      <p itemprop="description" class="">'.$post_content.'</p><br>
      <!-- Provider (your roofing company) -->
      <div itemprop="provider" itemscope itemtype="https://schema.org/LocalBusiness">
        <meta itemprop="name" content="Mega Roofing and Exteriors">
        <!-- Optional: who logged this job -->
        <meta itemprop="employee" content="'.$author.'">
      </div>
      <!-- Where this service was performed -->
      <div itemprop="areaServed" itemscope itemtype="https://schema.org/Place">
        <span itemprop="name">'.$keyword.' Near '.$street.'</span>
        <div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
          <span itemprop="streetAddress">'.$street.'</span>,
          <span itemprop="addressLocality">'.$city.'</span>,
          <span itemprop="addressRegion">'.$province.'</span>,
          <span itemprop="postalCode">'.$postal_code.'</span>
          <meta itemprop="addressCountry" content="'.$country.'">
        </div>
        <div itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates">
          <meta itemprop="latitude" content="'.$lat.'">
          <meta itemprop="longitude" content="'.$lng.'">
        </div>
      </div>
    </div>
  </div>
</div>';

        $jsonLDData = [
            '@context'    => 'https://schema.org',
            '@type'       => 'Service',
            'name'        => 'Mega Roofing and Exteriors Local Jobs',
            'startDate'   => $dateISO,
            'description' => $post_content,
            'attendees'   => [
                '@type' => 'Person',
                'name'  => $author,
            ],
            'location' => [
                '@type' => 'Place',
                'name'  => $keyword.' Near '.$street,
                'address' => [
                    '@type'           => 'PostalAddress',
                    'streetAddress'   => $street,
                    'addressLocality' => $city,
                    'addressRegion'   => $province,
                    'postalCode'      => $postal_code,
                    'addressCountry'  => $country,
                ],
                'geo' => [
                    '@type'    => 'GeoCoordinates',
                    'latitude' => (float)$lat,
                    'longitude'=> (float)$lng,
                ],
            ],
            'image' => $path,
        ];

        $json_ld = json_encode(
            $jsonLDData,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
        );

        $update = $pdo->prepare(
            "UPDATE geo_posts
             SET user_name = :user_name,
                 keyword = :keyword,
                 street_address = :street_address,
                 city = :city,
                 province = :province,
                 postal_code = :postal_code,
                 country = :country,
                 image_url = :image_url,
                 post_html = :post_html,
                 post_og = :post_og,
                 json_ld = :json_ld,
                 word_count = :wc,
                 relevance_score = :relevance_score
             WHERE id = :id"
        );

        $update->execute([
            ':user_name'        => $author,
            ':keyword'          => $keyword,
            ':street_address'   => $street,
            ':city'             => $city,
            ':province'         => $province,
            ':postal_code'      => $postal_code,
            ':country'          => $country,
            ':image_url'        => $path,
            ':post_html'        => $post_html,
            ':post_og'          => $post_og,
            ':json_ld'          => $json_ld,
            ':wc'               => $wc,
            ':relevance_score'  => $relevance_score,
            ':id'               => $id,
        ]);

        // refresh $post with new values for redisplay
        $stmt->execute([':id' => $id]);
        $post = $stmt->fetch();
        $success = true;
    }
}

// Pre-fill values
$val_user   = $post['user_name'];
$val_kw     = $post['keyword'];
$val_street = $post['street_address'];
$val_city   = $post['city'];
$val_prov   = $post['province'];
$val_postal = $post['postal_code'];
$val_country= $post['country'];
$val_content= $post['post_og'];
$currentImg = $post['image_url'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Edit Geo Post #<?php echo (int)$id; ?> | Mega Roofing</title>
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
      max-width:900px;
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
    .brand img{height:42px;}
    .brand h1{margin:0;font-size:20px;}
    .card-body{padding:22px 24px 24px;display:grid;gap:16px;}
    label{font-weight:600;font-size:13px;color:var(--ink);}
    .hint{font-size:11px;color:var(--muted);}
    input[type="text"],textarea,input[type="file"]{
      width:100%;
      border-radius:12px;
      border:1px solid #e5e7eb;
      padding:9px 11px;
      font-size:14px;
      outline:none;
    }
    textarea{min-height:160px;resize:vertical;}
    input:focus,textarea:focus{
      border-color:var(--mega-red);
      box-shadow:0 0 0 3px rgba(178,34,34,.2);
    }
    input[type="file"]{
      padding:8px 9px;
      background:#fff;
    }
    .row{display:grid;gap:12px;}
    @media(min-width:720px){
      .row.grid-2{grid-template-columns:1fr 1fr;}
    }
    .errors{
      background:#fef2f2;
      border:1px solid #fee2e2;
      color:#b91c1c;
      padding:10px 12px;
      border-radius:10px;
      font-size:13px;
    }
    .success{
      background:#ecfdf3;
      border:1px solid #bbf7d0;
      color:#166534;
      padding:10px 12px;
      border-radius:10px;
      font-size:13px;
    }
    .actions{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      margin-top:4px;
    }
    .btn-primary{
      border:none;
      border-radius:999px;
      padding:10px 18px;
      background:var(--mega-red);
      color:#fff;
      font-weight:700;
      cursor:pointer;
      box-shadow:0 5px 12px rgba(178,34,34,.25);
    }
    .btn-primary:hover{background:var(--mega-red-dark);}
    .link{
      font-size:13px;
      color:var(--muted);
      text-decoration:none;
    }
    .link:hover{color:var(--mega-red);}
    .thumb{
      max-width:180px;
      border-radius:10px;
      border:1px solid #e5e7eb;
      display:block;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <div class="brand">
        <img src="https://megaroofing.ca/wp-content/uploads/2024/06/Logo-1.png" alt="Mega Roofing & Exteriors">
        <h1>Edit Geo Post #<?php echo (int)$id; ?></h1>
      </div>
      <a class="link" href="index.php">← Back to dashboard</a>
    </div>
    <div class="card-body">
      <?php if (!empty($errors)): ?>
        <div class="errors">
          <strong>Fix the following:</strong>
          <ul>
            <?php foreach ($errors as $e): ?>
              <li><?php echo htmlspecialchars($e,ENT_QUOTES); ?></li>
            <?php endforeach; ?>
          </ul>
        </div>
      <?php elseif ($success): ?>
        <div class="success">
          Post updated successfully. HTML, schema, relevance score and (if changed) the image were rebuilt for this job.
        </div>
      <?php endif; ?>

      <form method="post" enctype="multipart/form-data">
        <div class="row grid-2">
          <div>
            <label for="user_name">Author</label>
            <input type="text" id="user_name" name="user_name" value="<?php echo htmlspecialchars($val_user,ENT_QUOTES); ?>">
          </div>
          <div>
            <label for="keyword">Keyword</label>
            <input type="text" id="keyword" name="keyword" value="<?php echo htmlspecialchars($val_kw,ENT_QUOTES); ?>">
          </div>
        </div>

        <div class="row grid-2">
          <div>
            <label for="street_address">Street</label>
            <input type="text" id="street_address" name="street_address" value="<?php echo htmlspecialchars($val_street,ENT_QUOTES); ?>">
          </div>
          <div>
            <label for="city">City</label>
            <input type="text" id="city" name="city" value="<?php echo htmlspecialchars($val_city,ENT_QUOTES); ?>">
          </div>
        </div>

        <div class="row grid-2">
          <div>
            <label for="province">Province</label>
            <input type="text" id="province" name="province" value="<?php echo htmlspecialchars($val_prov,ENT_QUOTES); ?>">
          </div>
          <div>
            <label for="postal_code">Postal code</label>
            <input type="text" id="postal_code" name="postal_code" value="<?php echo htmlspecialchars($val_postal,ENT_QUOTES); ?>">
          </div>
        </div>

        <div class="row">
          <label for="country">Country</label>
          <input type="text" id="country" name="country" value="<?php echo htmlspecialchars($val_country,ENT_QUOTES); ?>">
        </div>

        <div class="row grid-2">
          <div>
            <label>Current image</label>
            <?php if ($currentImg): ?>
              <img class="thumb" src="<?php echo htmlspecialchars($currentImg,ENT_QUOTES); ?>" alt="Current image">
              <div class="hint">This is the image currently used in the geo post.</div>
            <?php else: ?>
              <div class="hint">No image stored for this post.</div>
            <?php endif; ?>
          </div>
          <div>
            <label for="post_image">Replace image (optional)</label>
            <input type="file" id="post_image" name="post_image" accept="image/*">
            <div class="hint">Upload a new JPG/PNG/WEBP up to 5 MB. Leave empty to keep the existing image.</div>
          </div>
        </div>

        <div class="row">
          <label for="post_content">Post content</label>
          <textarea id="post_content" name="post_content"><?php echo htmlspecialchars($val_content,ENT_QUOTES); ?></textarea>
          <div class="hint">This is the original unmarked post text. HTML + JSON-LD and relevance score are regenerated from this.</div>
        </div>

        <div class="actions">
          <a class="link" href="index.php">RETURN TO DASHBOARD</a>
          <button type="submit" class="btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  </div>
</body>
</html>
