import { explainMatch } from "@/lib/agentic";

export async function POST(request) {
  try {
    const { query, facility } = await request.json();

    if (!query || !facility?.name) {
      return Response.json(
        { error: "query and facility are required." },
        { status: 400 }
      );
    }

    return Response.json({
      explanation: explainMatch(query, facility),
      source: "rule-based-agent",
    });
  } catch (error) {
    return Response.json(
      { error: "Could not generate explanation.", details: error.message },
      { status: 500 }
    );
  }
}
