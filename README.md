# Mockup site — éditable via CMS

Site de démo qui lit tout son contenu (textes et images) depuis **`content.json`**.  
Utilisez-le pour développer et tester le CMS : le CMS n’aura qu’à modifier ce fichier (et éventuellement les images dans `images/`).

## Structure

- **`content.json`** — tous les textes et URLs d’images éditables
- **`index.html`** — structure fixe (hero, about, services, contact)
- **`css/style.css`** — styles
- **`js/app.js`** — charge `content.json` et remplit la page
- **`images/`** — images du site (hero, about) ; le CMS pourra en ajouter

## Lancer en local

Le site charge `content.json` via `fetch`. Pour éviter les soucis CORS en ouvrant simplement `index.html` dans le navigateur, lancez un petit serveur local :

```bash
# Avec Python 3
python -m http.server 8080

# Ou avec Node (npx)
npx serve -l 8080
```

Puis ouvrez : **http://localhost:8080**

## Modifier le contenu

Éditez **`content.json`** puis rechargez la page pour voir les changements. Plus tard, le CMS fera la même chose (édition du JSON + commit/push).
