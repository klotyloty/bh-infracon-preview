/* BH Infracon – Civil Consulting · Seitenlogik (Navigation, Animationen, Referenzen, Formular) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navigation ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Menü öffnen' : 'Menü schließen');
      nav.classList.toggle('is-open', !open);
      document.body.classList.toggle('nav-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) toggle.click();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { toggle.click(); toggle.focus(); }
    });
  }
  // Header bei Scroll nach unten ausblenden, nach oben einblenden
  var lastY = window.scrollY, ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (header && !document.body.classList.contains('nav-open')) {
        header.classList.toggle('is-hidden', y > lastY && y > 200);
      }
      lastY = y; ticking = false;
    });
  }, { passive: true });

  /* ---------- Scroll-Animationen (GSAP + ScrollTrigger) ---------- */
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var reveals = document.querySelectorAll('.reveal');
  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    // Gruppen: Elemente mit data-stagger werden als Kinder-Batch animiert
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      var items = group.children;
      gsap.set(items, { autoAlpha: 0, y: 32 });
      ScrollTrigger.batch(items, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: true });
        }
      });
    });
    reveals.forEach(function (el) {
      gsap.fromTo(el, { autoAlpha: 0, y: 28 }, {
        autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onStart: function () { el.classList.add('is-visible'); }
      });
    });
    // Zeilenweise Überschriften (data-lines)
    document.querySelectorAll('[data-lines]').forEach(function (el) {
      var lines = el.querySelectorAll('span');
      if (!lines.length) return;
      gsap.from(lines, { yPercent: 110, opacity: 0, duration: 1, ease: 'power4.out', stagger: 0.09, delay: 0.1 });
    });
    // Zähler
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString('de-DE') + suffix; }
      });
    });
    // Parallax auf Bildern (data-parallax)
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      gsap.fromTo(el, { yPercent: -8 }, { yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // Signatur-Linien zeichnen
    document.querySelectorAll('.rule, .rule-split span, .rule-short').forEach(function (el) {
      gsap.from(el, { scaleX: 0, transformOrigin: 'left center', duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = parseFloat(el.getAttribute('data-count')).toLocaleString('de-DE') + (el.getAttribute('data-suffix') || '');
    });
  }

  /* ---------- Referenzen: Filter + Detail-Dialog ---------- */
  var filter = document.querySelector('.filter');
  if (filter) {
    var projects = document.querySelectorAll('.project[data-cat]');
    var countEl = document.querySelector('[data-filter-count]');
    filter.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      filter.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
      var cat = btn.getAttribute('data-filter');
      var n = 0;
      projects.forEach(function (p) {
        var show = cat === 'alle' || (p.getAttribute('data-cat') || '').split(' ').indexOf(cat) >= 0;
        p.classList.toggle('is-hidden', !show); if (show) n++;
      });
      if (countEl) countEl.textContent = n + ' ' + (n === 1 ? 'Projekt' : 'Projekte');
      if (hasGsap && !reduce) gsap.from(Array.prototype.filter.call(projects, function (p) { return !p.classList.contains('is-hidden'); }),
        { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.05, overwrite: true, clearProps: 'all' });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    // Vorauswahl per URL (?f=bauleitung)
    var pre = new URLSearchParams(location.search).get('f');
    if (pre) { var pb = filter.querySelector('[data-filter="' + pre + '"]'); if (pb) pb.click(); }
  }
  var dialog = document.getElementById('project-dialog');
  if (dialog && typeof dialog.showModal === 'function') {
    var dMedia = dialog.querySelector('.dialog__media img');
    var dMeta = dialog.querySelector('[data-d-meta]');
    var dTitle = dialog.querySelector('[data-d-title]');
    var dBody = dialog.querySelector('[data-d-body]');
    var dTags = dialog.querySelector('[data-d-tags]');
    var lastTrigger = null;
    document.querySelectorAll('[data-open-project]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.project');
        var img = card.querySelector('img');
        var full = card.querySelector('template');
        dMedia.src = img.getAttribute('data-full') || img.currentSrc || img.src;
        dMedia.alt = img.alt;
        dMeta.textContent = card.querySelector('.project__meta').textContent;
        dTitle.textContent = card.querySelector('.project__title').textContent;
        dBody.innerHTML = full ? full.innerHTML : card.querySelector('.project__text').outerHTML;
        dTags.innerHTML = card.querySelector('.tags') ? card.querySelector('.tags').innerHTML : '';
        lastTrigger = btn;
        dialog.showModal();
        dialog.querySelector('.dialog__close').focus();
        history.replaceState(null, '', '#' + card.id);
      });
    });
    dialog.querySelector('.dialog__close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      if (lastTrigger) lastTrigger.focus();
      history.replaceState(null, '', location.pathname + location.search);
    });
    // Direktaufruf per Anker (#projekt-id)
    if (location.hash) {
      var target = document.querySelector(location.hash + ' [data-open-project]');
      if (target) setTimeout(function () { target.click(); }, 400);
    }
  }

  /* ---------- Kontaktformular: Validierung ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    // Rückmeldung nach dem Versand (send.php leitet mit ?status= zurück)
    var status = new URLSearchParams(location.search).get('status');
    var statusBox = document.getElementById('form-status');
    if (status && statusBox) {
      var msgs = {
        ok: ['alert', 'Vielen Dank! Ihre Anfrage ist bei uns eingegangen. Wir melden uns innerhalb von zwei Werktagen.'],
        invalid: ['alert alert--error', 'Bitte prüfen Sie Ihre Eingaben – Name, E-Mail, Nachricht und die Einwilligung sind erforderlich.'],
        error: ['alert alert--error', 'Der Versand ist leider fehlgeschlagen. Bitte schreiben Sie uns direkt an jherge@bh-infracon.de oder rufen Sie an.']
      };
      var m = msgs[status];
      if (m) { statusBox.className = m[0]; statusBox.textContent = m[1]; statusBox.style.marginBottom = '24px'; if (status === 'ok') form.reset(); }
    }
    var fields = form.querySelectorAll('[required]');
    function validate(field) {
      var wrap = field.closest('.field') || field.closest('.check');
      var ok = field.type === 'checkbox' ? field.checked : field.value.trim().length > 0;
      if (ok && field.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim());
      if (wrap) wrap.classList.toggle('is-invalid', !ok);
      field.setAttribute('aria-invalid', String(!ok));
      return ok;
    }
    fields.forEach(function (f) { f.addEventListener('blur', function () { validate(f); }); f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') validate(f); }); });
    form.addEventListener('submit', function (e) {
      var allOk = true, first = null;
      fields.forEach(function (f) { var ok = validate(f); if (!ok) { allOk = false; first = first || f; } });
      var ts = form.querySelector('[name="ts"]'); if (ts) ts.value = String(Date.now());
      if (!allOk) { e.preventDefault(); first.focus(); }
      else { var btn = form.querySelector('[type="submit"]'); btn.disabled = true; btn.textContent = 'Wird gesendet …'; }
    });
    var start = form.querySelector('[name="ts"]'); if (start) start.value = String(Date.now());
  }

  /* ---------- Karte: erst nach Einwilligung laden ---------- */
  var map = document.querySelector('.map[data-src]');
  if (map) {
    map.querySelector('.map__consent button').addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = map.getAttribute('data-src');
      f.title = 'Karte: Standort BH Infracon, Weiterstadt';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      map.appendChild(f);
      map.querySelector('.map__consent').remove();
    });
  }

  /* ---------- Jahr im Footer aktuell halten ---------- */
  var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
})();
