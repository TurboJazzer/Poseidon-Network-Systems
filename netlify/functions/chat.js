// Netlify Function: /api/chat (mapped via netlify.toml redirect from /.netlify/functions/chat)
// Calls the Claude API server-side, grounded on knowledge-base.json.
// Requires an ANTHROPIC_API_KEY environment variable set in Netlify (Site settings > Environment variables).

const fs = require('fs');
const path = require('path');

let knowledgeBase = null;
function getKnowledgeBase() {
  if (knowledgeBase) return knowledgeBase;
  const kbPath = path.join(__dirname, '..', '..', 'knowledge-base.json');
  knowledgeBase = fs.readFileSync(kbPath, 'utf8');
  return knowledgeBase;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "The assistant isn't configured yet. Please WhatsApp us at 064 702 9962 or call 021 300 8278." })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { message, history } = payload;
  if (!message || typeof message !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };
  }

  const kb = getKnowledgeBase();

  const systemPrompt = `You are the on-site assistant for Poseidon Network Systems, an IT support and Dell hardware provider in Sea Point, Cape Town. Answer visitor questions using ONLY the facts in this knowledge base JSON. Be direct and concise, no marketing fluff. Always cite real prices/specs/stock status from the data, never invent numbers. When a visitor shows buying intent, ask qualifying questions, then encourage them to WhatsApp (+27 64 702 9962) or use the quote form on the homepage.

KNOWLEDGE BASE:
${kb}`;

  // Keep the conversation short and bounded.
  const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];
  const messages = trimmedHistory
    .filter((m) => m && m.role && m.text)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));
  messages.push({ role: 'user', content: message });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: systemPrompt,
        messages
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', errText);
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: "I'm having trouble right now. Please WhatsApp us at 064 702 9962 or call 021 300 8278." })
      };
    }

    const data = await res.json();
    const reply = (data.content && data.content[0] && data.content[0].text) || "Sorry, I couldn't process that.";

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('Chat function error:', err);
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: "I'm having trouble connecting right now. Please WhatsApp us at 064 702 9962 or call 021 300 8278." })
    };
  }
};
