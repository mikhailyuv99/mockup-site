(function () {
  var contentPath = 'content.json';

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

  function populateHero(data) {
    if (!data.hero) return;
    setText('hero-title', data.hero.title || '');
    setText('hero-subtitle', data.hero.subtitle || '');
    var el = document.getElementById('hero-media');
    if (!el) return;
    var imgSrc = data.hero.image || '';
    var html;
    if (data.hero.video) {
      html = '<video class="hero__image" poster="' + escapeHtml(imgSrc) + '" src="' + escapeHtml(data.hero.video) + '" muted loop playsinline autoplay></video>';
    } else if (data.hero.imageAvif || data.hero.imageWebp) {
      html = '<picture>';
      if (data.hero.imageAvif) html += '<source type="image/avif" srcset="' + escapeHtml(data.hero.imageAvif) + '">';
      if (data.hero.imageWebp) html += '<source type="image/webp" srcset="' + escapeHtml(data.hero.imageWebp) + '">';
      html += '<img class="hero__image" src="' + escapeHtml(imgSrc) + '" alt="">';
      html += '</picture>';
    } else {
      html = '<img class="hero__image" src="' + escapeHtml(imgSrc) + '" alt="">';
    }
    el.innerHTML = html;
  }

  function populateAbout(data) {
    if (!data.about) return;
    setText('about-title', data.about.title || '');
    setText('about-text', data.about.text || '');
    var el = document.getElementById('about-media');
    if (!el) return;
    var imgSrc = data.about.image || '';
    var html;
    if (data.about.video) {
      html = '<video class="about__image" poster="' + escapeHtml(imgSrc) + '" src="' + escapeHtml(data.about.video) + '" muted loop playsinline controls></video>';
    } else if (data.about.imageAvif || data.about.imageWebp) {
      html = '<picture>';
      if (data.about.imageAvif) html += '<source type="image/avif" srcset="' + escapeHtml(data.about.imageAvif) + '">';
      if (data.about.imageWebp) html += '<source type="image/webp" srcset="' + escapeHtml(data.about.imageWebp) + '">';
      html += '<img class="about__image" src="' + escapeHtml(imgSrc) + '" alt="">';
      html += '</picture>';
    } else {
      html = '<img class="about__image" src="' + escapeHtml(imgSrc) + '" alt="">';
    }
    el.innerHTML = html;
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
  }

  function populateContact(data) {
    if (!data.contact) return;
    setText('contact-title', data.contact.title || '');
    setText('contact-text', data.contact.text || '');
    var cta = document.getElementById('contact-cta');
    if (cta) {
      cta.textContent = data.contact.buttonLabel || 'Contact';
      cta.href = data.contact.email ? 'mailto:' + data.contact.email : '#';
    }
  }

  function populateVideoLoop(data) {
    var titleEl = document.getElementById('video-loop-title');
    var mediaEl = document.getElementById('video-loop-media');
    if (!data.videoLoop) return;
    if (titleEl) titleEl.textContent = data.videoLoop.title || '';
    if (mediaEl) {
      if (data.videoLoop.video) {
        mediaEl.innerHTML = '<video src="' + escapeHtml(data.videoLoop.video) + '" muted loop playsinline autoplay></video>';
      } else {
        mediaEl.innerHTML = '';
      }
    }
  }

  function populateVideoPlay(data) {
    var titleEl = document.getElementById('video-play-title');
    var mediaEl = document.getElementById('video-play-media');
    if (!data.videoPlay) return;
    if (titleEl) titleEl.textContent = data.videoPlay.title || '';
    if (mediaEl) {
      if (data.videoPlay.video) {
        var posterAttr = data.videoPlay.poster ? ' poster="' + escapeHtml(data.videoPlay.poster) + '"' : '';
        mediaEl.innerHTML = '<video src="' + escapeHtml(data.videoPlay.video) + '"' + posterAttr + ' controls playsinline preload="metadata"></video>';
      } else {
        mediaEl.innerHTML = '';
      }
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

  function renderContent(data) {
    if (!data) return;

    var nav = document.getElementById('site-nav');
    var isMultiPage = data.pages && typeof data.pages === 'object' && Object.keys(data.pages).length > 0;

    if (isMultiPage) {
      if (nav) nav.removeAttribute('hidden');
      var pageOrder = data.pageOrder && data.pageOrder.length ? data.pageOrder : Object.keys(data.pages);

      var getPage = function () {
        var hash = (window.location.hash || '').replace(/^#/, '') || pageOrder[0] || 'index';
        return pageOrder.indexOf(hash) !== -1 ? hash : pageOrder[0] || 'index';
      };

      var showPage = function () {
        var slug = getPage();
        renderPage(data.pages[slug], data.theme);
        if (nav) {
          [].forEach.call(nav.querySelectorAll('.site-nav__link'), function (link) {
            link.classList.toggle('active', link.getAttribute('data-page') === slug);
          });
        }
        window.scrollTo(0, 0);
      };

      showPage();
      window.addEventListener('hashchange', showPage);
      return;
    }

    if (nav) nav.setAttribute('hidden', '');
    renderPage(data, data.theme);
  }

  fetch(contentPath)
    .then(function (r) {
      if (!r.ok) throw new Error('content.json not found');
      return r.json();
    })
    .then(renderContent)
    .catch(function (err) {
      console.error('Failed to load content:', err);
      setText('hero-title', 'Contenu non chargé');
      setText('hero-subtitle', 'Vérifiez que content.json existe.');
    });
})();
