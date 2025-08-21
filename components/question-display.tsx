"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle, ZoomIn, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExamQuestion } from "@/lib/types"

interface QuestionDisplayProps {
  question: ExamQuestion
  selectedAnswer?: string
  onAnswerChange: (answerId: string) => void
  isReviewMode?: boolean
  correctAnswer?: string
  struckThroughOptions?: string[] // Added strikethrough options
  onToggleStrikethrough?: (optionId: string) => void // Added strikethrough toggle handler
}

export function QuestionDisplay({
  question,
  selectedAnswer,
  onAnswerChange,
  isReviewMode = false,
  correctAnswer,
  struckThroughOptions = [], // Default empty array for strikethrough options
  onToggleStrikethrough,
}: QuestionDisplayProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const renderImage = (image: { path: string; alt: string } | { path: string; alt: string }[], isInfoImage: boolean = false) => {
    const images = Array.isArray(image) ? image : [image]

    return (
      <div className="space-y-4">
        {images.map((img, index) => {
          const imageSrc = img.path.startsWith("path")
            ? `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(img.alt)}`
            : img.path

          return (
            <div key={index} className="border rounded-lg p-4">
              <div className="relative group">
                <img
                  src={imageSrc}
                  alt={img.alt}
                  className={`rounded ${isInfoImage ? 'w-full h-auto' : 'w-64 h-auto cursor-pointer transition-transform hover:scale-105'}`}
                  onClick={isInfoImage ? undefined : () => setZoomedImage(imageSrc)}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.src = `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(img.alt)}`
                  }}
                />
                {/* Zoom icon overlay - only for non-info images */}
                {!isInfoImage && (
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{img.alt}</p>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMCQOptions = () => {
    if (!question.options) return null

    return (
      <RadioGroup value={selectedAnswer || ""} onValueChange={onAnswerChange}>
        {" "}
        {/* Ensure empty string when no selection */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.id
            const isCorrect = correctAnswer === option.id
            const isIncorrect = isReviewMode && isSelected && !isCorrect
            const isStruckThrough = struckThroughOptions.includes(option.id)

            return (
              <div
                key={option.id}
                className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg transition-colors",
                  isReviewMode && isCorrect && "bg-green-50 border border-green-200",
                  isReviewMode && isIncorrect && "bg-red-50 border border-red-200",
                  !isReviewMode && "hover:bg-muted/50",
                )}
              >
                <RadioGroupItem value={option.id} id={option.id} className="mt-1 hover:cursor-pointer" disabled={isReviewMode} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium mr-2">{option.id}.</span>
                      <span
                        className={cn(
                          "cursor-pointer transition-colors",
                          isStruckThrough && "text-gray-400 line-through",
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          if (!isReviewMode && onToggleStrikethrough) {
                            onToggleStrikethrough(option.id)
                          }
                        }}
                      >
                        {option.text}
                      </span>
                    </div>
                    {isReviewMode && isCorrect && <CheckCircle className="h-5 w-5 text-green-600 ml-2" />}
                    {isReviewMode && isIncorrect && <XCircle className="h-5 w-5 text-red-600 ml-2" />}
                  </div>
                </Label>
              </div>
            )
          })}
        </div>
      </RadioGroup>
    )
  }

  const renderMatrixOptions = () => {
    if (!question.matrix) return null

    return (
      <div className="space-y-4">
        <RadioGroup value={selectedAnswer || ""} onValueChange={onAnswerChange}>
          {" "}
          {/* Ensure empty string when no selection */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr>
                  <th className="border border-border p-3 text-left">Option</th>
                  {question.matrix.columns.map((column) => (
                    <th key={column} className="border border-border p-3 text-center">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.matrix.rows.map((row) => {
                  const isSelected = selectedAnswer === row.name
                  const isCorrect = correctAnswer === row.name
                  const isIncorrect = isReviewMode && isSelected && !isCorrect
                  const isStruckThrough = struckThroughOptions.includes(row.name)

                  return (
                    <tr
                      key={row.name}
                      className={cn(
                        isReviewMode && isCorrect && "bg-green-50",
                        isReviewMode && isIncorrect && "bg-red-50",
                      )}
                    >
                      <td className="border border-border p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={row.name} id={row.name} className="hover:cursor-pointer" disabled={isReviewMode} />
                            <Label htmlFor={row.name} className="font-medium cursor-pointer">
                              <span
                                className={cn(
                                  "cursor-pointer transition-colors",
                                  isStruckThrough && "text-gray-400 line-through",
                                )}
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (!isReviewMode && onToggleStrikethrough) {
                                    onToggleStrikethrough(row.name)
                                  }
                                }}
                              >
                                {row.name}
                              </span>
                            </Label>
                          </div>
                          {isReviewMode && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {isReviewMode && isIncorrect && <XCircle className="h-5 w-5 text-red-600" />}
                        </div>
                      </td>
                      {row.options.map((option, index) => (
                        <td
                          key={index}
                          className={cn(
                            "border border-border p-3 text-center text-lg font-bold",
                            isReviewMode && isCorrect && "text-green-800 dark:text-green-100",
                            isReviewMode && isIncorrect && "text-red-800 dark:text-red-100",
                            !isReviewMode && "text-foreground",
                            isReviewMode && !isCorrect && !isIncorrect && "text-foreground",
                          )}
                        >
                          {option.text}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </RadioGroup>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Question {question.number}
            {isReviewMode && (
              <Badge variant="outline" className="ml-2">
                Review Mode
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Section (if exists) */}
          {question.info && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Information</h3>
              <div className="prose prose-sm max-w-none text-blue-700 dark:text-blue-300">
                <p className="whitespace-pre-wrap">{question.info}</p>
              </div>
              {/* Info Images */}
              {question.infoImages && renderImage(question.infoImages, true)}
            </div>
          )}

          {/* Question Stem */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{question.stem}</p>
          </div>

          {/* Question Images */}
          {question.image && renderImage(question.image, false)}

          {/* Answer Options */}
          <div>
            {question.options && renderMCQOptions()}
            {question.matrix && renderMatrixOptions()}
          </div>

          {/* Categories */}
          {question.categories && (
            <div className="flex flex-wrap gap-2">
              {question.categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Zoom Dialog */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] p-1">
          <DialogTitle className="sr-only">Enlarged Image View</DialogTitle>
          <div className="relative">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 z-10 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition-colors hover:cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            {zoomedImage && (
              <img
                src={zoomedImage}
                alt="Zoomed image"
                className="w-full h-auto max-h-[90vh] object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
