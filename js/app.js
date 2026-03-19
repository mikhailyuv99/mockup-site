(function () {
  const contentPath = 'content.json';

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

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setImage(id, src, alt) {
    var el = document.getElementById(id);
    if (!el) return;
    el.src = src || '';
    if (alt !== undefined) el.alt = alt;
  }

  function setHeroMedia(data) {
    var el = document.getElementById('hero-media');
    if (!el || !data.hero) return;
    var imgSrc = data.hero.image || '';
    var html;
    if (data.hero.video) {
      html = '<video class="hero__image" poster="' + escapeHtml(imgSrc) + '" src="' + escapeHtml(data.hero.video) + '" muted loop playsinline autoplay></video>';
    } else if (data.hero.imageAvif || data.hero.imageWebp) {
      html = '<picture>';
      if (data.hero.imageAvif) html += '<source type="image/avif" src="' + escapeHtml(data.hero.imageAvif) + '">';
      if (data.hero.imageWebp) html += '<source type="image/webp" src="' + escapeHtml(data.hero.imageWebp) + '">';
      html += '<img class="hero__image" src="' + escapeHtml(imgSrc) + '" alt="">';
      html += '</picture>';
    } else {
      html = '<img class="hero__image" src="' + escapeHtml(imgSrc) + '" alt="">';
    }
    el.innerHTML = html;
  }

  function setAboutMedia(data) {
    var el = document.getElementById('about-media');
    if (!el || !data.about) return;
    var imgSrc = data.about.image || '';
    var html;
    if (data.about.video) {
      html = '<video class="about__image" poster="' + escapeHtml(imgSrc) + '" src="' + escapeHtml(data.about.video) + '" muted loop playsinline controls></video>';
    } else if (data.about.imageAvif || data.about.imageWebp) {
      html = '<picture>';
      if (data.about.imageAvif) html += '<source type="image/avif" src="' + escapeHtml(data.about.imageAvif) + '">';
      if (data.about.imageWebp) html += '<source type="image/webp" src="' + escapeHtml(data.about.imageWebp) + '">';
      html += '<img class="about__image" src="' + escapeHtml(imgSrc) + '" alt="">';
      html += '</picture>';
    } else {
      html = '<img class="about__image" src="' + escapeHtml(imgSrc) + '" alt="">';
    }
    el.innerHTML = html;
  }

  function setVideoLoop(data) {
    var wrap = document.getElementById('videoLoop');
    var mediaEl = document.getElementById('video-loop-media');
    var titleEl = document.getElementById('video-loop-title');
    if (!wrap || !mediaEl || !titleEl) return;
    if (!data.videoLoop) {
      wrap.style.display = 'none';
      return;
    }
    var v = data.videoLoop;
    if (titleEl) titleEl.textContent = v.title || '';
    if (v.video) {
      mediaEl.innerHTML = '<video src="' + escapeHtml(v.video) + '" muted loop playsinline autoplay></video>';
      wrap.style.display = '';
    } else {
      mediaEl.innerHTML = '';
      wrap.style.display = '';
    }
  }

  function setVideoPlay(data) {
    var wrap = document.getElementById('videoPlay');
    var mediaEl = document.getElementById('video-play-media');
    var titleEl = document.getElementById('video-play-title');
    if (!wrap || !mediaEl || !titleEl) return;
    if (!data.videoPlay) {
      wrap.style.display = 'none';
      return;
    }
    var v = data.videoPlay;
    titleEl.textContent = v.title || '';
    if (v.video) {
      var posterAttr = v.poster ? ' poster="' + escapeHtml(v.poster) + '"' : '';
      mediaEl.innerHTML = '<video src="' + escapeHtml(v.video) + '"' + posterAttr + ' controls playsinline></video>';
      wrap.style.display = '';
    } else {
      mediaEl.innerHTML = '';
      wrap.style.display = '';
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
    if (el = document.getElementById('services')) el.style.background = t.servicesBg;
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

  var sectionIds = ['hero', 'videoLoop', 'videoPlay', 'about', 'services', 'contact'];

  function setSectionVisibility(order, data) {
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var inOrder = order.indexOf(id) !== -1;
      var hasData = data[id] != null;
      el.style.display = inOrder && hasData ? '' : 'none';
    });
  }

  function renderPage(pageData, theme) {
    if (!pageData) return;
    var order = pageData.sectionOrder && pageData.sectionOrder.length ? pageData.sectionOrder : ['hero', 'about', 'services', 'contact'];
    order = order.filter(function (id) { return pageData[id] != null; });

    if (pageData.hero) {
      setText('hero-title', pageData.hero.title || '');
      setText('hero-subtitle', pageData.hero.subtitle || '');
      setHeroMedia(pageData);
    }
    if (pageData.about) {
      setText('about-title', pageData.about.title || '');
      setText('about-text', pageData.about.text || '');
      setAboutMedia(pageData);
    }
    if (pageData.services) {
      setText('services-title', pageData.services.title || '');
      var listEl = document.getElementById('services-list');
      if (listEl && Array.isArray(pageData.services.items)) {
        listEl.innerHTML = pageData.services.items
          .map(function (item) {
            return '<div class="service-card">' +
              '<h3 class="service-card__title">' + escapeHtml(item.title || '') + '</h3>' +
              '<p class="service-card__description">' + escapeHtml(item.description || '') + '</p>' +
              '</div>';
          })
          .join('');
      }
    }
    if (pageData.contact) {
      setText('contact-title', pageData.contact.title || '');
      setText('contact-text', pageData.contact.text || '');
      var cta = document.getElementById('contact-cta');
      if (cta) {
        cta.textContent = pageData.contact.buttonLabel || 'Contact';
        cta.href = pageData.contact.email ? 'mailto:' + pageData.contact.email : '#';
      }
    }
    setVideoLoop(pageData);
    setVideoPlay(pageData);
    if (theme) applyTheme(theme);
    setSectionVisibility(order, pageData);

    var main = document.querySelector('main');
    if (main) {
      sectionIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode === main) main.removeChild(el);
      });
      order.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && pageData[id] != null) main.appendChild(el);
      });
    }
  }

  function renderContent(data) {
    if (!data) return;

    var nav = document.getElementById('site-nav');
    var isMultiPage = data.pages && typeof data.pages === 'object' && Object.keys(data.pages).length > 0;

    if (isMultiPage) {
      if (nav) nav.removeAttribute('hidden');
      var pageOrder = data.pageOrder && data.pageOrder.length ? data.pageOrder : Object.keys(data.pages);
      var getPage = function () {
        var hash = (window.location.hash || '#index').replace(/^#/, '') || 'index';
        return pageOrder.indexOf(hash) !== -1 ? hash : pageOrder[0] || 'index';
      };
      var currentPage = getPage();
      renderPage(data.pages[currentPage], data.theme);
      if (nav) {
        [].forEach.call(nav.querySelectorAll('.site-nav__link'), function (link) {
          link.classList.toggle('active', link.getAttribute('data-page') === currentPage);
        });
      }
      window.onhashchange = function () {
        var slug = getPage();
        renderPage(data.pages[slug], data.theme);
        if (nav) {
          [].forEach.call(nav.querySelectorAll('.site-nav__link'), function (link) {
            link.classList.toggle('active', link.getAttribute('data-page') === slug);
          });
        }
      };
      return;
    }

    if (nav) nav.setAttribute('hidden', '');
    renderPage(data, data.theme);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
