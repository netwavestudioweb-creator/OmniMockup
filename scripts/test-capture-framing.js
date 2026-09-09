const fs = require('fs');
const path = require('path');

async function testCapture() {
  console.log('--- TEST DE CAPTURE RÉELLE PLAYWRIGHT SUR NETWAVE STUDIO ---');

  // Coordonnées retournées par smart-analyze
  const targets = [
    {
      url: 'https://netwave-studio-zeov.vercel.app/',
      label: 'Hero & Proposition de Valeur Principale',
      clip: { x: 0, y: 83, width: 1440, height: 697 }
    },
    {
      url: 'https://netwave-studio-zeov.vercel.app/',
      label: 'Grille d\'Expertises Clés',
      clip: { x: 0, y: 879, width: 1440, height: 924 }
    }
  ];

  const res = await fetch('http://localhost:3000/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targets })
  });

  const data = await res.json();
  console.log('Capture Response:', {
    success: data.success,
    total: data.total,
    successful: data.successful,
    failed: data.failed,
    timeMs: data.totalExecutionTimeMs
  });

  if (data.results) {
    data.results.forEach((r, idx) => {
      console.log(`\nSection ${idx + 1} (${r.title}) :`);
      console.log(`- Success : ${r.success}`);
      console.log(`- Clip utilisé :`, JSON.stringify(r.clip));
      if (r.screenshotBase64) {
        const base64Data = r.screenshotBase64.replace(/^data:image\/png;base64,/, '');
        const outPath = path.join(__dirname, `test-capture-${idx + 1}.png`);
        fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
        console.log(`- Image PNG enregistrée : ${outPath} (${Math.round(base64Data.length / 1024)} KB)`);
      }
    });
  }
}

testCapture().catch(console.error);
