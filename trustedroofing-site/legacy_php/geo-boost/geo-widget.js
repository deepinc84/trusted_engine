(function () {
  'use strict';

  function setupDelegatedClicks() {
    document.addEventListener('click', function (e) {

      // =======================================
      // 1) COLLAPSE / EXPAND TRACK (+ / -)
      // =======================================
      var collapseBtn = e.target.closest('[data-collapse-track]');
      if (collapseBtn) {
        var widget = collapseBtn.closest('.geo-boost-widget');
        if (!widget) return;

        var track = widget.querySelector('.geo-boost-track');
        if (!track) return;

        // Single source of truth: data-open
        var isOpen = collapseBtn.getAttribute('data-open') === '1';

        if (isOpen) {
          // COLLAPSE
          track.style.display = 'none';
          collapseBtn.textContent = '+';
          collapseBtn.setAttribute('data-open', '0');
          console.log('COLLAPSED');
        } else {
          // EXPAND
          track.style.display = 'flex';
          // Force reflow for iOS
          void track.offsetHeight;
          collapseBtn.textContent = '−';
          collapseBtn.setAttribute('data-open', '1');
          console.log('EXPANDED');
        }

        return;
      }

      // =======================================
      // 2) VIEW DETAILS / HIDE DETAILS (per card)
      // =======================================
      var detailsBtn = e.target.closest('[data-geo-toggle]');
      if (detailsBtn) {
        var panel2 = detailsBtn.nextElementSibling;
        if (!panel2 || !panel2.classList.contains('geo-boost-panel')) return;

        var isOpenPanel = panel2.getAttribute('data-open') === '1';

        if (isOpenPanel) {
          panel2.style.maxHeight = '0px';
          panel2.setAttribute('data-open', '0');
          detailsBtn.textContent = 'View details';
        } else {
          panel2.style.maxHeight = panel2.scrollHeight + 'px';
          panel2.setAttribute('data-open', '1');
          detailsBtn.textContent = 'Hide details';
        }
      }
    });
  }

  function buildWidgetUrl(scriptEl, keyword, limit) {
    var src = scriptEl.getAttribute('src') || '';

    src = src.replace(/geo-widget\.js(\?.*)?$/i, 'widget.php$1');
    if (src.indexOf('widget.php') === -1) {
      var base = src.replace(/[^\/]+$/, '');
      src = base + 'widget.php';
    }

    var params = [];
    params.push('keyword=' + encodeURIComponent(keyword));
    if (typeof limit === 'string' && limit.trim() !== '') {
      params.push('limit=' + encodeURIComponent(limit.trim()));
    }

    if (src.indexOf('?') === -1) {
      src += '?' + params.join('&');
    } else {
      src += '&' + params.join('&');
    }
    return src;
  }

  function initAllWidgets() {
    var scripts = document.querySelectorAll('script[src*="geo-widget.js"]');
    if (!scripts.length) return;

    scripts.forEach(function (script) {
      var keyword = script.getAttribute('data-geo-keyword') || '';
      if (!keyword) return;

      var targetId = script.getAttribute('data-geo-target') || 'geo-boost-root';
      var limit    = script.getAttribute('data-geo-limit') || '';

      var target = document.getElementById(targetId);
      if (!target) return;

      var widgetUrl = buildWidgetUrl(script, keyword, limit);

      fetch(widgetUrl, { credentials: 'same-origin' })
        .then(function (r) {
          if (!r.ok) throw new Error('Geo widget HTTP ' + r.status);
          return r.text();
        })
        .then(function (html) {
          target.innerHTML = html;
        })
        .catch(function (err) {
          console.error('GeoBoost widget error:', err);
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupDelegatedClicks();
      initAllWidgets();
    });
  } else {
    setupDelegatedClicks();
    initAllWidgets();
  }

})();
