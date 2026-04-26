import { runSearch, facilities } from "@/lib/agentic";

export async function POST(request) {
  try {
    const { query, filters = {} } = await request.json();
    if (!query?.trim()) {
      return Response.json({ error: "Query is required." }, { status: 400 });
    }

    const { queryInfo, result } = runSearch(query, filters);

    return Response.json({
      query,
      interpretedIntent: queryInfo,
      facilities: result,
      indexStats: {
        simulatedCorpus: facilities.length,
        indexedRecords: result.length,
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to process search request.", details: error.message },
      { status: 500 }
    );
  }
}
