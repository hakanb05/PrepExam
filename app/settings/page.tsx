import { Card, CardContent } from "@/components/ui/card"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instellingen</h1>
        <p className="text-muted-foreground">Configureer je applicatie voorkeuren</p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Instellingen komen binnenkort</h3>
              <p className="text-muted-foreground">
                Deze pagina wordt binnenkort uitgebreid met meer configuratieopties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
