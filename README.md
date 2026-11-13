# Xiaomi 18 Fold — Sito di presentazione 3D

Sito one-page animato in 3D per la presentazione dello **Xiaomi 18 Fold** (concept dimostrativo non ufficiale).

## Anteprima locale

```bash
# dalla cartella del progetto
python3 -m http.server 8000
# poi apri http://localhost:8000
```

> Serve un server locale (o GitHub Pages): aprendo `index.html` direttamente da file i moduli ES non si caricano.

## Pubblicare con GitHub Pages

1. `Settings → Pages`
2. Source: `Deploy from a branch`, branch `main`, cartella `/ (root)`
3. Il sito sarà disponibile su `https://<utente>.github.io/Xiaomi-18-fold/`

## Struttura

- `index.html` — struttura della pagina, sezioni e import map di Three.js
- `style.css` — tema scuro, tipografia, layout e animazioni di reveal
- `main.js` — scena Three.js: telefono pieghevole modellato proceduralmente, cerniera animata, coreografia legata allo scroll, cambio colore

## Tecnologie

- [Three.js](https://threejs.org/) (via CDN, moduli ES) — rendering 3D
- Canvas API per le texture degli schermi (interno, esterno)
- IntersectionObserver per le animazioni di reveal
- Nessuna dipendenza da installare: tutto lato client
