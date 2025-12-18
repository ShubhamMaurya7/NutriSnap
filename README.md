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

**Screenshot**
<img width="1222" height="604" alt="image" src="https://github.com/user-attachments/assets/44b60c14-16cd-443d-8fc4-4d988ffec9c5" />
