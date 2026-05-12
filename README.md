# Customer Support AI Answers

This is a small local web app that sends six customer-support automation questions to the OpenAI Responses API and displays:

1. The answer
2. The sources used for the answer

## Run

In PowerShell:

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
npm start
```

Then open:

```text
http://localhost:3000
```

The app uses `gpt-5.2` by default. To change it:

```powershell
$env:OPENAI_MODEL="gpt-5"
```

## Files

- `server.mjs` serves the page and calls the OpenAI API.
- `public/index.html` contains the page structure.
- `public/app.js` calls the local backend and renders results.
- `public/styles.css` styles the dashboard.
