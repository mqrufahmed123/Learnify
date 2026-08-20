// Single choke point for all Gemini API calls. Every AI feature (chat, flashcards,
// quiz generation) goes through generateContent() here - makes it a one-file change
// if you ever swap Gemini for OpenAI or another provider.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContent(promptOrParts) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  let parts = [];
  if (typeof promptOrParts === 'string') {
    parts = [{ text: promptOrParts }];
  } else if (Array.isArray(promptOrParts)) {
    parts = promptOrParts;
  } else {
    parts = [promptOrParts];
  }

  const fallbackModels = [
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest'
  ];

  // Unique list preserving order
  const modelsToTry = [...new Set(fallbackModels.filter(Boolean))];

  let lastError = null;
  let isRateLimited = false;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`${url}?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
          throw new Error('AI returned an empty response');
        }

        const errText = await response.text();
        console.error(`Gemini API error (${model}, attempt ${attempt}):`, response.status, errText);

        if (response.status === 429) {
          isRateLimited = true;
        }

        if ((response.status === 503 || response.status === 429) && attempt < 3) {
          await delay(attempt * 2000);
          continue;
        }

        lastError = new Error(`Gemini API error (${response.status}): ${errText}`);
        break; // try next model
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          await delay(attempt * 1500);
        }
      }
    }
  }

  if (isRateLimited) {
    throw new Error('Google Gemini API rate limit / free quota exceeded. Please wait a few seconds and try again.');
  }

  throw new Error('AI service is currently experiencing high demand. Please wait a moment and try again.');
}

// Some prompts ask Gemini for raw JSON, but it sometimes wraps output in ```json fences
// anyway. This strips those fences before JSON.parse() so callers don't have to.
function extractJson(rawText) {
  const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

module.exports = { generateContent, extractJson };
