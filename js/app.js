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

  function renderContent(data) {
    if (!data) return;

    if (data.hero) {
      setText('hero-title', data.hero.title || '');
      setText('hero-subtitle', data.hero.subtitle || '');
      setImage('hero-image', data.hero.image || '', data.hero.title || '');
    }

    if (data.about) {
      setText('about-title', data.about.title || '');
      setText('about-text', data.about.text || '');
      setImage('about-image', data.about.image || '', data.about.title || '');
    }

    if (data.services) {
      setText('services-title', data.services.title || '');
      var listEl = document.getElementById('services-list');
      if (listEl && Array.isArray(data.services.items)) {
        listEl.innerHTML = data.services.items
          .map(
            function (item) {
              return '<div class="service-card">' +
                '<h3 class="service-card__title">' + escapeHtml(item.title || '') + '</h3>' +
                '<p class="service-card__description">' + escapeHtml(item.description || '') + '</p>' +
                '</div>';
            }
          )
          .join('');
      }
    }

    if (data.contact) {
      setText('contact-title', data.contact.title || '');
      setText('contact-text', data.contact.text || '');
      var cta = document.getElementById('contact-cta');
      if (cta) {
        cta.textContent = data.contact.buttonLabel || 'Contact';
        cta.href = data.contact.email ? 'mailto:' + data.contact.email : '#';
      }
    }

    applyTheme(data.theme);

    var order = data.sectionOrder && data.sectionOrder.length ? data.sectionOrder : ['hero', 'about', 'services', 'contact'];
    var main = document.querySelector('main');
    if (main) {
      order.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) main.appendChild(el);
      });
    }
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
