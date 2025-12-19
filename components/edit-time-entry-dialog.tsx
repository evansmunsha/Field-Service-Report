"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Clock, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { updateTimeEntry } from "@/app/actions/entries"

const formSchema = z.object({
  date: z.date(),
  timeStarted: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  timeEnded: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  participated: z.boolean(),
  comments: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface Study {
  id: string
  participant: string
}

interface EditTimeEntryDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  entry: {
    id: string
    date: Date
    timeStarted: Date
    timeEnded: Date
    studies: Study[]
    participated: boolean
    comments?: string | null
  } | null
  onSuccess?: () => void
}

export function EditTimeEntryDialog({ isOpen, onOpenChange, entry, onSuccess }: EditTimeEntryDialogProps) {
  const [studies, setStudies] = useState<string[]>([])
  const [newStudy, setNewStudy] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: entry?.date || new Date(),
      timeStarted: entry ? format(new Date(entry.timeStarted), "HH:mm") : "09:00",
      timeEnded: entry ? format(new Date(entry.timeEnded), "HH:mm") : "12:00",
      participated: entry?.participated || false,
      comments: entry?.comments || "",
    },
  })

  // Initialize studies from entry when dialog opens
  useEffect(() => {
    if (entry && isOpen) {
      setStudies(entry.studies.map((s) => s.participant))
    }
  }, [entry, isOpen])

  const selectedDate = watch("date")

  const addStudy = () => {
    if (newStudy.trim()) {
      setStudies([...studies, newStudy.trim()])
      setNewStudy("")
    }
  }

  const removeStudy = (index: number) => {
    setStudies(studies.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormData) => {
    if (!entry) return

    setIsSubmitting(true)
    setMessage(null)
    try {
      const [startHour, startMinute] = data.timeStarted.split(":").map(Number)
      const [endHour, endMinute] = data.timeEnded.split(":").map(Number)

      const timeStarted = new Date(data.date)
      timeStarted.setHours(startHour, startMinute, 0, 0)

      const timeEnded = new Date(data.date)
      timeEnded.setHours(endHour, endMinute, 0, 0)

      if (timeEnded <= timeStarted) {
        setMessage({ type: "error", text: "End time must be after start time" })
        setIsSubmitting(false)
        return
      }

      await updateTimeEntry(entry.id, {
        date: data.date,
        timeStarted,
        timeEnded,
        studies,
        participated: data.participated,
        comments: data.comments,
      })

      setMessage({ type: "success", text: "Entry updated successfully!" })
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 800)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update entry" })
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Field Service Entry</DialogTitle>
          <DialogDescription>Update your field service record</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {message && (
            <div
              className={cn(
                "p-3 rounded-md text-sm",
                message.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {message.text}
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue("date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="editTimeStarted">Time Started</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="editTimeStarted" type="time" className="pl-9 text-sm" {...register("timeStarted")} />
              </div>
              {errors.timeStarted && <p className="text-sm text-destructive">{errors.timeStarted.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="editTimeEnded">Time Ended</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="editTimeEnded" type="time" className="pl-9 text-sm" {...register("timeEnded")} />
              </div>
              {errors.timeEnded && <p className="text-sm text-destructive">{errors.timeEnded.message}</p>}
            </div>
          </div>

          {/* Bible Studies */}
          <div className="space-y-2">
            <Label>Bible Studies Conducted</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter participant name"
                value={newStudy}
                onChange={(e) => setNewStudy(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addStudy()
                  }
                }}
              />
              <Button type="button" onClick={addStudy} size="icon" variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {studies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {studies.map((study, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-sm"
                  >
                    {study}
                    <button type="button" onClick={() => removeStudy(index)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Participated Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="editParticipated"
              onCheckedChange={(checked) => setValue("participated", checked as boolean)}
            />
            <Label htmlFor="editParticipated" className="text-sm font-normal cursor-pointer">
              I shared in any form of ministry this month
            </Label>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="editComments">Comments (Optional)</Label>
            <Textarea
              id="editComments"
              placeholder="Add any notes about your service..."
              {...register("comments")}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
