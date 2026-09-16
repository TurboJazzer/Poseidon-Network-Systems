export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";

  const strictAllowedPatterns = [/googlebot/i, /googlebot-image/i, /googlebot-video/i];
  const aiAgentAllowedPatterns = [/google-extended/i, /googleother/i, /google-cloudvertexbot/i];

  if (strictAllowedPatterns.some((re) => re.test(ua))) {
    const ip = context.ip || request.headers.get("x-nf-client-connection-ip") || "";
    if (await isVerifiedGoogleIP(ip)) {
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

  const blockedPatterns = [
    /ahrefsbot/i, /semrushbot/i, /mj12bot/i, /dotbot/i, /petalbot/i,
    /bytespider/i, /gptbot/i, /chatgpt-user/i, /claudebot/i, /claude-web/i,
    /anthropic-ai/i, /cohere-ai/i, /perplexitybot/i, /ccbot/i, /python-requests/i, /scrapy/i,
    /^curl\//i, /^wget\//i, /headlesschrome/i, /phantomjs/i
  ];

  if (blockedPatterns.some((re) => re.test(ua))) {
    return new Response("Access restricted.", {
      status: 403,
      headers: { "content-type": "text/plain" }
    });
  }

  return context.next();
};

export const config = { path: "/*" };

// Verifies an IP belongs to Google by reverse-DNS then forward-confirming the hostname,
// per Google's documented Googlebot-verification method.
async function isVerifiedGoogleIP(ip) {
  if (!ip) return false;
  try {
    const rdnsRes = await fetch(`https://dns.google/resolve?name=${reverseIpToPtr(ip)}&type=PTR`);
    const rdnsData = await rdnsRes.json();
    const hostnames = (rdnsData.Answer || []).map((a) => a.data.replace(/\.$/, ""));
    const googleHostnames = hostnames.filter((h) => /\.googlebot\.com$|\.google\.com$/i.test(h));
    if (googleHostnames.length === 0) return false;

    for (const host of googleHostnames) {
      const fwdRes = await fetch(`https://dns.google/resolve?name=${host}&type=A`);
      const fwdData = await fwdRes.json();
      const ips = (fwdData.Answer || []).map((a) => a.data);
      if (ips.includes(ip)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function reverseIpToPtr(ip) {
  return ip.split(".").reverse().join(".") + ".in-addr.arpa";
}
