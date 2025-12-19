"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, User, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { searchEntriesByParticipant } from "@/app/actions/entries"

interface Study {
  id: string
  participant: string
}

interface Entry {
  id: string
  date: Date
  timeStarted: Date
  timeEnded: Date
  hoursWorked: number
  studies: Study[]
  comments?: string | null
}

interface ParticipantSearchProps {
  year: number
}

export function ParticipantSearch({ year }: ParticipantSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<Entry[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    try {
      const entries = await searchEntriesByParticipant(year, searchQuery)
      setResults(entries)
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleClear = () => {
    setSearchQuery("")
    setResults([])
    setHasSearched(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search by participant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9 w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handleSearch} disabled={isSearching} className="flex-1 sm:flex-none">
            {isSearching ? "Searching..." : "Search"}
          </Button>
          {hasSearched && (
            <Button variant="outline" onClick={handleClear} className="flex-1 sm:flex-none">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="py-12 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No entries found</p>
                <p className="text-sm mt-1">Try searching with a different name</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Found {results.length} {results.length === 1 ? "entry" : "entries"}
              </p>
              {results.map((entry) => (
                <Card key={entry.id} className="border-border/40">
                  <CardContent className="py-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{format(new Date(entry.date), "EEEE, MMM d, yyyy")}</span>
                        </div>
                        <div className="text-lg font-bold text-blue-600">{entry.hoursWorked.toFixed(1)} hrs</div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(entry.timeStarted), "h:mm a")} – {format(new Date(entry.timeEnded), "h:mm a")}
                      </div>

                      {/* Studies */}
                      {entry.studies.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-medium">
                            {entry.studies.length} {entry.studies.length === 1 ? "study" : "studies"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {entry.studies.map((study) => (
                              <div
                                key={study.id}
                                className="flex items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800"
                              >
                                <User className="h-3 w-3" />
                                {study.participant}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.comments && (
                        <p className="text-xs text-muted-foreground italic border-t border-border/40 mt-2 pt-2">
                          {entry.comments}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
