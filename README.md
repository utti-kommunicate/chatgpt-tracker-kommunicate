# Customer Support AI Answers

This is a static HTML app that asks OpenAI the customer-support automation questions and displays:

1. The answer
2. The sources used for the answer

Open the page, paste an OpenAI API key, and click **Get answers**.

## GitHub Pages

The root `index.html` is ready for GitHub Pages from the `main` branch.

In GitHub:

1. Open the repository settings.
2. Go to **Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Select branch `main` and folder `/ (root)`.

## Local Use

Open `index.html` directly in a browser, or run the optional local server:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

## Security Note

The page uses the API key only in the browser session and does not save it. Since browser-side API keys can be seen by whoever uses the page, use a restricted or temporary key when sharing the page.

## Files

- `index.html` is the GitHub Pages entry point.
- `public/index.html` is the local server entry point.
- `public/app.js` calls the OpenAI Responses API and renders results.
- `public/styles.css` styles the page.
- `server.mjs` is an optional local static server.
