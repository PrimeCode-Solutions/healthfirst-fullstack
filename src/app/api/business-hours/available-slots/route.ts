import { NextRequest, NextResponse } from "next/server";

function validateLunchHour(schedules: string[]) {
  const lunchHour = "12:00"; //example
  const filtredSchedules = schedules.filter((element) => element != lunchHour);
  return filtredSchedules;
}

function validateSchedules(
  day: string,
  busy: Record<string, string[]>,
  all: Record<string, string[]>,
) {
  const allSchedulesArray = all[day] || [];
  const busySchedulesArray = busy[day] || [];

  const freeSchedules = allSchedulesArray.filter(
    (hour) => !busySchedulesArray.includes(hour),
  );

  return validateLunchHour(freeSchedules);
}

function validateDayOff(daysOff: Array<string>, data: string) {
  return daysOff.includes(data);
}

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("data");

    if (!date) {
      throw new Error("Date not sent");
    }

    if (
      validateDayOff(
        [
          /*Array with days that doesn't work*/
        ],
        date,
      )
    ) {
      throw new Error("Day is off");
    }

    //const freeSchedules = validateSchedules(dayGet, busySchedules, schedules)
    /*return NextResponse.json(
  { freeSchedules, message: "Horários disponíveis" },
  { status: 200 });*/
  } catch (err: any) {
    console.error(`ERROR: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
