/**
 * Secure Educational Anatomy Assistant Backend
 * 3D Human Anatomy Explorer
 */

const http = require('http');

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const PRIMARY_MODEL = process.env.PRIMARY_MODEL || 'openai/gpt-oss-120b';
const FALLBACK_MODEL = process.env.FALLBACK_MODEL || 'openai/gpt-oss-20b';

const EDUCATIONAL_SYSTEM_PROMPT = `You are the Educational Anatomy Assistant for the 3D Human Anatomy Explorer.
Your purpose is EXCLUSIVELY educational:
1. Explain human organs, body systems, anatomical structures, and physiological processes clearly and concisely.
2. Simplify complex anatomical and biological terminology for learners and students.
3. Keep answers compact and mobile-friendly: direct 1-2 sentence core answer first, followed by 2-4 clean bullet points with key facts.
4. Mention the specific organ or system by name so learners can explore it in the 3D atlas.
5. STRICT SAFETY DISCLAIMER: You are an educational reference only. You do NOT diagnose illnesses, prescribe medications, or give medical treatment advice. If a user asks for medical diagnosis, remind them politely to consult a licensed medical professional for personal healthcare needs.`;

// In-memory sliding-window rate limiter: max 30 requests per minute per IP
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = rateLimits.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimits.set(ip, validTimestamps);
    return true;
  }
  validTimestamps.push(now);
  rateLimits.set(ip, validTimestamps);
  return false;
}

// Clean up stale rate-limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimits.entries()) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      rateLimits.delete(ip);
    } else {
      rateLimits.set(ip, valid);
    }
  }
}, 5 * 60 * 1000);

function sendJson(res, statusCode, data) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function callGroqWithModel(model, messages, timeoutMs = 15000) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: EDUCATIONAL_SYSTEM_PROMPT }, ...messages],
        temperature: 0.25,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Upstream Groq error (${resp.status}): ${errText.slice(0, 200)}`);
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty upstream completion');
    }
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const clientIp = req.socket.remoteAddress || 'unknown';

  // Health Check
  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: '3d-human-anatomy-explorer-backend',
      keyConfigured: Boolean(GROQ_API_KEY),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Educational Chatbot Endpoint
  if (req.method === 'POST' && url.pathname === '/api/chat') {
    if (isRateLimited(clientIp)) {
      sendJson(res, 429, {
        error: 'Too many requests. Please wait a moment before asking another question.',
      });
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // 64 KB limit
      if (body.length > 65536) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const question = typeof parsed.question === 'string' ? parsed.question.trim() : '';

        if (!question) {
          sendJson(res, 400, { error: 'Question is required and must be non-empty.' });
          return;
        }

        if (question.length > 1000) {
          sendJson(res, 400, { error: 'Question exceeds maximum length of 1000 characters.' });
          return;
        }

        // Validate conversation history (prevent duplicate messages and oversized context)
        const validHistory = [];
        if (Array.isArray(parsed.history)) {
          for (const item of parsed.history.slice(-8)) {
            if (
              item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string' &&
              item.content.trim().length > 0
            ) {
              validHistory.push({
                role: item.role,
                content: item.content.slice(0, 1000),
              });
            }
          }
        }

        // Build messages without duplicating the latest question
        const lastItem = validHistory[validHistory.length - 1];
        const messages = [...validHistory];
        if (!lastItem || lastItem.role !== 'user' || lastItem.content !== question) {
          messages.push({ role: 'user', content: question });
        }

        let reply = '';
        try {
          reply = await callGroqWithModel(PRIMARY_MODEL, messages);
        } catch (primErr) {
          console.warn('Primary model error, attempting fallback:', primErr.message);
          try {
            reply = await callGroqWithModel(FALLBACK_MODEL, messages);
          } catch (fallbackErr) {
            console.error('All upstream AI calls failed:', fallbackErr.message);
            sendJson(res, 502, {
              error: 'AI service is temporarily unavailable. Please try again shortly.',
            });
            return;
          }
        }

        sendJson(res, 200, {
          text: reply,
          model: PRIMARY_MODEL,
        });
      } catch (err) {
        console.error('Request handling error:', err.message);
        sendJson(res, 400, { error: 'Invalid JSON request payload.' });
      }
    });
    return;
  }

  // Not Found
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, HOST, () => {
  console.log(`[Anatomy AI Backend] Listening on http://${HOST}:${PORT}`);
  console.log(`[Anatomy AI Backend] Groq API Key configured: ${Boolean(GROQ_API_KEY)}`);
});
