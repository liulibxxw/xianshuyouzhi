const fs = require('fs');
const path = require('path');
const https = require('https');

const urls = [
  "https://fontsapi.zeoseven.com/508/main/result.css"
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const target = path.join(__dirname, '..', 'result.css');
  try {
    const css = await download(urls[0]);
    fs.writeFileSync(target, css, 'utf8');
    console.log(`Downloaded font CSS to ${target}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
