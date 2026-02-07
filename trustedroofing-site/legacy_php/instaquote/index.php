<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Instant Roof Quote | Mega Roofing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- React + ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>

  <!-- Google Maps JS + Places -->
  <script>
    // Called by the Google Maps JS API when it finishes loading.
    function initInstantQuoteAutocomplete() {
      if (window.__INSTAQUOTE_ON_GOOGLE_READY) {
        window.__INSTAQUOTE_ON_GOOGLE_READY();
      } else {
        window.__INSTAQUOTE_GOOGLE_READY_PENDING = true;
      }
    }
  </script>

  <script
    async
    defer
    src="https://maps.googleapis.com/maps/api/js?key=GOOGLEapiKEY&libraries=places&callback=initInstantQuoteAutocomplete"
  ></script>
</head>

<body class="bg-slate-50">
  <div class="min-h-screen flex flex-col">
    <header class="w-full border-b bg-white">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <img
          src="https://megaroofing.ca/wp-content/uploads/2024/06/Logo-1.png"
          alt="Mega Roofing logo"
          class="h-8 w-auto object-contain"
        />
        <span class="font-semibold text-gray-900">InstantQuote MVP</span>
      </div>
    </header>

    <!-- Center vertically like you asked -->
    <main class="flex-1 flex items-center justify-center px-4 py-10">
      <div id="instaquote-root" class="w-full max-w-3xl"></div>
    </main>

    <footer class="text-center text-xs text-gray-400 py-4">
      © Mega Roofing & Exteriors
    </footer>
  </div>

  <script src="app.js?v=0.9"></script>
</body>
</html>
