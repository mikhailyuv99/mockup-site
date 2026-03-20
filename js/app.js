(function () {
  var contentPath = 'content.json';
  /** Chargé dans l’iframe du CMS : pas de fetch, contenu poussé par postMessage (rendu = site déployé). */
  var cmsEmbed = /[?&]cmsEmbed=1(?:&|$)/.test(window.location.search);
  var hashChangeBound = false;
  var cmsMediaClickBound = false;
  var cmsParentOrigin = null;
  var embedIsMultiPage = false;
  /** Page actuellement rendue (embed multi-pages) — peut différer du hash si le parent impose pageSlug. */
  var embedActivePageSlug = '';

  var defaultTheme = {
    heroTitle: '#ffffff',
    heroSubtitle: 'rgba(255,255,255,0.9)',
    aboutTitle: '#e8e8e8',
    aboutText: '#a0a0a0',
    servicesBg: '#141414',
    servicesTitle: '#e8e8e8',
    serviceCardBg: '#1a1a1a',
    serviceCardTitle: '#ffffff',
    serviceCardText: '#888888',
    contactTitle: '#e8e8e8',
    contactText: '#a0a0a0',
    contactButtonBg: '#c9a227',
    contactButtonText: '#0d0d0d'
  };

  var sectionIds = ['hero', 'videoLoop', 'videoPlay', 'about', 'services', 'contact'];
  var sectionEls = {};
  var mainEl = document.querySelector('main');

  sectionIds.forEach(function (id) {
    sectionEls[id] = document.getElementById(id);
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Toujours résoudre les chemins médias par rapport à l’origine du site (racine), pas au path du document.
   * Indispensable avec ?cmsEmbed=1 et pour les chemins sans « / » initial (évite images/vidéos noires).
   */
  function resolveMediaUrl(raw) {
    if (raw == null || raw === '') return raw;
    var s = String(raw).trim();
    if (!s) return s;
    if (/^(https?:|data:|blob:)/i.test(s)) return s;
    if (s.indexOf('//') === 0) {
      try {
        return new URL('https:' + s).href;
      } catch (e0) {
        return raw;
      }
    }
    try {
      var origin = window.location.origin;
      var path = s.indexOf('/') === 0 ? s : '/' + s.replace(/^\.\//, '');
      return origin + path;
    } catch (e1) {
      return raw;
    }
  }

  function uniqStrings(arr) {
    var out = [];
    var seen = {};
    arr.forEach(function (v) {
      if (!v || seen[v]) return;
      seen[v] = true;
      out.push(v);
    });
    return out;
  }

  /**
   * Génère plusieurs variantes d’URL pour éviter les 404 dus aux différences de base path.
   * Ordre: valeur brute -> URL selon document -> URL racine hostname -> URL selon dossier courant.
   */
  function mediaCandidates(raw) {
    if (raw == null) return [];
    var s = String(raw).trim();
    if (!s) return [];
    var c = [s];
    try { c.push(new URL(s, window.location.href).href); } catch (e0) {}
    try { c.push(new URL(s, window.location.origin + '/').href); } catch (e1) {}
    try {
      var baseDir = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
      c.push(new URL(s, baseDir).href);
    } catch (e2) {}
    c.push(resolveMediaUrl(s));
    return uniqStrings(c);
  }

  function bindMediaFallback(root) {
    if (!root) return;
    var nodes = root.querySelectorAll('img[data-cms-candidates],video[data-cms-candidates]');
    nodes.forEach(function (el) {
      if (el.getAttribute('data-cms-fallback-bound') === 'true') return;
      el.setAttribute('data-cms-fallback-bound', 'true');
      var raw = el.getAttribute('data-cms-candidates') || '[]';
      var candidates = [];
      try { candidates = JSON.parse(raw); } catch (e0) { candidates = []; }
      if (!Array.isArray(candidates) || candidates.length === 0) return;
      var i = 0;
      function applyCandidate(idx) {
        if (idx >= candidates.length) return;
        var src = candidates[idx];
        if (!src) return;
        if (el.tagName === 'VIDEO') {
          el.src = src;
          try { el.load(); } catch (e1) {}
        } else {
          el.src = src;
        }
        el.setAttribute('data-cms-candidate-index', String(idx));
      }
      el.addEventListener('error', function () {
        i += 1;
        if (i < candidates.length) applyCandidate(i);
      });
      applyCandidate(0);
    });
  }

  function ensureAllInDom() {
    sectionIds.forEach(function (id) {
      var el = sectionEls[id];
      if (el && el.parentNode !== mainEl) {
        el.style.display = 'none';
        mainEl.appendChild(el);
      }
    });
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function objPosStyle(pos) {
    if (!pos) return '';
    return ' style="object-position:' + pos.x + '% ' + pos.y + '%"';
  }

  function applyContentPosition(sectionId, pos) {
    var contentEl = document.querySelector('#' + sectionId + ' .hero__content, #' + sectionId + ' .about__text, #' + sectionId + ' .video-loop__title, #' + sectionId + ' .video-play__title, #' + sectionId + ' .contact__title, #' + sectionId + ' .services__title');
    if (!contentEl || !pos) return;
    var parent = contentEl.parentElement;
    if (parent) parent.style.position = 'relative';
    contentEl.style.position = 'absolute';
    contentEl.style.left = pos.x + '%';
    contentEl.style.top = pos.y + '%';
    contentEl.style.transform = 'translate(-50%, -50%)';
  }

  function populateHero(data) {
    if (!data.hero) return;
    setText('hero-title', data.hero.title || '');
    setText('hero-subtitle', data.hero.subtitle || '');
    var el = document.getElementById('hero-media');
    if (!el) return;
    var imgCandidates = mediaCandidates(data.hero.image || '');
    var imgSrc = imgCandidates[0] || '';
    var imgStyle = objPosStyle(data.hero.imagePosition);
    var html;
    if (data.hero.video) {
      var vCandidates = mediaCandidates(data.hero.video);
      html = '<video class="hero__image"' + imgStyle + ' poster="' + escapeHtml(imgSrc) + '" muted loop playsinline autoplay preload="auto" data-cms-candidates="' + escapeHtml(JSON.stringify(vCandidates)) + '"></video>';
    } else {
      var allImg = uniqStrings(
        mediaCandidates(data.hero.imageAvif || '')
          .concat(mediaCandidates(data.hero.imageWebp || ''))
          .concat(imgCandidates)
      );
      html = '<img class="hero__image"' + imgStyle + ' alt="" loading="eager" fetchpriority="high" data-cms-candidates="' + escapeHtml(JSON.stringify(allImg)) + '">';
    }
    el.innerHTML = html;
    bindMediaFallback(el);
    if (data.hero.contentPosition) applyContentPosition('hero', data.hero.contentPosition);
  }

  function populateAbout(data) {
    if (!data.about) return;
    setText('about-title', data.about.title || '');
    setText('about-text', data.about.text || '');
    var el = document.getElementById('about-media');
    if (!el) return;
    var imgCandidates = mediaCandidates(data.about.image || '');
    var imgSrc = imgCandidates[0] || '';
    var imgStyle = objPosStyle(data.about.imagePosition);
    var html;
    if (data.about.video) {
      var avCandidates = mediaCandidates(data.about.video);
      html = '<video class="about__image"' + imgStyle + ' poster="' + escapeHtml(imgSrc) + '" muted loop playsinline controls preload="auto" data-cms-candidates="' + escapeHtml(JSON.stringify(avCandidates)) + '"></video>';
    } else {
      var allImg = uniqStrings(
        mediaCandidates(data.about.imageAvif || '')
          .concat(mediaCandidates(data.about.imageWebp || ''))
          .concat(imgCandidates)
      );
      html = '<img class="about__image"' + imgStyle + ' alt="" data-cms-candidates="' + escapeHtml(JSON.stringify(allImg)) + '">';
    }
    el.innerHTML = html;
    bindMediaFallback(el);
    if (data.about.contentPosition) applyContentPosition('about', data.about.contentPosition);
  }

  function populateServices(data) {
    if (!data.services) return;
    setText('services-title', data.services.title || '');
    var listEl = document.getElementById('services-list');
    if (listEl && Array.isArray(data.services.items)) {
      listEl.innerHTML = data.services.items
        .map(function (item) {
          return '<div class="service-card">' +
            '<h3 class="service-card__title">' + escapeHtml(item.title || '') + '</h3>' +
            '<p class="service-card__description">' + escapeHtml(item.description || '') + '</p>' +
            '</div>';
        })
        .join('');
    }
    if (data.services.contentPosition) applyContentPosition('services', data.services.contentPosition);
  }

  function populateContact(data) {
    if (!data.contact) return;
    setText('contact-title', data.contact.title || '');
    setText('contact-text', data.contact.text || '');
    var emailEl = document.getElementById('contact-email');
    if (emailEl) emailEl.textContent = data.contact.email || '';
    var cta = document.getElementById('contact-cta');
    if (cta) {
      cta.textContent = data.contact.buttonLabel || 'Contact';
      cta.href = data.contact.email ? 'mailto:' + data.contact.email : '#';
    }
    if (data.contact.contentPosition) applyContentPosition('contact', data.contact.contentPosition);
  }

  function populateVideoLoop(data) {
    var titleEl = document.getElementById('video-loop-title');
    var mediaEl = document.getElementById('video-loop-media');
    if (!data.videoLoop) return;
    if (titleEl) titleEl.textContent = data.videoLoop.title || '';
    if (mediaEl) {
      if (data.videoLoop.video) {
        var imgStyle = objPosStyle(data.videoLoop.imagePosition);
        var vlCandidates = mediaCandidates(data.videoLoop.video);
        mediaEl.innerHTML = '<video' + imgStyle + ' muted loop playsinline autoplay preload="auto" data-cms-candidates="' + escapeHtml(JSON.stringify(vlCandidates)) + '"></video>';
      } else {
        mediaEl.innerHTML = '';
      }
    }
    bindMediaFallback(mediaEl);
    if (data.videoLoop.contentPosition) applyContentPosition('videoLoop', data.videoLoop.contentPosition);
  }

  function populateVideoPlay(data) {
    var titleEl = document.getElementById('video-play-title');
    var mediaEl = document.getElementById('video-play-media');
    if (!data.videoPlay) return;
    if (titleEl) titleEl.textContent = data.videoPlay.title || '';
    if (mediaEl) {
      if (data.videoPlay.video) {
        var posterPath = data.videoPlay.poster ? resolveMediaUrl(data.videoPlay.poster) : '';
        var posterAttr = posterPath ? ' poster="' + escapeHtml(posterPath) + '"' : '';
        var imgStyle = objPosStyle(data.videoPlay.imagePosition);
        var vpCandidates = mediaCandidates(data.videoPlay.video);
        mediaEl.innerHTML = '<video' + imgStyle + posterAttr + ' controls playsinline preload="auto" data-cms-candidates="' + escapeHtml(JSON.stringify(vpCandidates)) + '"></video>';
      } else {
        mediaEl.innerHTML = '';
      }
    }
    bindMediaFallback(mediaEl);
    if (data.videoPlay.contentPosition) applyContentPosition('videoPlay', data.videoPlay.contentPosition);
  }

  /** Réinitialise toutes les zones de contenu avant d’appliquer une page (évite médias/textes fantômes entre pages / messages). */
  function clearPageSections() {
    setText('hero-title', '');
    setText('hero-subtitle', '');
    var hm = document.getElementById('hero-media');
    if (hm) hm.innerHTML = '';
    setText('about-title', '');
    setText('about-text', '');
    var am = document.getElementById('about-media');
    if (am) am.innerHTML = '';
    setText('services-title', '');
    var sl = document.getElementById('services-list');
    if (sl) sl.innerHTML = '';
    setText('contact-title', '');
    setText('contact-text', '');
    var ce = document.getElementById('contact-email');
    if (ce) ce.textContent = '';
    var cta = document.getElementById('contact-cta');
    if (cta) {
      cta.textContent = '';
      cta.href = '#';
    }
    setText('video-loop-title', '');
    var vlm = document.getElementById('video-loop-media');
    if (vlm) vlm.innerHTML = '';
    setText('video-play-title', '');
    var vpm = document.getElementById('video-play-media');
    if (vpm) vpm.innerHTML = '';
  }

  /** localhost / 127.0.0.1 / [::1] équivalents pour éviter de rejeter CMS_CONTENT silencieusement. */
  function originAllowsCmsParent(actualOrigin, expectedOrigin) {
    if (!expectedOrigin) return true;
    if (actualOrigin === expectedOrigin) return true;
    try {
      var a = new URL(actualOrigin);
      var b = new URL(expectedOrigin);
      function normHost(h) {
        if (h === '127.0.0.1' || h === '[::1]') return 'localhost';
        return h;
      }
      return (
        a.protocol === b.protocol &&
        normHost(a.hostname) === normHost(b.hostname) &&
        a.port === b.port
      );
    } catch (err) {
      return false;
    }
  }

  function applyTheme(theme) {
    if (!theme) return;
    var t = Object.assign({}, defaultTheme, theme);
    var el;
    if (el = document.getElementById('hero-title')) el.style.color = t.heroTitle;
    if (el = document.getElementById('hero-subtitle')) el.style.color = t.heroSubtitle;
    if (el = document.getElementById('about-title')) el.style.color = t.aboutTitle;
    if (el = document.getElementById('about-text')) el.style.color = t.aboutText;
    var svcEl = sectionEls['services'];
    if (svcEl) svcEl.style.background = t.servicesBg;
    if (el = document.getElementById('services-title')) el.style.color = t.servicesTitle;
    var cards = document.querySelectorAll('.service-card');
    for (var i = 0; i < cards.length; i++) {
      cards[i].style.background = t.serviceCardBg;
      var title = cards[i].querySelector('.service-card__title');
      var desc = cards[i].querySelector('.service-card__description');
      if (title) title.style.color = t.serviceCardTitle;
      if (desc) desc.style.color = t.serviceCardText;
    }
    if (el = document.getElementById('contact-title')) el.style.color = t.contactTitle;
    if (el = document.getElementById('contact-text')) el.style.color = t.contactText;
    if (el = document.getElementById('contact-email')) el.style.color = t.contactText;
    if (el = document.getElementById('contact-cta')) {
      el.style.background = t.contactButtonBg;
      el.style.color = t.contactButtonText;
    }
  }

  function renderPage(pageData, theme) {
    if (!pageData || !mainEl) return;

    var order = pageData.sectionOrder && pageData.sectionOrder.length
      ? pageData.sectionOrder
      : ['hero', 'about', 'services', 'contact'];
    order = order.filter(function (id) { return pageData[id] != null; });

    ensureAllInDom();
    clearPageSections();

    populateHero(pageData);
    populateAbout(pageData);
    populateServices(pageData);
    populateContact(pageData);
    populateVideoLoop(pageData);
    populateVideoPlay(pageData);
    if (theme) applyTheme(theme);

    sectionIds.forEach(function (id) {
      var el = sectionEls[id];
      if (el && el.parentNode === mainEl) mainEl.removeChild(el);
    });

    order.forEach(function (id) {
      var el = sectionEls[id];
      if (el) {
        el.style.display = '';
        mainEl.appendChild(el);
      }
    });

    sectionIds.forEach(function (id) {
      if (order.indexOf(id) === -1 && sectionEls[id]) {
        sectionEls[id].style.display = 'none';
      }
    });
  }

  /**
   * @param {object} data - content.json (mono ou multi-pages)
   * @param {object} [opts]
   * @param {string} [opts.pageSlug] - forcé depuis le CMS (parent ne peut pas toujours poser le hash cross-origin)
   */
  function injectCmsEditStyles() {
    if (!cmsEmbed || document.getElementById('cms-embed-styles')) return;
    var s = document.createElement('style');
    s.id = 'cms-embed-styles';
    s.textContent =
      '[data-cms-inline]{cursor:text;min-height:0.25em}' +
      '[data-cms-inline]:hover{outline:1px dashed rgba(94,234,212,0.45)}' +
      '[data-cms-inline]:focus{outline:2px solid rgba(45,212,191,0.85);outline-offset:2px}' +
      '[data-cms-media]{cursor:pointer;position:relative}' +
      '[data-cms-media]:hover{outline:2px dashed rgba(94,234,212,0.55);outline-offset:2px}' +
      '[data-cms-media] img,[data-cms-media] picture,[data-cms-media] source{pointer-events:none}' +
      '[data-cms-media] video{cursor:pointer;pointer-events:auto}';
    document.head.appendChild(s);
  }

  function postUploadRequestToParent(uploadKey) {
    var po = cmsParentOrigin || getTrustedCmsOrigin();
    window.parent.postMessage(
      { source: 'cms-site', type: 'CMS_UPLOAD_REQUEST', uploadKey: uploadKey },
      po || '*'
    );
  }

  function resolveMediaUploadKey(zoneEl, ev) {
    var mid = zoneEl.getAttribute('data-cms-media');
    if (mid === 'hero-media-zone') {
      var boxH = zoneEl.querySelector('#hero-media');
      return boxH && boxH.querySelector('video') ? 'hero-video' : 'hero';
    }
    if (mid === 'about-media-zone') {
      var boxA = zoneEl.querySelector('#about-media');
      return boxA && boxA.querySelector('video') ? 'about-video' : 'about';
    }
    if (mid === 'video-loop-media') return 'videoLoop-video';
    if (mid === 'video-play-media') return ev.altKey ? 'videoPlay-poster' : 'videoPlay-video';
    return null;
  }

  function bindCmsMediaClickOnce() {
    if (!cmsEmbed || cmsMediaClickBound) return;
    cmsMediaClickBound = true;
    document.addEventListener(
      'click',
      function (ev) {
        if (!cmsEmbed) return;
        var el = ev.target.closest('[data-cms-media]');
        if (!el) return;
        var vid = ev.target.closest && ev.target.closest('video');
        if (vid && el.contains(vid)) {
          if (!ev.shiftKey) return;
          ev.preventDefault();
          ev.stopPropagation();
          var k = resolveMediaUploadKey(el, ev);
          if (k) postUploadRequestToParent(k);
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        var key = resolveMediaUploadKey(el, ev);
        if (key) postUploadRequestToParent(key);
      },
      true
    );
  }

  function markCmsMediaContainers() {
    if (!cmsEmbed) return;
    ['hero-media-zone', 'about-media-zone', 'video-loop-media', 'video-play-media'].forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.setAttribute('data-cms-media', id);
    });
  }

  function getEmbedPageSlug() {
    if (embedIsMultiPage) {
      var h = (window.location.hash || '').replace(/^#/, '');
      return embedActivePageSlug || h || 'index';
    }
    var h2 = (window.location.hash || '').replace(/^#/, '');
    return h2 || undefined;
  }

  function postPatchToParent(patch) {
    var po = cmsParentOrigin || getTrustedCmsOrigin();
    window.parent.postMessage(
      {
        source: 'cms-site',
        type: 'CMS_PATCH',
        pageSlug: getEmbedPageSlug(),
        patch: patch
      },
      po || '*'
    );
  }

  function wireText(el, getPatch) {
    if (!el) return;
    if (el.getAttribute('data-cms-wired') === 'true') return;
    el.setAttribute('data-cms-wired', 'true');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-cms-inline', 'true');
    el.setAttribute('spellcheck', 'false');
    var t;
    function flush() {
      clearTimeout(t);
      var p = getPatch();
      if (p) postPatchToParent(p);
    }
    el.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(flush, 450);
    });
    el.addEventListener('blur', flush);
    if (el.tagName === 'A') {
      el.addEventListener('click', function (ev) {
        if (cmsEmbed) ev.preventDefault();
      });
    }
  }

  function wireServicesBlock() {
    function readServicesAndPost() {
      var c2 = document.querySelectorAll('#services-list .service-card');
      var it = [];
      c2.forEach(function (card) {
        var t2 = card.querySelector('.service-card__title');
        var d2 = card.querySelector('.service-card__description');
        it.push({
          title: (t2 && t2.textContent) || '',
          description: (d2 && d2.textContent) || ''
        });
      });
      var st2 = document.getElementById('services-title');
      return { services: { title: (st2 && st2.textContent) || '', items: it } };
    }
    var st = document.getElementById('services-title');
    wireText(st, readServicesAndPost);
    var cards = document.querySelectorAll('#services-list .service-card');
    cards.forEach(function (card) {
      var tt = card.querySelector('.service-card__title');
      var dd = card.querySelector('.service-card__description');
      wireText(tt, readServicesAndPost);
      wireText(dd, readServicesAndPost);
    });
  }

  function wireInlineEditing() {
    if (!cmsEmbed) return;
    injectCmsEditStyles();
    bindCmsMediaClickOnce();
    markCmsMediaContainers();
    wireText(document.getElementById('hero-title'), function () {
      return { hero: { title: (document.getElementById('hero-title') || {}).textContent || '' } };
    });
    wireText(document.getElementById('hero-subtitle'), function () {
      return { hero: { subtitle: (document.getElementById('hero-subtitle') || {}).textContent || '' } };
    });
    wireText(document.getElementById('about-title'), function () {
      return { about: { title: (document.getElementById('about-title') || {}).textContent || '' } };
    });
    wireText(document.getElementById('about-text'), function () {
      return { about: { text: (document.getElementById('about-text') || {}).textContent || '' } };
    });
    wireServicesBlock();
    wireText(document.getElementById('video-loop-title'), function () {
      return { videoLoop: { title: (document.getElementById('video-loop-title') || {}).textContent || '' } };
    });
    wireText(document.getElementById('video-play-title'), function () {
      return { videoPlay: { title: (document.getElementById('video-play-title') || {}).textContent || '' } };
    });
    wireText(document.getElementById('contact-title'), function () {
      return { contact: { title: (document.getElementById('contact-title') || {}).textContent || '' } };
    });
    wireText(document.getElementById('contact-text'), function () {
      return { contact: { text: (document.getElementById('contact-text') || {}).textContent || '' } };
    });
    wireText(document.getElementById('contact-email'), function () {
      var raw = (document.getElementById('contact-email') || {}).textContent || '';
      var email = raw.replace(/\s+/g, ' ').trim();
      var ctaEl = document.getElementById('contact-cta');
      if (ctaEl) ctaEl.href = email ? 'mailto:' + email : '#';
      return { contact: { email: email } };
    });
    var cta = document.getElementById('contact-cta');
    wireText(cta, function () {
      var el = document.getElementById('contact-cta');
      return { contact: { buttonLabel: (el && el.textContent) || '' } };
    });
  }

  function scheduleInlineWire() {
    if (!cmsEmbed) return;
    requestAnimationFrame(function () {
      wireInlineEditing();
    });
  }

  function renderContent(data, opts) {
    opts = opts || {};
    if (!data) return;

    var nav = document.getElementById('site-nav');
    var isMultiPage = data.pages && typeof data.pages === 'object' && Object.keys(data.pages).length > 0;
    embedIsMultiPage = isMultiPage;

    if (isMultiPage) {
      if (nav) nav.removeAttribute('hidden');
      var pageOrder = data.pageOrder && data.pageOrder.length ? data.pageOrder : Object.keys(data.pages);

      var getPage = function () {
        var hash = (window.location.hash || '').replace(/^#/, '') || pageOrder[0] || 'index';
        return pageOrder.indexOf(hash) !== -1 ? hash : pageOrder[0] || 'index';
      };

      var showPage = function (slugOverride) {
        var slug = slugOverride || getPage();
        if (pageOrder.indexOf(slug) === -1) slug = pageOrder[0] || 'index';
        embedActivePageSlug = slug;
        renderPage(data.pages[slug], data.theme);
        if (cmsEmbed && slugOverride != null && String(slugOverride) !== '') {
          try {
            var nh = '#' + slug;
            if (window.location.hash !== nh) history.replaceState(null, '', nh);
          } catch (e4) {}
        }
        if (nav) {
          [].forEach.call(nav.querySelectorAll('.site-nav__link'), function (link) {
            link.classList.toggle('active', link.getAttribute('data-page') === slug);
          });
        }
        window.scrollTo(0, 0);
      };

      showPage(opts.pageSlug);

      if (!hashChangeBound) {
        hashChangeBound = true;
        window.addEventListener('hashchange', function () {
          showPage();
          scheduleInlineWire();
          if (cmsEmbed) {
            window.parent.postMessage({ source: 'cms-site', type: 'CMS_PAGE', slug: getPage() }, getTrustedCmsOrigin() || '*');
          }
        });
      }
      scheduleInlineWire();
      return;
    }

    if (nav) nav.setAttribute('hidden', '');
    renderPage(data, data.theme);
    scheduleInlineWire();
  }

  function getTrustedCmsOrigin() {
    try {
      var m = window.location.search.match(/[?&]parentOrigin=([^&]+)/);
      if (m) return decodeURIComponent(m[1]);
    } catch (e1) {}
    try {
      if (document.referrer) return new URL(document.referrer).origin;
    } catch (e2) {}
    return null;
  }

  if (cmsEmbed) {
    var trusted = getTrustedCmsOrigin();
    cmsParentOrigin = trusted;
    injectCmsEditStyles();
    bindCmsMediaClickOnce();
    window.addEventListener('message', function (e) {
      if (e.source !== window.parent) return;
      var expectedOrigin = cmsParentOrigin || getTrustedCmsOrigin();
      if (expectedOrigin && !originAllowsCmsParent(e.origin, expectedOrigin)) {
        console.warn('[CMS embed] origine inattendue, fallback sur origine runtime:', e.origin, '(attendu:', expectedOrigin + ')');
      }
      if (!e.data || e.data.source !== 'cms-app' || e.data.type !== 'CMS_CONTENT') return;
      try {
        cmsParentOrigin = e.origin;
        renderContent(e.data.content, { pageSlug: e.data.pageSlug || undefined });
        window.parent.postMessage({ source: 'cms-site', type: 'CMS_APPLIED' }, cmsParentOrigin || e.origin || '*');
      } catch (err) {
        console.error('CMS embed apply failed:', err);
      }
    });
    window.parent.postMessage({ source: 'cms-site', type: 'CMS_READY' }, trusted || '*');
  } else {
    fetch(contentPath)
      .then(function (r) {
        if (!r.ok) throw new Error('content.json not found');
        return r.json();
      })
      .then(function (d) {
        renderContent(d);
      })
      .catch(function (err) {
        console.error('Failed to load content:', err);
        setText('hero-title', 'Contenu non chargé');
        setText('hero-subtitle', 'Vérifiez que content.json existe.');
      });
  }
})();
