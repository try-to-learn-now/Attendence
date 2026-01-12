// app/api/attendance/check/route.js
export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const dateStr = searchParams.get("date");
  const timeSlot = searchParams.get("timeSlot"); // NEW

  if (!code) return NextResponse.json({ status: null });

  const subject = await Subject.findOne({ code });
  if (!subject) {
    return NextResponse.json({ status: null, logs: [], stats: { teacher: 0, bio: 0 } });
  }

  let todayStatus = null;
  if (dateStr) {
    const log = subject.attendance_logs.find((l) => {
      const d = new Date(l.date).toISOString().split("T")[0];
      const timeOk = timeSlot ? l.timeSlot === timeSlot : true;
      return d === dateStr && timeOk;
    });
    if (log) todayStatus = log.status;
  }

  // keep stats logic as you like (or use your boolean flags)
  const logs = subject.attendance_logs;
  const valid = logs.filter((l) => l.status !== "grey").length;
  const teacher = logs.filter((l) => ["green", "orange", "black"].includes(l.status)).length;
  const bio = logs.filter((l) => ["green", "orange"].includes(l.status)).length;

  return NextResponse.json({
    status: todayStatus,
    logs,
    stats: {
      teacher: valid > 0 ? Math.round((teacher / valid) * 100) : 0,
      bio: valid > 0 ? Math.round((bio / valid) * 100) : 0,
    },
  });
}

