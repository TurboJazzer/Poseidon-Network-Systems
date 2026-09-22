const verifiedIpCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";

  const strictAllowedPatterns = [/googlebot/i, /googlebot-image/i, /googlebot-video/i, /bingbot/i, /msnbot/i, /bingpreview/i];
  const aiAgentAllowedPatterns = [/google-extended/i, /googleother/i, /google-cloudvertexbot/i];

  if (strictAllowedPatterns.some((re) => re.test(ua))) {
    const ip = context.ip || request.headers.get("x-nf-client-connection-ip") || "";
    const isBing = /bingbot|msnbot|bingpreview/i.test(ua);
    const pattern = isBing ? /\.search\.msn\.com$/i : /\.googlebot\.com$|\.google\.com$/i;
    const result = await isVerifiedIP(ip, pattern);
    // Fail open: a lookup error shouldn't block a real crawler; only a confirmed mismatch does.
    if (result !== false) {
      return context.next();
    }
    return new Response("Access restricted.", {
      status: 403,
      headers: { "content-type": "text/plain" }
    });
  }

  if (aiAgentAllowedPatterns.some((re) => re.test(ua))) {
    return context.next();
  }

  // Known spam/SEO crawlers and scraping frameworks only - generic dev/monitoring tools
  // (curl, wget, headless Chrome, Playwright/Puppeteer, uptime monitors) are left unblocked.
  const blockedPatterns = [
    /mj12bot/i, /dotbot/i, /petalbot/i,
    /bytespider/i, /scrapy/i
  ];

  if (blockedPatterns.some((re) => re.test(ua))) {
    return new Response("Access restricted.", {
      status: 403,
      headers: { "content-type": "text/plain" }
    });
  }

  return context.next();
};

// Verifies an IP belongs to the given hostname pattern by reverse-DNS then forward-confirming,
// per Google's documented Googlebot-verification method (same approach works for Bingbot).
// Returns true (verified), false (confirmed mismatch), or null (lookup error/unknown - fail open).
async function isVerifiedIP(ip, hostnamePattern) {
  if (!ip) return null;
  const cacheKey = ip + '|' + hostnamePattern.source;
  const cached = verifiedIpCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.result;

  try {
    const rdnsRes = await fetch(`https://dns.google/resolve?name=${reverseIpToPtr(ip)}&type=PTR`);
    const rdnsData = await rdnsRes.json();
    const hostnames = (rdnsData.Answer || []).map((a) => a.data.replace(/\.$/, ""));
    const matchedHostnames = hostnames.filter((h) => hostnamePattern.test(h));
    if (matchedHostnames.length === 0) {
      const result = hostnames.length === 0 ? null : false;
      verifiedIpCache.set(cacheKey, { result, at: Date.now() });
      return result;
    }

    for (const host of matchedHostnames) {
      const isV6 = ip.includes(':');
      const fwdRes = await fetch(`https://dns.google/resolve?name=${host}&type=${isV6 ? 'AAAA' : 'A'}`);
      const fwdData = await fwdRes.json();
      const ips = (fwdData.Answer || []).map((a) => a.data);
      if (ips.includes(ip)) {
        verifiedIpCache.set(cacheKey, { result: true, at: Date.now() });
        return true;
      }
    }
    verifiedIpCache.set(cacheKey, { result: false, at: Date.now() });
    return false;
  } catch {
    return null; // lookup failed - fail open rather than block a real crawler
  }
}

function reverseIpToPtr(ip) {
  if (ip.includes(':')) {
    const groups = expandIPv6(ip);
    const nibbles = groups.join('').split('').reverse().join('.');
    return nibbles + '.ip6.arpa';
  }
  return ip.split(".").reverse().join(".") + ".in-addr.arpa";
}

function expandIPv6(ip) {
  const [head, tail] = ip.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = 8 - headParts.length - tailParts.length;
  const fullParts = ip.includes('::')
    ? [...headParts, ...Array(missing).fill('0'), ...tailParts]
    : ip.split(':');
  return fullParts.map((g) => g.padStart(4, '0'));
}
