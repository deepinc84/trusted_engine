<!DOCTYPE html> 
<html lang="en">
<head>
  <meta name="robots" content="noindex, nofollow">
  <meta name="googlebot" content="noindex, nofollow">
  <meta charset="UTF-8" />
  <title>Create Geo Post | Mega Roofing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <style>
    :root{
      --mega-red:#B22222;
      --mega-red-dark:#8f1b1b;
      --ink:#1f2937;
      --muted:#6b7280;
      --bg:#f7f7f8;
      --white:#ffffff;
      --ring: rgba(178,34,34,0.35);
    }
    *{box-sizing:border-box}
    html,body{
      height:100%;
      margin:0;
      font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;
      color:var(--ink);
      background: radial-gradient(1200px 800px at 50% -10%, #fff 0, #fff 40%, #fdeaea 100%);
    }
    .page{min-height:100%;display:grid;place-items:center;padding:32px 16px;}
    .card{
      width:100%;max-width:900px;background:var(--white);
      border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.04);
      overflow:hidden;border:1px solid #eee;
    }
    .card-header{
      background:linear-gradient(135deg,var(--mega-red),#d23333);
      padding:24px 24px 20px;text-align:center;color:#fff;position:relative;isolation:isolate;
    }
    .card-header::after{
      content:"";position:absolute;inset:0;
      background: radial-gradient(400px 200px at 90% -10%, rgba(255,255,255,0.25), transparent 60%);
      pointer-events:none;z-index:0;
    }
    .brand{display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;z-index:1;}
    .brand img{height:54px;width:auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.25));user-select:none;}
    .brand h1{margin:4px 0 0;font-size:20px;letter-spacing:0.2px;font-weight:700;}
    .card-body{padding:28px;display:grid;gap:18px;}
    .row{display:grid;gap:12px;}
    @media (min-width:720px){.row.grid-2{grid-template-columns:1fr 1fr;gap:18px;}}
    label{font-weight:700;font-size:14px;color:var(--ink);}
    .hint{font-size:12px;color:var(--muted);margin-top:2px;}

    /* unified styling for inputs, textarea, select */
    input[type="text"],
    input[type="file"],
    textarea,
    select {
      width:100%;
      appearance:none;
      -webkit-appearance:none;
      -moz-appearance:none;
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:12px 14px;
      font-size:15px;
      outline:none;
      background:#fff;
      transition:border-color .2s,box-shadow .2s,background .2s;
    }
    textarea{min-height:160px;resize:vertical;}
    input[type="file"]{padding:10px;background:#fff;}

    input[type="text"]:focus,
    input[type="file"]:focus,
    textarea:focus,
    select:focus{
      border-color:var(--mega-red);
      box-shadow:0 0 0 4px var(--ring);
    }

    .select-wrapper{position:relative;}
    .select-wrapper::after{
      content:"▼";
      font-size:12px;
      color:#555;
      position:absolute;
      right:14px;
      top:50%;
      transform:translateY(-50%);
      pointer-events:none;
    }

    .meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--muted);}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;
      background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;}
    .badge-dot{width:8px;height:8px;border-radius:50%;background:var(--mega-red);
      box-shadow:0 0 0 3px rgba(178,34,34,.12);}
    .errors{color:#b91c1c;font-size:13px;background:#fef2f2;border:1px solid #fee2e2;
      padding:10px 12px;border-radius:10px;}
    .success{
      color:#166534;font-size:13px;background:#ecfdf3;border:1px solid #bbf7d0;
      padding:10px 12px;border-radius:10px;margin:0 28px 10px;
    }
    .actions{display:flex;justify-content:flex-end;gap:12px;margin-top:6px;}
    .btn{
      appearance:none;border:none;border-radius:12px;padding:12px 18px;
      font-weight:700;cursor:pointer;transition:transform .06s,box-shadow .2s,background .2s;
    }
    .btn-primary{background:var(--mega-red);color:#fff;box-shadow:0 6px 14px rgba(178,34,34,.25);}
    .btn-primary:hover{background:var(--mega-red-dark);}
    .btn:active{transform:translateY(1px);}
    .footer{
      padding:18px 24px 26px;display:flex;justify-content:space-between;align-items:center;
      flex-wrap:wrap;gap:10px;color:var(--muted);font-size:12px;border-top:1px solid #f0f0f0;
    }
    .req{color:#b91c1c;}
    .wordcount{font-weight:700;color:#111827;}
    .pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;
      background:#fff0f0;color:var(--mega-red);border:1px solid #ffd6d6;}
    noscript{
      display:block;margin:0 28px 28px;padding:12px 14px;border-radius:10px;
      background:#fff7ed;border:1px solid #ffedd5;color:#7c2d12;font-size:14px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="card" role="region" aria-label="Create Geo Post">
      <div class="card-header">
        <div class="brand">
          <img src="https://megaroofing.ca/wp-content/uploads/2024/06/Logo-1.png" alt="Mega Roofing & Exteriors logo" />
          <h1>Create Geo-Tagged Post</h1>
        </div>
      </div>

      <noscript>Location and word-count validation need JavaScript. Please enable JavaScript to auto-capture your address and coordinates.</noscript>

      <form id="geoPostForm" method="post" action="process_post.php" enctype="multipart/form-data" class="card-body" novalidate>
        <div class="row grid-2">
          <div>
            <label for="post_image">Post Image <span class="req">*</span></label>
            <input type="file" id="post_image" name="post_image" accept="image/*" required />
            <div class="hint">JPG, PNG, or WEBP up to 5 MB.</div>
          </div>
          <div>
            <label for="user_name">User <span class="req">*</span></label>
            <input type="text" id="user_name" name="user_name" placeholder="First L." required />
            <div class="hint">Who is posting this update?</div>
          </div>
        </div>

        <div class="row">
          <label for="post_content">Post Content <span class="pill">10–500 words</span></label>
          <textarea id="post_content" name="post_content" placeholder="Describe the job, what was done, and any details customers care about…" required></textarea>
          <div class="meta">
            <span>Words:</span>
            <span class="wordcount" id="wordCount">0</span>
            <span id="contentError" class="errors" style="display:none;"></span>
          </div>
        </div>

        <div class="row">
          <label for="keywords">Keyword <span class="req">*</span></label>
          <div class="select-wrapper">
            <select id="keywords" name="keywords" required>
  <option value="">Select a keyword…</option>
  <option value="vinyl siding calgary">Vinyl siding Calgary</option>
  <option value="hardie board siding calgary">Hardie board siding Calgary</option>
  <option value="residential roofing calgary">Residential roofing Calgary</option>
  <option value="emergency roof repair calgary">Emergency roof repair Calgary</option>
  <option value="attic insulation calgary">Attic insulation Calgary</option>
  <option value="rubber roofing calgary">Rubber roofing Calgary</option>
  <option value="metal roof calgary">Metal roof Calgary</option>
  <option value="calgary roof leak repair">Calgary roof leak repair</option>
  <option value="roof replacement cochrane">Roof replacement Cochrane</option>
  <option value="exterior renovation calgary">Exterior renovation Calgary</option>
   <option value="eavestrough and fascia calgary">Eavestrough and fascia Calgary</option>
    <option value="roof inspection calgary">Roof Inspection Calgary</option>
</select>
          </div>
        </div>

        <!-- ===== LOCATION CHOICE SECTION ===== -->
        <div class="row">
          <label>Job Location</label>

          <!-- Choice: auto vs manual -->
          <div class="meta" style="margin-bottom:8px;gap:8px;flex-wrap:wrap;">
            <label class="badge" style="cursor:pointer;">
              <input type="radio" name="loc_mode" id="loc_auto" value="auto" style="margin-right:6px;">
              <span>Use my current location</span>
            </label>

            <label class="badge" style="cursor:pointer;">
              <input type="radio" name="loc_mode" id="loc_manual" value="manual" style="margin-right:6px;">
              <span>Enter address manually</span>
            </label>
          </div>

          <!-- Status + errors for AUTO mode -->
          <div id="autoStatusWrap" class="meta" style="display:none;">
            <span class="badge">
              <span class="badge-dot"></span>
              <span id="geoStatus">Waiting for selection…</span>
            </span>
            <div id="geoFail" class="errors" style="display:none;">
              We could not obtain your location. Please allow location access and reload the page,
              or choose “Enter address manually”.
            </div>
          </div>

          <!-- MANUAL address inputs -->
          <div id="manualFields" style="display:none;margin-top:10px;width:100%;">
            <div class="row grid-2" style="margin-bottom:8px;">
              <div>
                <label for="manual_street">Street address</label>
                <input type="text" id="manual_street" placeholder="123 Main St">
              </div>
              <div>
                <label for="manual_city">City</label>
                <input type="text" id="manual_city" placeholder="Calgary">
              </div>
            </div>
            <div class="row grid-2">
              <div>
                <label for="manual_province">Province</label>
                <input type="text" id="manual_province" placeholder="AB">
              </div>
              <div>
                <label for="manual_postal">Postal code</label>
                <input type="text" id="manual_postal" placeholder="T2X 1Y2">
              </div>
            </div>
            <div class="hint">
              We’ll use this address to look up coordinates via Google Maps.
            </div>
          </div>

          <span id="locationError" class="errors" style="display:none;margin-top:8px;"></span>
        </div>

        <!-- Hidden geo fields actually submitted -->
        <input type="hidden" id="street_address" name="street_address" />
        <input type="hidden" id="city" name="city" />
        <input type="hidden" id="province" name="province" />
        <input type="hidden" id="postal_code" name="postal_code" />
        <input type="hidden" id="country" name="country" value="CA" />
        <input type="hidden" id="latitude" name="latitude" />
        <input type="hidden" id="longitude" name="longitude" />

        <div class="actions">
          <button class="btn btn-primary" type="submit">Submit Post</button>
        </div>

        <!-- Screen reader status -->
        <div aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;">
          <span id="a11yStatus"></span>
        </div>
      </form>

      <div class="footer">
        <span>&copy; <?php echo date('Y'); ?> Mega Roofing &amp; Exteriors</span>
        <span>Created by Peter Handsor, CME, RSE</span>
      </div>
    </div>
  </div>

<script>
  /* ========== WORD COUNT (10–500) ========== */
  const textarea      = document.getElementById('post_content');
  const wordCountSpan = document.getElementById('wordCount');
  const contentError  = document.getElementById('contentError');
  const form          = document.getElementById('geoPostForm');
  const a11yStatus    = document.getElementById('a11yStatus');

  function countWords(t){return t.trim().split(/\s+/).filter(Boolean).length;}
  function setContentError(m){
    if(!m){contentError.style.display='none';contentError.textContent='';return;}
    contentError.style.display='block';contentError.textContent=m;
  }
  textarea.addEventListener('input',()=>{
    const w=countWords(textarea.value);
    wordCountSpan.textContent=w;
    if(w>0&&(w<10||w>500)){
      setContentError("Post must be between 10 and 500 words.");
    }else{
      setContentError("");
    }
  });
  form.addEventListener('submit',e=>{
    const w=countWords(textarea.value);
    if(w<10||w>500){
      e.preventDefault();
      setContentError("Post must be between 10 and 500 words before you can submit.");
      textarea.focus();
      return;
    }
  });

  /* ========== LOCATION: COMMON REFS ========== */
  const streetField   = document.getElementById('street_address');
  const cityField     = document.getElementById('city');
  const provField     = document.getElementById('province');
  const pcField       = document.getElementById('postal_code');
  const countryField  = document.getElementById('country');
  const latField      = document.getElementById('latitude');
  const lngField      = document.getElementById('longitude');

  const locAuto        = document.getElementById('loc_auto');
  const locManual      = document.getElementById('loc_manual');
  const autoStatusWrap = document.getElementById('autoStatusWrap');
  const geoStatus      = document.getElementById('geoStatus');
  const geoFail        = document.getElementById('geoFail');
  const manualFields   = document.getElementById('manualFields');
  const locationError  = document.getElementById('locationError');

  const manualStreet = document.getElementById('manual_street');
  const manualCity   = document.getElementById('manual_city');
  const manualProv   = document.getElementById('manual_province');
  const manualPostal = document.getElementById('manual_postal');

  function setStatus(msg){
    geoStatus.textContent = msg || "";
    a11yStatus.textContent = msg || "";

    if(!msg){
      geoFail.style.display = 'none';
      return;
    }

    const lower = msg.toLowerCase();
    if (lower.includes("unable") || lower.includes("error") || lower.includes("allow")) {
      geoFail.style.display = 'block';
    } else {
      geoFail.style.display = 'none';
    }
  }

  function setLocationError(msg){
    if(!msg){
      locationError.style.display = 'none';
      locationError.textContent = '';
      return;
    }
    locationError.style.display = 'block';
    locationError.textContent = msg;
  }

  const GOOGLE_API_KEY="AIzaSyAmLzhz0nZfKE3kLCnA93r_8HJKh6wGp8I";

  /* ========== AUTO MODE: COORDS -> ADDRESS ========== */
  function reverseGeocode(lat,lng){
    const url=`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`;
    fetch(url)
      .then(r=>r.json())
      .then(data=>{
        if (data.status !== "OK" || !data.results?.length) {
          setStatus("Unable to fetch address from Google.");
          return;
        }
        const res = data.results[0];

        let streetNumber = "";
        let route        = "";
        let city         = "";
        let province     = "";
        let country      = "";
        let postal       = "";

        for (const c of res.address_components) {
          // IGNORE subpremise / unit
          if (c.types.includes("subpremise") || c.types.includes("premise")) {
            continue;
          }
          if (c.types.includes("street_number")) {
            streetNumber = c.long_name;
          }
          if (c.types.includes("route")) {
            route = c.long_name;
          }
          if (c.types.includes("locality")) {
            city = c.long_name;
          }
          if (c.types.includes("administrative_area_level_1")) {
            province = c.short_name;
          }
          if (c.types.includes("country")) {
            country = c.short_name;
          }
          if (c.types.includes("postal_code")) {
            postal = c.long_name;
          }
        }

        const visibleStreet = (streetNumber ? streetNumber + " " : "") + route;
        const storedStreet  = route; // route only, no number

        streetField.value   = storedStreet;
        cityField.value     = city;
        provField.value     = province;
        pcField.value       = postal;
        countryField.value  = country || "CA";

        setStatus(`Location captured: ${visibleStreet || '—'}, ${city || '—'}, ${province || ''} ${postal || ''}`);
      })
      .catch(()=>{
        setStatus("Error talking to Google Geocoding API.");
      });
  }

  function getLocation(){
    if(!navigator.geolocation){
      setStatus("Geolocation is not supported by this browser.");
      return;
    }
    setStatus("Getting your location…");

    navigator.geolocation.getCurrentPosition(
      pos=>{
        const lat=pos.coords.latitude,lng=pos.coords.longitude;
        latField.value=lat;
        lngField.value=lng;
        setStatus("Got coordinates, resolving address…");
        reverseGeocode(lat,lng);
      },
      err=>{
        console.log("Geo error", err);
        if (err.code === err.PERMISSION_DENIED) {
          setStatus(
            "Location is blocked for this site. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → allow access, then reload."
          );
        } else {
          setStatus("Unable to get your location. Please allow location access and reload, or enter address manually.");
        }
      }
    );
  }

  /* ========== MANUAL MODE: ADDRESS -> COORDS ========== */
  function geocodeManualAddress(){
    const street = manualStreet.value.trim();
    const city   = manualCity.value.trim();
    const prov   = manualProv.value.trim();
    const postal = manualPostal.value.trim();

    if(!street || !city || !prov || !postal){
      setLocationError("Please fill street, city, province, and postal code, or choose 'Use my current location'.");
      return Promise.reject(new Error("missing-fields"));
    }

    setLocationError("");

    const address = `${street}, ${city}, ${prov}, ${postal}, Canada`;
    const url=`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

    return fetch(url)
      .then(r=>r.json())
      .then(data=>{
        if (data.status !== "OK" || !data.results?.length) {
          setLocationError("Could not resolve that address. Please double-check it.");
          throw new Error("geocode-failed");
        }
        const res = data.results[0];
        const loc = res.geometry.location;

        latField.value = loc.lat;
        lngField.value = loc.lng;

        // store MANUAL fields in hidden inputs
        streetField.value  = street; // here you ARE storing the full street they typed
        cityField.value    = city;
        provField.value    = prov;
        pcField.value      = postal;
        countryField.value = "CA";

        return true;
      })
      .catch(err=>{
        console.error(err);
        if(err.message !== "geocode-failed" && err.message !== "missing-fields"){
          setLocationError("There was a problem talking to Google Maps. Please try again.");
        }
        throw err;
      });
  }

  /* ========== TOGGLES FOR AUTO / MANUAL ========== */
  locAuto.addEventListener('change', ()=>{
    if(locAuto.checked){
      setLocationError("");
      manualFields.style.display   = 'none';
      autoStatusWrap.style.display = 'flex';
      getLocation();
    }
  });

  locManual.addEventListener('change', ()=>{
    if(locManual.checked){
      autoStatusWrap.style.display = 'none';
      geoFail.style.display        = 'none';
      setStatus("");
      manualFields.style.display   = 'block';
      setLocationError("");
    }
  });

  /* ========== FORM SUBMIT LOCATION VALIDATION ========== */
  let submitting = false;

  form.addEventListener('submit', function(e){
    if(submitting){
      return; // already validated once
    }

    const w = countWords(textarea.value);
    if(w<10 || w>500){
      e.preventDefault();
      setContentError("Post must be between 10 and 500 words before you can submit.");
      textarea.focus();
      return;
    }

    if(!locAuto.checked && !locManual.checked){
      e.preventDefault();
      setLocationError("Please choose how to set the job location (automatic or manual).");
      return;
    }

    // manual mode: geocode first
    if(locManual.checked){
      e.preventDefault();
      geocodeManualAddress()
        .then(()=>{
          submitting = true;
          form.submit();
        })
        .catch(()=>{});
      return;
    }

    // auto mode: require coords
    if(locAuto.checked && (!latField.value || !lngField.value)){
      e.preventDefault();
      setLocationError("We couldn't get your location. Please allow access or switch to manual address.");
      return;
    }
  });
</script>

</body>
</html>
