const questions = [
  "Automate customer support?",
  "Best affordable AI chatbot + human handover?",
  "Train ChatGPT on my data?",
  "AI chatbot with WhatsApp?",
  "Intercom alternative cheaper?",
  "I want to automate customer support queries, which is the best product to use?"
];

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

const settingsForm = document.querySelector("#settings-form");
const apiKeyInput = document.querySelector("#api-key");
const modelInput = document.querySelector("#model");
const questionList = document.querySelector("#question-list");
const runButton = document.querySelector("#run-button");
const results = document.querySelector("#results");
const statusRow = document.querySelector(".status-row");
const statusText = document.querySelector("#status-text");
const template = document.querySelector("#result-template");

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusRow.classList.toggle("error", isError);
}

function renderQuestions() {
  questionList.replaceChildren(
    ...questions.map((question) => {
      const item = document.createElement("li");
      item.textContent = question;
      return item;
    })
  );
}

function renderResults(items) {
  results.replaceChildren(
    ...items.map((item) => {
      const node = template.content.cloneNode(true);
      node.querySelector(".question").textContent = item.question;
      node.querySelector(".answer").textContent = item.answer;

      const sources = node.querySelector(".sources");
      const sourceItems = item.sources.length
        ? item.sources
        : [{ title: "No source returned", url: "", publisher: "" }];

      sources.replaceChildren(
        ...sourceItems.map((source) => {
          const li = document.createElement("li");

          if (source.url) {
            const link = document.createElement("a");
            link.href = source.url;
            link.target = "_blank";
            link.rel = "noreferrer";
            link.textContent = source.title || source.url;
            li.append(link);
          } else {
            li.textContent = source.title;
          }

          if (source.publisher) {
            const publisher = document.createElement("span");
            publisher.className = "publisher";
            publisher.textContent = source.publisher;
            li.append(publisher);
          }

          return li;
        })
      );

      return node;
    })
  );
}

function getOutputText(body) {
  if (typeof body.output_text === "string") {
    return body.output_text;
  }

  for (const item of body.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

async function askOpenAI({ apiKey, model }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    throw new Error(body?.error?.message || `OpenAI request failed with status ${response.status}.`);
  }

  const outputText = getOutputText(body);

  if (!outputText) {
    throw new Error("The OpenAI response did not include output text.");
  }

  return JSON.parse(outputText);
}

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const apiKey = apiKeyInput.value.trim();
  const model = modelInput.value.trim();

  if (!apiKey || !model) {
    setStatus("Enter an API key and model before running.", true);
    return;
  }

  runButton.disabled = true;
  results.replaceChildren();
  setStatus("Asking OpenAI and collecting sources...");

  try {
    const data = await askOpenAI({ apiKey, model });
    renderResults(data.results);
    setStatus(`Done. Rendered ${data.results.length} answers.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    runButton.disabled = false;
  }
});

renderQuestions();
setStatus(`Ready using ${modelInput.value.trim()}`);
