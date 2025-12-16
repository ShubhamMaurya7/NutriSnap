"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Camera, Zap, Shield, AlertTriangle, Video, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FoodAnalysis {
  name: string
  healthScore: number
  category: string
  calories: number
  nutrients: {
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
  pros: string[]
  cons: string[]
  ingredients: string[]
  additives: string[]
}

export default function FoodScannerPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const setVideoRef = (element: HTMLVideoElement | null) => {
    if (element) {
      setVideoReady(true)
      console.log('Video element is now ready')
    } else {
      setVideoReady(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setAnalysis(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      setIsCameraLoading(true)
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }

      // Simple video constraints that work on most devices
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'environment' // Use back camera on mobile
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Set the stream and show camera view
      setCameraStream(stream)
      setShowCamera(true)
      
      // Set up video immediately since video element is always available
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Try to play the video
        videoRef.current.play().then(() => {
          setIsCameraLoading(false)
        }).catch(err => {
          console.error('Error playing video:', err)
          setIsCameraLoading(false)
        })
      } else {
        console.error('Video element not found - this should not happen')
        setIsCameraLoading(false)
      }
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsCameraLoading(false)
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Camera access denied. Please allow camera permissions and try again.')
        } else if (error.name === 'NotFoundError') {
          alert('No camera found on this device.')
        } else if (error.name === 'NotReadableError') {
          alert('Camera is already in use by another application.')
        } else if (error.name === 'OverconstrainedError') {
          alert('Camera constraints not supported. Trying with basic settings...')
          // Try with basic constraints
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ video: true })
            setCameraStream(basicStream)
            setShowCamera(true)
            setIsCameraLoading(false)
          } catch (basicError) {
            console.error('Basic camera access also failed:', basicError)
            alert('Camera access failed with basic settings.')
          }
        } else {
          alert(`Camera error: ${error.message}`)
        }
      } else {
        alert('Unable to access camera. Please check permissions and try again.')
      }
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    // Find the visible video element in the camera view
    let visibleVideo = document.querySelector('video:not(.hidden)') as HTMLVideoElement
    
    // If not found, try finding by position in the camera view
    if (!visibleVideo) {
      const cameraView = document.querySelector('[data-camera-view]')
      if (cameraView) {
        visibleVideo = cameraView.querySelector('video') as HTMLVideoElement
      }
    }
    
    // If still not found, try the videoRef
    if (!visibleVideo && videoRef.current) {
      visibleVideo = videoRef.current
    }
    
    if (visibleVideo && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        // Set canvas dimensions to match video
        canvasRef.current.width = visibleVideo.videoWidth || 640
        canvasRef.current.height = visibleVideo.videoHeight || 480
        
        // Draw the video frame to canvas
        context.drawImage(visibleVideo, 0, 0)
        
        // Convert canvas to image data URL
        const imageDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8)
        
        // Set the captured image and close camera
        setSelectedImage(imageDataUrl)
        setAnalysis(null)
        stopCamera()
      } else {
        console.error('Failed to get canvas context')
        alert('Failed to capture photo. Please try again.')
      }
    } else {
      console.error('Visible video element or canvas not found')
      alert('Camera not ready. Please wait a moment and try again.')
    }
  }

  const analyzeFood = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: selectedImage }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed: ${response.status} - ${errorText}`)
      }

      const analysisResult = await response.json()
      
      // Check if the result has the expected structure
      if (analysisResult.error) {
        throw new Error(`API returned error: ${analysisResult.error}`)
      }
      
      setAnalysis(analysisResult)
    } catch (error) {
      console.error("Error analyzing food:", error)
      
      // More specific error handling
      let errorMessage = "Unable to analyze this image. Please try with a clearer photo."
      
      if (error instanceof Error) {
        if (error.message.includes('API request failed')) {
          errorMessage = "API request failed. Please check your internet connection and try again."
        } else if (error.message.includes('API returned error')) {
          errorMessage = "Analysis service error. Please try again later."
        } else if (error.message.includes('Failed to analyze food')) {
          errorMessage = "Analysis failed. Please try with a different photo."
        } else if (error.message.includes('Invalid JSON response')) {
          errorMessage = "Invalid response from analysis service. Please try again."
        }
      }
      
      // Fallback to show error message
      setAnalysis({
        name: "Analysis Failed",
        healthScore: 0,
        category: "Error",
        calories: 0,
        nutrients: { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
        pros: [],
        cons: [errorMessage],
        ingredients: [],
        additives: [],
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 6) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <Shield className="w-5 h-5" />
    if (score >= 6) return <Zap className="w-5 h-5" />
    return <AlertTriangle className="w-5 h-5" />
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Cleanup camera when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Food Scanner</h1>
          <p className="text-gray-600">Upload a photo to analyze your food's nutritional value</p>
        </div>

        {/* Hidden video element - always rendered for camera access */}
        <video
          ref={(element) => {
            if (element) {
              (videoRef as any).current = element
              setVideoReady(true)
            } else {
              setVideoReady(false)
            }
          }}
          autoPlay
          playsInline
          muted
          className="hidden"
        />

        {/* Hidden canvas for photo capture - always rendered */}
        <canvas 
          ref={(element) => {
            if (element) {
              (canvasRef as any).current = element
            }
          }}
          className="hidden" 
        />

        {/* Upload Section */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={selectedImage || "/placeholder.svg"}
                    alt="Selected food"
                    className="max-w-sm mx-auto rounded-lg shadow-md"
                  />
                  <div className="flex gap-3 justify-center">
                    <Button onClick={analyzeFood} disabled={isAnalyzing} className="bg-green-600 hover:bg-green-700">
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Analyze Food
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedImage(null)}>
                      Choose Different Photo
                    </Button>
                  </div>
                </div>
              ) : showCamera ? (
                <div className="space-y-4" data-camera-view>
                  <div className="relative">
                    {isCameraLoading ? (
                      <div className="w-full max-w-md mx-auto h-80 bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600">Starting camera...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-md mx-auto">
                        <video
                          ref={(element) => {
                            if (element) {
                              // Copy the stream from the hidden video element
                              if (videoRef.current && videoRef.current.srcObject) {
                                element.srcObject = videoRef.current.srcObject
                                element.play().catch(err => console.error('Error playing camera view video:', err))
                              }
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full rounded-lg border-2 border-gray-300 bg-gray-100"
                          style={{ minHeight: '300px' }}
                        />
                        <div className="mt-2 text-center text-sm text-gray-500">
                          Camera stream should appear above
                        </div>
                        {cameraStream && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            Stream active: {cameraStream.getTracks().length} track(s)
                          </div>
                        )}
                      </div>
                    )}
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Position your food in the frame</p>
                    <Button onClick={capturePhoto} disabled={isCameraLoading} className="bg-green-600 hover:bg-green-700 disabled:opacity-50">
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Upload className="w-16 h-16 mx-auto text-gray-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Add Food Photo</h3>
                      <p className="text-gray-500">Take a clear photo or upload an existing image</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={startCamera} 
                      disabled={isCameraLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isCameraLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Starting Camera...
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Take Photo
                        </>
                      )}
                    </Button>
                    <Button onClick={triggerFileInput} className="bg-green-600 hover:bg-green-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Health Score */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-3">
                  <div
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-full border",
                      getScoreColor(analysis.healthScore),
                    )}
                  >
                    {getScoreIcon(analysis.healthScore)}
                    <span className="text-2xl font-bold">{analysis.healthScore}/10</span>
                  </div>
                </div>
                <CardTitle className="text-2xl">{analysis.name}</CardTitle>
                <CardDescription>
                  <Badge variant="secondary">{analysis.category}</Badge>
                  <span className="ml-2">{analysis.calories} calories per serving</span>
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Nutritional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Nutritional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysis.nutrients.protein}g</div>
                    <div className="text-sm text-gray-600">Protein</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analysis.nutrients.carbs}g</div>
                    <div className="text-sm text-gray-600">Carbs</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{analysis.nutrients.fat}g</div>
                    <div className="text-sm text-gray-600">Fat</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analysis.nutrients.fiber}g</div>
                    <div className="text-sm text-gray-600">Fiber</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analysis.nutrients.sugar}g</div>
                    <div className="text-sm text-gray-600">Sugar</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{analysis.nutrients.sodium}mg</div>
                    <div className="text-sm text-gray-600">Sodium</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pros and Cons */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Pros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.pros.map((pro, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Cons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.cons.map((con, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                        <span className="text-sm">{con}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle>Ingredients & Additives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Main Ingredients:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="outline">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Additives:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.additives.map((additive, index) => (
                      <Badge key={index} variant="secondary">
                        {additive}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
