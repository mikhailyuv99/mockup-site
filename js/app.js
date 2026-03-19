(function () {
  const contentPath = 'content.json';

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setImage(id, src, alt) {
    const el = document.getElementById(id);
    if (!el) return;
    el.src = src || '';
    if (alt !== undefined) el.alt = alt;
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
      const listEl = document.getElementById('services-list');
      if (listEl && Array.isArray(data.services.items)) {
        listEl.innerHTML = data.services.items
          .map(
            (item) => `
            <div class="service-card">
              <h3 class="service-card__title">${escapeHtml(item.title || '')}</h3>
              <p class="service-card__description">${escapeHtml(item.description || '')}</p>
            </div>
          `
          )
          .join('');
      }
    }

    if (data.contact) {
      setText('contact-title', data.contact.title || '');
      setText('contact-text', data.contact.text || '');
      const cta = document.getElementById('contact-cta');
      if (cta) {
        cta.textContent = data.contact.buttonLabel || 'Contact';
        cta.href = data.contact.email ? 'mailto:' + data.contact.email : '#';
      }
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  fetch(contentPath)
    .then((r) => {
      if (!r.ok) throw new Error('content.json not found');
      return r.json();
    })
    .then(renderContent)
    .catch((err) => {
      console.error('Failed to load content:', err);
      setText('hero-title', 'Contenu non chargé');
      setText('hero-subtitle', 'Vérifiez que content.json existe.');
    });
})();
