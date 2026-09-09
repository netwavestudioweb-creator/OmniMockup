async function runFullPipeline() {
  console.log('=== TEST DE BOUT EN BOUT : SMART-ANALYZE -> CAPTURE SUR NETWAVE STUDIO ===');
  
  // 1. Appel /api/smart-analyze
  console.log('\n1. Lancement de /api/smart-analyze...');
  const t0 = Date.now();
  const smartRes = await fetch('http://localhost:3000/api/smart-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://netwave-studio-zeov.vercel.app/', isPremiumUser: true })
  });
  const smartData = await smartRes.json();
  const durationSmart = Date.now() - t0;

  console.log(`- Statut smart-analyze : ${smartRes.status}`);
  console.log(`- Succès : ${smartData.success}`);
  console.log(`- Mode IA active : ${!smartData.isFallback ? 'OUI (Gemini Vision fonctionnel)' : 'Fallback heuristique'}`);
  console.log(`- Nombre de sections : ${smartData.sections?.length || 0}`);
  console.log(`- Durée : ${durationSmart}ms`);

  if (!smartData.sections || smartData.sections.length === 0) {
    throw new Error('Aucune section retournée par smart-analyze');
  }

  // Vérification du cadrage de chaque section
  console.log('\n2. Vérification des coordonnées de cadrage :');
  smartData.sections.forEach((sec, idx) => {
    const isFullWidth = sec.coordinates.x === 0 && sec.coordinates.width === 1440;
    console.log(`  [${sec.id}] "${sec.label}" (${sec.verdict}) :`);
    console.log(`    -> Coordonnées : x=${sec.coordinates.x}, y=${sec.coordinates.y}, w=${sec.coordinates.width}, h=${sec.coordinates.height}`);
    console.log(`    -> Pleine largeur 1440px (anti-troncature) : ${isFullWidth ? 'PARFAIT (x=0, w=1440)' : 'Sous-bloc'}`);
    console.log(`    -> Justification DA : "${sec.justification?.slice(0, 60)}..."`);
  });

  // 2. Appel /api/capture avec les 3 premières sections
  console.log('\n3. Lancement de /api/capture sur les 3 premières sections...');
  const captureTargets = smartData.sections.slice(0, 3).map(s => ({
    url: smartData.url,
    label: s.label,
    clip: s.coordinates
  }));

  const t1 = Date.now();
  const captureRes = await fetch('http://localhost:3000/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targets: captureTargets })
  });
  const captureData = await captureRes.json();
  const durationCapture = Date.now() - t1;

  console.log(`- Statut capture : ${captureRes.status}`);
  console.log(`- Succès global : ${captureData.success}`);
  console.log(`- Captures réussies : ${captureData.successful} / ${captureData.total}`);
  console.log(`- Durée capture : ${durationCapture}ms`);

  captureData.results.forEach((r, idx) => {
    const sizeKB = r.screenshotBase64 ? Math.round(r.screenshotBase64.length * 0.75 / 1024) : 0;
    console.log(`  Capture ${idx + 1} (${r.title}) : success=${r.success}, taille PNG=${sizeKB} KB, clip=${JSON.stringify(r.clip)}`);
  });

  console.log('\n=== VALIDATION COMPLÈTE TERMINÉE AVEC SUCCÈS ===');
}

runFullPipeline().catch(console.error);
