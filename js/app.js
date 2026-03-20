(function () {
  var contentPath = 'content.json';
  /** Chargé dans l’iframe du CMS : pas de fetch, contenu poussé par postMessage (rendu = site déployé). */
  var cmsEmbed = /[?&]cmsEmbed=1(?:&|$)/.test(window.location.search);
  var hashChangeBound = false;
  var cmsMediaClickBound = false;
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
    var imgSrc = data.hero.image || '';
    var imgStyle = objPosStyle(data.hero.imagePosition);
    var html;
    if (data.hero.video) {
      html = '<video class="hero__image"' + imgStyle + ' poster="' + escapeHtml(imgSrc) + '" src="' + escapeHtml(data.hero.video) + '" muted loop playsinline autoplay></video>';
    } else if (data.hero.imageAvif || data.hero.imageWebp) {
      html = '<picture>';
      if (data.hero.imageAvif) html += '<source type="image/avif" srcset="' + escapeHtml(data.hero.imageAvif) + '">';
      if (data.hero.imageWebp) html += '<source type="image/webp" srcset="' + escapeHtml(data.hero.imageWebp) + '">';
      html += '<img class="hero__image"' + imgStyle + ' src="' + escapeHtml(imgSrc) + '" alt="">';
      html += '</picture>';
    } else {
      html = '<img class="hero__image"' + imgStyle + ' src="' + escapeHtml(imgSrc) + '" alt="">';
    }
    el.innerHTML = html;
    if (data.hero.contentPosition) applyContentPosition('hero', data.hero.contentPosition);
  }

  function populateAbout(data) {
    if (!data.about) return;
    setText('about-title', data.about.title || '');
    setText('about-text', data.about.text || '');
    var el = document.getElementById('about-media');
    if (!el) return;
    var imgSrc = data.about.image || '';
    var imgStyle = objPosStyle(data.about.imagePosition);
    var html;
    if (data.about.video) {
      html = '<video class="about__image"' + imgStyle + ' poster="' + escapeHtml(imgSrc) + '" src="' + escapeHtml(data.about.video) + '" muted loop playsinline controls></video>';
    } else if (data.about.imageAvif || data.about.imageWebp) {
      html = '<picture>';
      if (data.about.imageAvif) html += '<source type="image/avif" srcset="' + escapeHtml(data.about.imageAvif) + '">';
      if (data.about.imageWebp) html += '<source type="image/webp" srcset="' + escapeHtml(data.about.imageWebp) + '">';
      html += '<img class="about__image"' + imgStyle + ' src="' + escapeHtml(imgSrc) + '" alt="">';
      html += '</picture>';
    } else {
      html = '<img class="about__image"' + imgStyle + ' src="' + escapeHtml(imgSrc) + '" alt="">';
    }
    el.innerHTML = html;
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
        mediaEl.innerHTML = '<video' + imgStyle + ' src="' + escapeHtml(data.videoLoop.video) + '" muted loop playsinline autoplay></video>';
      } else {
        mediaEl.innerHTML = '';
      }
    }
    if (data.videoLoop.contentPosition) applyContentPosition('videoLoop', data.videoLoop.contentPosition);
  }

  function populateVideoPlay(data) {
    var titleEl = document.getElementById('video-play-title');
    var mediaEl = document.getElementById('video-play-media');
    if (!data.videoPlay) return;
    if (titleEl) titleEl.textContent = data.videoPlay.title || '';
    if (mediaEl) {
      if (data.videoPlay.video) {
        var posterAttr = data.videoPlay.poster ? ' poster="' + escapeHtml(data.videoPlay.poster) + '"' : '';
        var imgStyle = objPosStyle(data.videoPlay.imagePosition);
        mediaEl.innerHTML = '<video' + imgStyle + ' src="' + escapeHtml(data.videoPlay.video) + '"' + posterAttr + ' controls playsinline preload="metadata"></video>';
      } else {
        mediaEl.innerHTML = '';
      }
    }
    if (data.videoPlay.contentPosition) applyContentPosition('videoPlay', data.videoPlay.contentPosition);
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
      '[data-cms-media] img,[data-cms-media] video,[data-cms-media] picture,[data-cms-media] source{pointer-events:none}';
    document.head.appendChild(s);
  }

  function postUploadRequestToParent(uploadKey) {
    var po = getTrustedCmsOrigin();
    window.parent.postMessage(
      { source: 'cms-site', type: 'CMS_UPLOAD_REQUEST', uploadKey: uploadKey },
      po || '*'
    );
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
        ev.preventDefault();
        ev.stopPropagation();
        var mid = el.getAttribute('data-cms-media');
        var key = null;
        if (mid === 'hero-media-zone') {
          var boxH = el.querySelector('#hero-media');
          key = boxH && boxH.querySelector('video') ? 'hero-video' : 'hero';
        } else if (mid === 'about-media-zone') {
          var boxA = el.querySelector('#about-media');
          key = boxA && boxA.querySelector('video') ? 'about-video' : 'about';
        } else if (mid === 'video-loop-media') key = 'videoLoop-video';
        else if (mid === 'video-play-media') key = ev.altKey ? 'videoPlay-poster' : 'videoPlay-video';
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
    var po = getTrustedCmsOrigin();
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
    injectCmsEditStyles();
    bindCmsMediaClickOnce();
    window.addEventListener('message', function (e) {
      if (trusted && e.origin !== trusted) return;
      if (!e.data || e.data.source !== 'cms-app' || e.data.type !== 'CMS_CONTENT') return;
      try {
        renderContent(e.data.content, { pageSlug: e.data.pageSlug || undefined });
        window.parent.postMessage({ source: 'cms-site', type: 'CMS_APPLIED' }, e.origin);
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
