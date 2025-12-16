# NutriSnap

NutriSnap is a Next.js application that analyzes food images (packages or items) using Google Generative AI (Gemini) to provide a structured nutritional analysis. It accepts base64-encoded images and returns a JSON analysis including estimated calories, nutrients, ingredients, additives, a health score, and other metadata.

**Tech stack**
- **Framework**: `Next.js` (app router)
- **Language**: `TypeScript`
- **Styling**: Tailwind CSS
- **AI**: `@google/generative-ai` (Gemini)

**Project layout**
- `app/` : Next.js app routes + pages
- `app/api/analyze-food/route.ts` : Primary API route that sends images to Gemini and returns parsed JSON
- `components/` : UI components and primitives
- `public/` : Static assets

**Features**
- Upload or send an image of food/packaging and receive a JSON nutritional analysis.
- Uses Gemini generative models to analyze image content and infer nutrition-related data.
- Includes a simple API health GET endpoint to check if the Gemini API key is configured.

**Prerequisites**
- Node.js (v18+ recommended)
- `pnpm` (recommended because the repo includes `pnpm-lock.yaml`) — `npm` or `yarn` will also work.

**Environment variables**
- `GEMINI_API_KEY` : Required. Your Google Generative AI / Gemini API key. The API route reads this variable to initialize the client.

Add environment variables locally (example):

```
# Windows PowerShell
$env:GEMINI_API_KEY = "your_api_key_here"

# or add to a `.env.local` file at the project root:
GEMINI_API_KEY=your_api_key_here
```

**Install & Run (local development)**

Install dependencies:

```
pnpm install
```

Start development server:

```
pnpm dev
```

Open `http://localhost:3000` in your browser.

**Build & Start (production)**

```
pnpm build
pnpm start
```

**API: Analyze Food**

- Endpoint: `POST /api/analyze-food`
- Request body (JSON):

```
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
}
```

- Response: JSON object with fields such as `name`, `healthScore`, `category`, `calories`, `nutrients`, `pros`, `cons`, `ingredients`, `additives`.

- Health-check GET endpoint: `GET /api/analyze-food` returns a JSON object with `apiKeyConfigured` and a short preview of the configured API key.

Example curl (health check):

```
curl http://localhost:3000/api/analyze-food
```

Example curl (POST with a file converted to base64 in a small script):

```
curl -X POST http://localhost:3000/api/analyze-food \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,<BASE64_STRING>"}'
```

**Troubleshooting & Notes**
- If you see a 500 error about the API key, confirm `GEMINI_API_KEY` is set and valid.
- The AI response may sometimes include formatting or code fences; the API route attempts to strip common Markdown fences and parse JSON. If parsing fails, a safe fallback JSON object is returned.
- The analysis is an estimate/inference from a generative model — validate important nutritional claims with official sources.

**Deployment**
- Vercel: This is a Next.js project and deploys smoothly to Vercel. Set `GEMINI_API_KEY` in the Vercel project environment settings.
- Docker: You can containerize the app by creating a `Dockerfile` that runs `pnpm build` and `pnpm start`. Remember to pass `GEMINI_API_KEY` to the container environment.

**Contributing**
- Feel free to open issues or PRs. Keep changes focused and add tests where appropriate.

**Acknowledgements**
- Built with Next.js and Google Generative AI (Gemini).

**License**
- No license specified in repository. Check project owner for licensing details before reusing code.
