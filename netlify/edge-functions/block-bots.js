(function(){
  // Basic bad-bot / scraper blocking based on User-Agent signature matching.
  // Note: this runs client-side, so it only deters simple scrapers that execute JS
  // and honor it — it is not a substitute for server/edge-level bot blocking.
  var BLOCKED_PATTERNS = [
    /ahrefsbot/i, /semrushbot/i, /mj12bot/i, /dotbot/i, /petalbot/i,
    /bytespider/i, /gptbot/i, /ccbot/i, /python-requests/i, /scrapy/i,
    /curl\//i, /wget\//i, /headlesschrome/i, /phantomjs/i
  ];

  var ua = navigator.userAgent || '';
  var isBlocked = BLOCKED_PATTERNS.some(function(re){ return re.test(ua); });

  if (isBlocked) {
    document.documentElement.innerHTML =
      '<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#0D1B4B;background:#F6F8FD;"><p>Access restricted.</p></body>';
  }
})();
