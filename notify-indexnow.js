const https = require('https');

const data = JSON.stringify({
  host: "poseidon-network.com",
  key: "7cb32b72fc6749af97b1e9e9de7f2508",
  keyLocation: "https://poseidon-network.com/7cb32b72fc6749af97b1e9e9de7f2508.txt",
  urlList: [
    "https://poseidon-network.com/",
    "https://poseidon-network.com/refurbished-dell-equipment.html",
    "https://poseidon-network.com/new-dell-equipment.html",
    "https://poseidon-network.com/business-voip-cape-town.html"
  ]
});

const options = {
  hostname: 'api.indexnow.org',
  port: 443,
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`IndexNow response status: ${res.statusCode}`);
});

req.on('error', (error) => {
  console.error('IndexNow error:', error);
});

req.write(data);
req.end();