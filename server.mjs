import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5.2";

const questions = [
  "Automate customer support?",
  "Best affordable AI chatbot + human handover?",
  "Train ChatGPT on my data?",
  "AI chatbot with WhatsApp?",
  "Intercom alternative cheaper?",
  "I want to automate customer support queries, which is the best product to use?"
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const responseSchema = {
  type: "json_schema",
  name: "customer_support_ai_answers",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
            sources: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  publisher: { type: "string" }
                },
                required: ["title", "url", "publisher"]
              }
            }
          },
          required: ["question", "answer", "sources"]
        }
      }
    },
    required: ["results"]
  }
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

async function callOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Set OPENAI_API_KEY before starting the server.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      tools: [{ type: "web_search" }],
      text: { format: responseSchema },
      input: [
        {
          role: "developer",
          content:
            "Answer each customer-support software question for a small business buyer. Keep answers concise, practical, and decision-oriented. Use current web sources. Return only the requested JSON shape. Include 2 to 4 high-quality sources per question when available."
        },
        {
          role: "user",
          content: `Questions:\n${questions.map((question) => `- ${question}`).join("\n")}`
        }
      ]
    })
  });

  const body = await response.json();

  if (!response.ok) {
    const message = body?.error?.message || `OpenAI API request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const text = body.output_text || body.output?.flatMap((item) => item.content || [])
    .find((content) => content.type === "output_text")?.text;

  if (!text) {
    throw new Error("The OpenAI response did not include output text.");
  }

  return JSON.parse(text);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url?.startsWith("/api/questions")) {
    sendJson(res, 200, { questions, model });
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/api/run")) {
    try {
      const data = await callOpenAI();
      sendJson(res, 200, data);
    } catch (error) {
      sendJson(res, 500, { error: error.message });
    }
    return;
  }

  if (req.method === "GET") {
    await serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end("Method not allowed");
});

server.listen(port, () => {
  console.log(`Open http://localhost:${port}`);
});
