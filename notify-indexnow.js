const https = require('https');

const fs = require('fs');
const path = require('path');

const HOST = "poseidon-network.com";

// Submit every page listed in sitemap.xml, so the sitemap is the single source of truth.
// Falls back to the core pages if the sitemap cannot be read.
let urlList = [
  "https://poseidon-network.com/",
  "https://poseidon-network.com/refurbished-dell-equipment.html",
  "https://poseidon-network.com/new-dell-equipment.html",
  "https://poseidon-network.com/business-voip-cape-town.html"
];
try {
  const xml = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
  const found = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map(m => m[1])
    .filter(u => u.startsWith('https://' + HOST + '/'));
  if (found.length) urlList = [...new Set(found)];
} catch (e) {
  console.log('IndexNow: sitemap.xml not read, using the default list.');
}
console.log('IndexNow: submitting ' + urlList.length + ' URLs.');

const data = JSON.stringify({
  host: HOST,
  key: "7cb32b72fc6749af97b1e9e9de7f2508",
  keyLocation: "https://poseidon-network.com/7cb32b72fc6749af97b1e9e9de7f2508.txt",
  urlList
});

const options = {
  hostname: 'api.indexnow.org',
  port: 443,
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 8000
};

// Never let this step slow down or fail a deploy.
const hardStop = setTimeout(() => {
  console.log('IndexNow: no clean finish within 10s, continuing the build.');
  process.exit(0);
}, 10000);
hardStop.unref();

const req = https.request(options, (res) => {
  console.log(`IndexNow response status: ${res.statusCode}`);
  // Read and discard the body so the connection closes straight away.
  res.resume();
  res.on('end', () => process.exit(0));
});

req.on('timeout', () => {
  console.log('IndexNow: request timed out, continuing the build.');
  req.destroy();
  process.exit(0);
});

req.on('error', (error) => {
  console.log('IndexNow skipped:', error.code || error.message);
  process.exit(0);
});

req.write(data);
req.end();
