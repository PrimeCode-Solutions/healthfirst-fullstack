import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { addMinutes, format, isWithinInterval, parse } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const dateParameter = request.nextUrl.searchParams.get("date");
    const doctorId = request.nextUrl.searchParams.get("doctorId");

    if (!dateParameter) {
      return NextResponse.json({ error: "Date not Provided" }, { status: 400 });
    }
    
    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID not Provided" }, { status: 400 });
    }

    const date = new Date(dateParameter);
    const dayOfWeek = date.getDay();

    const configurations = await prisma.businessHours.findUnique({
      where: { doctorId: doctorId }
    });

    if (!configurations) {
      return NextResponse.json(
        { error: "Configurations not found for this doctor" },
        { status: 404 },
      );
    }

    const weekdayAvailability: Record<number, boolean> = {
      0: configurations.sundayEnabled,
      1: configurations.mondayEnabled,
      2: configurations.tuesdayEnabled,
      3: configurations.wednesdayEnabled,
      4: configurations.thursdayEnabled,
      5: configurations.fridayEnabled,
      6: configurations.saturdayEnabled,
    };

    if (!weekdayAvailability[dayOfWeek]) {
      return NextResponse.json([], { status: 200 });
    }

    const slots: string[] = [];
    let current = parse(configurations.startTime, "HH:mm", date);
    const end = parse(configurations.endTime, "HH:mm", date);

    while (current < end) {
      let isLunch = false;
      if (
        configurations.lunchBreakEnabled &&
        configurations.lunchStartTime &&
        configurations.lunchEndTime
      ) {
        isLunch = isWithinInterval(current, {
          start: parse(configurations.lunchStartTime, "HH:mm", date),
          end: parse(configurations.lunchEndTime, "HH:mm", date)
        });
      }

      if (!isLunch) {
        slots.push(format(current, "HH:mm"));
      }
      current = addMinutes(current, configurations.appointmentDuration);
    }

    const startDay = new Date(date);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(date);
    endDay.setHours(23, 59, 59, 999);

    const busyAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        date: {
          gte: startDay,
          lte: endDay,
        },
        status: { not: "CANCELLED" },
      },
      select: { startTime: true },
    });

    const busyTimes = busyAppointments.map((a) => a.startTime);
    const availableTimes = slots.filter((slot) => !busyTimes.includes(slot));

    return NextResponse.json(availableTimes, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}