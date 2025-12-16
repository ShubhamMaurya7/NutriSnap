import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  try {
    console.log('=== API ROUTE STARTED ===')
    
    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY
    console.log('API key available:', !!apiKey)
    console.log('API key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET')
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set')
      return NextResponse.json({ 
        error: "API key not configured. Please check your environment variables." 
      }, { status: 500 })
    }

    const { image } = await request.json()
    console.log('Image data received, length:', image ? image.length : 'NO IMAGE')

    if (!image) {
      console.error('No image data received')
      return NextResponse.json({ 
        error: "No image data provided" 
      }, { status: 400 })
    }

    // Remove data URL prefix to get base64 data
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")
    console.log('Base64 data length:', base64Data.length)

    console.log('Initializing Google Generative AI...')
    const genAI = new GoogleGenerativeAI(apiKey)
    
    console.log('Getting generative model...')
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `Analyze this food item/package and provide a detailed nutritional analysis in JSON format. Include:
    - name: product name
    - healthScore: score from 1-10 (10 being healthiest)
    - category: food category
    - calories: estimated calories per serving
    - nutrients: object with protein, carbs, fat, fiber, sugar, sodium (in grams/mg)
    - pros: array of health benefits
    - cons: array of health concerns
    - ingredients: array of main ingredients
    - additives: array of preservatives/additives
    
    Return only valid JSON without any markdown formatting.`

    console.log('Generating content with Gemini...')
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ])

    console.log('Gemini response received, getting text...')
    const response = await result.response
    const text = response.text()
    console.log('Gemini text response length:', text.length)
    console.log('Gemini response preview:', text.substring(0, 200))

    // Clean up the response to ensure it's valid JSON
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
    console.log('Cleaned text length:', cleanedText.length)

    try {
      console.log('Parsing JSON response...')
      const analysis = JSON.parse(cleanedText)
      console.log('JSON parsed successfully, returning analysis')
      return NextResponse.json(analysis)
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      console.error("Raw response that failed to parse:", cleanedText)
      // Return fallback analysis if parsing fails
      return NextResponse.json({
        name: "Food Item",
        healthScore: 5,
        category: "Unknown",
        calories: 0,
        nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
        pros: ["Unable to analyze - please try again"],
        cons: ["Analysis failed"],
        ingredients: ["Unknown"],
        additives: ["Unknown"],
      })
    }
  } catch (error) {
    console.error("=== API ROUTE ERROR ===")
    console.error("Error details:", error)
    console.error("Error message:", error instanceof Error ? error.message : 'Unknown error')
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json({ 
      error: "Failed to analyze food item",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET method to check API key status
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY
  return NextResponse.json({
    apiKeyConfigured: !!apiKey,
    apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
}
