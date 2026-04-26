import { processFacilityReport } from "@/lib/agentic";

export async function POST(request) {
  try {
    const { raw_report: rawReport } = await request.json();
    if (!rawReport?.trim()) {
      return Response.json({ error: "raw_report is required." }, { status: 400 });
    }

    const processed = processFacilityReport(rawReport);
    return Response.json({
      ...processed,
      processor: "healthcare-agent-v1",
      confidence: 0.84,
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to process facility report.", details: error.message },
      { status: 500 }
    );
  }
}
