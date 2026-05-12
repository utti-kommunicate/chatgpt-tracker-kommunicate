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

function renderQuestions(questions) {
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
      const sourceItems = item.sources.length ? item.sources : [{ title: "No source returned", url: "", publisher: "" }];

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

async function loadQuestions() {
  const response = await fetch("/api/questions");
  const data = await response.json();
  renderQuestions(data.questions);
  setStatus(`Ready using ${data.model}`);
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  results.replaceChildren();
  setStatus("Asking OpenAI and collecting sources...");

  try {
    const response = await fetch("/api/run", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    renderResults(data.results);
    setStatus(`Done. Rendered ${data.results.length} answers.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    runButton.disabled = false;
  }
});

loadQuestions().catch((error) => {
  setStatus(error.message, true);
});
