import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.AI_PORT || 8787);

app.use(express.json({ limit: '1mb' }));

function buildPrompt({ expression, viewMode, variables }) {
  return [
    'You are a concise math tutor for students.',
    'Explain the selected graph expression clearly and accurately.',
    'Return JSON only with this exact shape:',
    '{"title":"string","body":"string","properties":[{"name":"string","value":"string"}],"steps":["string"],"commonMistakes":["string"],"example":"string"}',
    'Rules:',
    '- Keep body under 120 words.',
    '- Keep steps to at most 4 items.',
    '- Keep commonMistakes to at most 3 items.',
    '- Use simple student-friendly language.',
    '',
    `Expression: ${expression}`,
    `View mode: ${viewMode}`,
    `Variables: a=${variables?.a ?? 1}, b=${variables?.b ?? 1}, c=${variables?.c ?? 0}`,
  ].join('\n');
}

function tryParseJsonObject(text) {
  if (typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function parseModelResponse(payload) {
  const candidates = [];

  if (typeof payload?.content === 'string') {
    candidates.push(payload.content);
  }

  if (Array.isArray(payload?.content)) {
    for (const block of payload.content) {
      if (typeof block?.text === 'string') {
        candidates.push(block.text);
      }
      if (typeof block?.content === 'string') {
        candidates.push(block.content);
      }
    }
  }

  if (Array.isArray(payload?.choices)) {
    for (const choice of payload.choices) {
      if (typeof choice?.message?.content === 'string') {
        candidates.push(choice.message.content);
      }
      if (Array.isArray(choice?.message?.content)) {
        for (const part of choice.message.content) {
          if (typeof part?.text === 'string') {
            candidates.push(part.text);
          }
        }
      }
    }
  }

  for (const text of candidates) {
    const parsed = tryParseJsonObject(text);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  }

  if (candidates.length > 0) {
    const plain = String(candidates[0]).trim();
    return {
      title: 'AI Explanation',
      body: plain.length > 800 ? `${plain.slice(0, 800)}...` : plain,
      properties: [],
      steps: [],
      commonMistakes: [],
      example: '',
    };
  }

  return null;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/explain', async (req, res) => {
  const apiKey = process.env.LONGCAT_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing LONGCAT_API_KEY in environment.' });
    return;
  }

  const expression = String(req.body?.expression || '').trim();
  const viewMode = String(req.body?.viewMode || '2D');
  const variables = req.body?.variables || { a: 1, b: 1, c: 0 };

  if (!expression) {
    res.status(400).json({ error: 'Expression is required.' });
    return;
  }

  try {
    const response = await fetch(`${process.env.LONGCAT_BASE_URL || 'https://api.longcat.chat/anthropic'}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.LONGCAT_MODEL || 'LongCat-Flash-Thinking',
        max_tokens: Number(process.env.AI_MAX_TOKENS || 1000),
        messages: [
          {
            role: 'user',
            content: buildPrompt({ expression, viewMode, variables }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(502).json({ error: 'AI provider request failed.', details: errorText });
      return;
    }

    const data = await response.json();
    const parsed = parseModelResponse(data);

    if (!parsed || typeof parsed !== 'object') {
      res.status(502).json({
        error: 'Failed to parse AI response.',
        rawShape: Object.keys(data || {}),
      });
      return;
    }

    res.json({
      title: String(parsed.title || 'AI Explanation'),
      body: String(parsed.body || 'No explanation returned.'),
      properties: Array.isArray(parsed.properties) ? parsed.properties : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
      example: String(parsed.example || ''),
    });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected server error.', details: String(error) });
  }
});

app.listen(port, () => {
  console.log(`AI API server running on http://localhost:${port}`);
});
