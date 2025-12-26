import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"

async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error("Not authenticated")
  }
  return session.user
}

async function getUserFromDb(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })
  if (!user) {
    throw new Error("User not found in database")
  }
  return user
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const user = await getUserFromDb(currentUser.email!)

    const data = await request.json()
    const { date, timeStarted, timeEnded, studies, participated, comments } = data

    if (!date || !timeStarted || !timeEnded) {
      return NextResponse.json(
        { error: "Date, timeStarted, and timeEnded are required" },
        { status: 400 }
      )
    }

    const startTime = new Date(timeStarted)
    const endTime = new Date(timeEnded)

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      )
    }

    const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)

    const entry = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        date: new Date(date),
        timeStarted: startTime,
        timeEnded: endTime,
        hoursWorked,
        participated: participated || false,
        comments: comments || null,
        studies: {
          create: (studies || []).map((participant: string) => ({
            participant,
          })),
        },
      },
      include: {
        studies: true,
      },
    })

    return NextResponse.json({
      success: true,
      entry,
      message: "Time entry synced successfully",
    })
  } catch (error) {
    console.error("Sync time entry error:", error)

    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.message === "User not found in database") {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const user = await getUserFromDb(currentUser.email!)

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    if (!year || !month) {
      return NextResponse.json(
        { error: "Year and month parameters are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

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
      orderBy: {
        date: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      entries,
      count: entries.length,
    })
  } catch (error) {
    console.error("Get time entries error:", error)

    if (error instanceof Error && error.message === "Not authenticated") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
