import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, TrendingUp } from "lucide-react"

export default function ResultsPage() {
  // In a real app, this would be called client-side
  const results = [] // getExamResults() - mock empty for now

  if (results.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Mijn gemaakte toetsen</h1>
          <p className="text-muted-foreground">Hier vind je al je voltooide examens en resultaten</p>
        </div>

        <Card className="p-12">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Nog geen gemaakte toetsen</h3>
              <p className="text-muted-foreground">
                Je hebt nog geen examens voltooid. Start je eerste examen om je resultaten hier te zien.
              </p>
            </div>
            <Button asChild>
              <a href="/exams">Naar Toetsen</a>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mijn gemaakte toetsen</h1>
        <p className="text-muted-foreground">Overzicht van al je voltooide examens</p>
      </div>

      <div className="grid gap-6">
        {results.map((result) => (
          <Card key={result.examId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>NBME 20A Practice Exam</CardTitle>
                    <CardDescription className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(result.completedAt).toLocaleDateString("nl-NL")}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>{result.overallPercent}%</span>
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant={
                      result.overallPercent >= 80
                        ? "default"
                        : result.overallPercent >= 50
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {result.overallPercent}%
                  </Badge>
                  <Button asChild>
                    <a href={`/exam/${result.examId}/results`}>Bekijk resultaten</a>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
