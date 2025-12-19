"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar, Clock, Edit, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { deleteTimeEntry } from "@/app/actions/entries"
import { EditTimeEntryDialog } from "@/components/edit-time-entry-dialog"

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
  participated: boolean
  comments?: string | null
}

interface EntryListProps {
  entries: Entry[]
  onDelete?: () => void
  onUpdate?: () => void
}

export function EntryList({ entries, onDelete, onUpdate }: EntryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId)
    try {
      await deleteTimeEntry(entryId)
      onDelete?.()
    } catch (error) {
      console.error("Failed to delete entry:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry)
    setIsEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    setEditingEntry(null)
    onUpdate?.()
  }

  if (entries.length === 0) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No entries yet</p>
          <p className="text-sm mt-1">Start logging your field service time above</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="border-border/40 hover:border-border">
            <CardContent className="py-3">
              <div className="flex items-start justify-between">
                {/* LEFT SIDE */}
                <div className="space-y-2">
                  {/* DATE */}
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(entry.date), "EEEE, MMM d")}
                  </div>

                  {/* TIME */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(entry.timeStarted), "h:mm a")} –{" "}
                    {format(new Date(entry.timeEnded), "h:mm a")}
                  </div>

                  {/* STUDY CHIPS */}
                  {entry.studies.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {entry.studies.length} {entry.studies.length === 1 ? "study" : "studies"}
                    </div>
                  )}

                  {entry.studies.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
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
                  )}
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{entry.hoursWorked.toFixed(1)} hrs</div>
                  </div>

                  {/* EDIT */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => handleEdit(entry)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  {/* DELETE */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                  >
                    <Trash2 className={`h-4 w-4 ${deletingId === entry.id ? "animate-pulse" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EditTimeEntryDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        entry={editingEntry}
        onSuccess={handleEditSuccess}
      />
    </>
  )
}
