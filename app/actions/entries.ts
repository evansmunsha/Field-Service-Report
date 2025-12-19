/// app/actions/entries.ts
"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/db"
import { auth } from "@/auth"

/* ---------------- AUTH ---------------- */

async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error("Not authenticated")
  }
  return session.user
}

/* ---------------- GET CURRENT USER DB RECORD ---------------- */

async function getUserFromDb(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })
  if (!user) {
    throw new Error("User not found in database")
  }
  return user
}

export async function createTimeEntry(data: {
  date: Date
  timeStarted: Date
  timeEnded: Date
  studies: string[]
  participated: boolean
  comments?: string
}) {
  const currentUser = await getCurrentUser()
  const user = await getUserFromDb(currentUser.email!)

  const hoursWorked =
    (data.timeEnded.getTime() - data.timeStarted.getTime()) /
    (1000 * 60 * 60)

  const entry = await prisma.timeEntry.create({
    data: {
      userId: user.id,
      date: data.date,
      timeStarted: data.timeStarted,
      timeEnded: data.timeEnded,
      hoursWorked,
      participated: data.participated,
      comments: data.comments,
      studies: {
        create: data.studies.map((participant) => ({
          participant,
        })),
      },
    },
    include: {
      studies: true,
    },
  })

  revalidatePath("/")
  return entry
}

export async function getMonthlyEntries(year: number, month: number) {
  const currentUser = await getCurrentUser()
  const user = await getUserFromDb(currentUser.email!)

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  return prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      studies: true,
    },
    orderBy: {
      date: "asc",
    },
  })
}

/* ---------------- REPORT ---------------- */

export async function getMonthlyReport(year: number, month: number) {
  const entries = await getMonthlyEntries(year, month)

  const totalHours = entries.reduce(
    (sum, entry) => sum + entry.hoursWorked,
    0
  )

  // Count unique studies case-insensitively
  const uniqueStudies = new Set(
    entries.flatMap((entry) =>
      entry.studies.map((s) => s.participant.toLowerCase())
    )
  )

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    studiesCount: uniqueStudies.size,
    participated: entries.some((entry) => entry.participated),
    entries,
  }
}

export async function getYearlyStats(year: number) {
  const currentUser = await getCurrentUser()
  const user = await getUserFromDb(currentUser.email!)

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      studies: true,
    },
  })

  const totalHours = entries.reduce(
    (sum, entry) => sum + entry.hoursWorked,
    0
  )

  // Count unique studies case-insensitively
  const uniqueStudies = new Set(
    entries.flatMap((entry) =>
      entry.studies.map((s) => s.participant.toLowerCase())
    )
  )

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    studiesCount: uniqueStudies.size,
    entriesCount: entries.length,
  }
}

export async function searchEntriesByParticipant(year: number, participantName: string) {
  const currentUser = await getCurrentUser()
  const user = await getUserFromDb(currentUser.email!)

  if (!participantName.trim()) {
    return []
  }

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
      studies: {
        some: {
          participant: {
            contains: participantName,
            mode: "insensitive",
          },
        },
      },
    },
    include: {
      studies: true,
    },
    orderBy: {
      date: "desc",
    },
  })

  return entries
}

export async function updateTimeEntry(entryId: string, data: {
  date: Date
  timeStarted: Date
  timeEnded: Date
  studies: string[]
  participated: boolean
  comments?: string
}) {
  const currentUser = await getCurrentUser()
  const user = await getUserFromDb(currentUser.email!)

  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  })

  if (!entry || entry.userId !== user.id) {
    throw new Error("Entry not found or not authorized")
  }

  const hoursWorked =
    (data.timeEnded.getTime() - data.timeStarted.getTime()) /
    (1000 * 60 * 60)

  // Delete old studies and create new ones
  await prisma.study.deleteMany({
    where: { entryId },
  })

  const updatedEntry = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      date: data.date,
      timeStarted: data.timeStarted,
      timeEnded: data.timeEnded,
      hoursWorked,
      participated: data.participated,
      comments: data.comments,
      studies: {
        create: data.studies.map((participant) => ({
          participant,
        })),
      },
    },
    include: {
      studies: true,
    },
  })

  revalidatePath("/")
  return updatedEntry
}

export async function deleteTimeEntry(entryId: string) {
  const currentUser = await getCurrentUser()
  const user = await getUserFromDb(currentUser.email!)

  const entry = await prisma.timeEntry.findUnique({
    where: { id: entryId },
  })

  if (!entry || entry.userId !== user.id) {
    throw new Error("Entry not found or not authorized")
  }

  await prisma.timeEntry.delete({
    where: { id: entryId },
  })

  revalidatePath("/")
}

export async function getCurrentUserInfo() {
  const currentUser = await getCurrentUser()
  const user = await getUserFromDb(currentUser.email!)

  return {
    id: user.id,
    displayName: user.name ?? currentUser.email ?? "User",
  }
}
