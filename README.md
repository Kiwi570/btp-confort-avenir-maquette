# BTP Confort Avenir — maquette « Du plan au réel »

Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

- `index.html` : accueil (intro, calques photo, 5 planches métiers, méthode, avant/après, activités, engagements, confiance, zone, devis)
- `isolation.html` : page métier type
- `realisations.html` : galerie filtrable et fiches chantier
- `mentions-legales.html` : mentions légales et données personnelles

## À compléter avec le client

- Téléphone et email : `assets/js/data.js` (champs `telephone` et `email`), affichés partout automatiquement
- Horaires : `assets/js/data.js` (relevés sur Mappy, à confirmer)
- Assurance décennale, qualifications, avis, lieux et dates des chantiers : repérés par l’étiquette « à compléter »

## Technique

- GSAP 3.15 (ScrollTrigger, SplitText, Flip), Lenis, OGL : hébergés dans `assets/vendor`
- Effet WebGL « plan vers réel » : `assets/js/gl.js`, avec repli automatique sur les photos si l’appareil est trop lent ou sans WebGL
- Mode calme : bouton dans l’en-tête et réglage « réduire les animations » du système
- Formulaire de devis simulé : aucune donnée n’est envoyée
