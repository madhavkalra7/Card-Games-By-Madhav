const https = require('https');
const fs = require('fs');
const path = require('path');

const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
const faces = ['jack', 'queen', 'king'];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close(() => resolve(dest));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const cardsDir = path.join(__dirname, '..', 'public', 'cards');
  console.log('Downloading real royal face cards to:', cardsDir);

  for (const face of faces) {
    for (const suit of suits) {
      const filename = `${face}_of_${suit}.svg`;
      const url = `https://raw.githubusercontent.com/hayeah/playing-cards-assets/master/svg-cards/${filename}`;
      const dest = path.join(cardsDir, filename);

      try {
        await downloadFile(url, dest);
        const stats = fs.statSync(dest);
        console.log(`✓ Downloaded ${filename} (${Math.round(stats.size / 1024)} KB)`);
      } catch (err) {
        console.error(`✗ Error downloading ${filename}:`, err.message);
      }
    }
  }

  // Clean up any temporary files
  const testFiles = ['test_12h.svg', 'queen_of_hearts_real.svg'];
  for (const tf of testFiles) {
    const p = path.join(cardsDir, tf);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`Cleaned up temporary file: ${tf}`);
    }
  }

  console.log('Finished updating royal face cards!');
}

main();
