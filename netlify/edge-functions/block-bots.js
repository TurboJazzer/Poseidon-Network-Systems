export default async (request, context) => {
  const ua = request.headers.get("user-agent") || "";
  const blockedPatterns = [
    /ahrefsbot/i, /semrushbot/i, /mj12bot/i, /dotbot/i, /petalbot/i,
    /bytespider/i, /gptbot/i, /ccbot/i, /python-requests/i, /scrapy/i,
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
