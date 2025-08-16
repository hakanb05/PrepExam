import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Play } from "lucide-react"
import { getExamData } from "@/lib/exam-data"

export default function ExamsPage() {
  const examData = getExamData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams</h1>
          <p className="text-muted-foreground">Available exams and practice tests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search exams..." className="pl-10" />
              </div>
            </div>
            <Select defaultValue="recent">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently taken</SelectItem>
                <SelectItem value="score">Best score</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exam List */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{examData.title}</CardTitle>
                  <CardDescription>
                    4 sections • {examData.sections.reduce((total, section) => total + section.questions.length, 0)}{" "}
                    questions
                  </CardDescription>
                </div>
              </div>
              <Button asChild>
                <a href={`/exam/${examData.examId}/start`}>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              {examData.sections.map((section, index) => (
                <Badge key={section.sectionId} variant="outline">
                  {section.title}: Not started
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
