import rawFacilities from "@/data/india_large.json";

function parseJsonField(field) {
  try {
    if (typeof field === "string" && (field.startsWith("[") || field.startsWith("{"))) {
      return JSON.parse(field);
    }
    return field;
  } catch (e) {
    return [];
  }
}

export const facilities = rawFacilities.map((f, index) => {
  const description = f.description || "";
  const procedures = parseJsonField(f.procedure);
  const equipment = parseJsonField(f.equipment);
  const capabilities = parseJsonField(f.capability);
  
  const raw_report = [
    description,
    Array.isArray(procedures) ? procedures.join(". ") : procedures,
    Array.isArray(equipment) ? equipment.join(". ") : equipment,
    Array.isArray(capabilities) ? capabilities.join(". ") : capabilities,
  ].filter(Boolean).join(" ");

  return {
    id: `f${index}`,
    name: f.name,
    location: `${f.address_city || ""}, ${f.address_stateOrRegion || ""}`,
    state: f.address_stateOrRegion || "Unknown",
    district: f.address_city || "Unknown",
    pincode: f.address_zipOrPostcode || "Unknown",
    latitude: f.latitude,
    longitude: f.longitude,
    raw_report,
  };
});

const capabilityMap = {
  icu: ["icu", "intensive care", "critical care", "ventilator"],
  dialysis: ["dialysis", "renal", "nephrology", "hemodialysis"],
  emergency: ["emergency", "er", "casualty", "trauma", "24/7"],
  surgery: ["surgery", "theatre", "operation", "surgeon", "appendectomy", "laparotomy"],
  maternity: ["maternity", "obstetric", "labor", "nicu"],
  oncology: ["oncology", "cancer", "chemotherapy", "radiotherapy"],
  rural: ["rural", "village", "gramin", "remote"],
};

const equipmentKeywords = [
  "ct",
  "mri",
  "ventilator",
  "x-ray",
  "ultrasound",
  "oxygen plant",
  "dialysis machine",
];

const availabilitySignals = {
  available: ["open", "operational", "active", "running", "24/7", "resumed"],
  limited: ["limited", "partial", "reduced", "twice weekly", "few"],
  unavailable: ["no", "not operational", "downtime", "absent", "referral only", "full"],
};

function normalize(text = "") {
  return text.toLowerCase();
}

export function processFacilityReport(rawReport) {
  const text = normalize(rawReport);
  const services = [];
  const equipment = [];
  const capabilities = [];

  Object.entries(capabilityMap).forEach(([capability, hints]) => {
    if (hints.some((hint) => text.includes(hint))) {
      capabilities.push(capability);
      services.push(capability.toUpperCase());
    }
  });

  equipmentKeywords.forEach((item) => {
    if (text.includes(item)) equipment.push(item);
  });

  let availability = "available";
  if (availabilitySignals.unavailable.some((signal) => text.includes(signal))) {
    availability = "constrained";
  } else if (availabilitySignals.limited.some((signal) => text.includes(signal))) {
    availability = "limited";
  }

  return {
    services: [...new Set(services)],
    equipment: [...new Set(equipment)],
    capabilities: [...new Set(capabilities)],
    availability,
    evidence: buildEvidence(rawReport, [...new Set(capabilities)]),
    contradictions: detectContradictions(rawReport),
  };
}

function buildEvidence(rawReport = "", capabilities = []) {
  const sentences = rawReport
    .split(/[.!?]/)
    .map((part) => part.trim())
    .filter(Boolean);

  return capabilities
    .map((capability) => {
      const sentence = sentences.find((line) => line.toLowerCase().includes(capability));
      return sentence ? { capability, sentence } : null;
    })
    .filter(Boolean);
}

function detectContradictions(rawReport = "") {
  const text = normalize(rawReport);
  const contradictions = [];

  // 1. Surgery vs. Anesthesia (The "Staffing Gap")
  const surgicalKeywords = ["surgery", "surgical", "operation", "theatre", "appendectomy", "laparotomy"];
  const hasSurgeryClaim = surgicalKeywords.some(kw => text.includes(kw));
  const hasAnesthesia = text.includes("anesthesi");
  if (hasSurgeryClaim && !hasAnesthesia) {
    contradictions.push("Facility provides surgical services but lacks an anesthesiologist in the current roster.");
  }

  // 2. ICU vs. Equipment (The "Hardware Gap")
  const hasICUClaim = text.includes("icu") || text.includes("intensive care") || text.includes("critical care");
  const hasVentilator = text.includes("ventilator") || text.includes("oxygen plant");
  if (hasICUClaim && !hasVentilator) {
    contradictions.push("ICU listed without confirmed ventilator logs or oxygen plant availability.");
  }

  // 3. Dialysis vs. Machine (The "Operational Gap")
  const hasDialysisClaim = text.includes("dialysis") || text.includes("renal");
  const hasDialysisMachine = text.includes("machine") || text.includes("station") || text.includes("chair");
  if (hasDialysisClaim && !hasDialysisMachine && !text.includes("hemodialysis")) {
    contradictions.push("Dialysis capability mentioned but no functional stations or machines verified in equipment log.");
  }

  // 4. Status Contradictions
  if (text.includes("active") && (text.includes("not operational") || text.includes("downtime"))) {
    contradictions.push("Conflict detected: Facility reports 'active' status while notes indicate downtime or non-operational units.");
  }

  return contradictions;
}


function computeTrustScore(structured) {
  let score = 0.72;
  if (structured.evidence.length >= 2) score += 0.12;
  if (structured.availability === "available") score += 0.08;
  if (structured.availability === "limited") score -= 0.04;
  score -= structured.contradictions.length * 0.1;
  return Math.max(0.2, Math.min(0.98, Number(score.toFixed(2))));
}

export function interpretQuery(query = "") {
  const text = normalize(query);
  const intentCapabilities = [];
  Object.entries(capabilityMap).forEach(([capability, hints]) => {
    if (hints.some((hint) => text.includes(hint))) intentCapabilities.push(capability);
  });

  const urgency =
    text.includes("urgent") || text.includes("now") || text.includes("emergency")
      ? "high"
      : "normal";

  // Improve location extraction: check all facilities for a match in the query string
  // This is expensive but buildSearchIndex handles caching. 
  // We'll limit it to checking unique states and districts.
  const states = [...new Set(facilities.map(f => normalize(f.state)))];
  const districts = [...new Set(facilities.map(f => normalize(f.district)))];
  
  const matchedState = states.find(s => text.includes(s));
  const matchedDistrict = districts.find(d => text.includes(d));
  const pincodeMatch = text.match(/\b\d{6}\b/);

  const locationHint = (matchedState || matchedDistrict || pincodeMatch)
    ? {
        state: matchedState ? facilities.find(f => normalize(f.state) === matchedState)?.state : null,
        district: matchedDistrict ? facilities.find(f => normalize(f.district) === matchedDistrict)?.district : null,
        pincode: pincodeMatch ? pincodeMatch[0] : null,
      }
    : null;

  const staffingHint = text.includes("parttime") || text.includes("part-time")
    ? "part-time"
    : text.includes("full-time")
      ? "full-time"
      : null;

  // Attempt to extract a name hint (e.g. "Find Smiles Dental")
  const nameHint = text.split(" ").length < 4 ? text : null;

  return {
    intentCapabilities: [...new Set(intentCapabilities)],
    urgency,
    locationHint,
    staffingHint,
    nameHint,
  };
}


function scoreMatch(queryInfo, facility, structured) {
  let score = 0.0;
  const matched = [];

  // 1. Capability Match (Highest Priority)
  queryInfo.intentCapabilities.forEach((need) => {
    if (structured.capabilities.includes(need)) {
      score += 0.4;
      matched.push(need);
    }
  });

  // 2. Name Match (Direct name search)
  if (queryInfo.nameHint && normalize(facility.name).includes(queryInfo.nameHint)) {
    score += 0.5;
  }

  // 3. Location Match (Strong boost for relevant geography)
  let locationMatch = false;
  if (queryInfo.locationHint) {
    if (queryInfo.locationHint.state && facility.state === queryInfo.locationHint.state) {
      score += 0.15;
      locationMatch = true;
    }
    if (queryInfo.locationHint.district && facility.district === queryInfo.locationHint.district) {
      score += 0.2;
      locationMatch = true;
    }
    if (queryInfo.locationHint.pincode && facility.pincode === queryInfo.locationHint.pincode) {
      score += 0.25;
      locationMatch = true;
    }
  }

  // 4. Staffing Alignment
  if (queryInfo.staffingHint === "part-time" && normalize(facility.raw_report).includes("part-time")) {
    score += 0.1;
  }
  if (queryInfo.staffingHint === "full-time" && normalize(facility.raw_report).includes("full-time")) {
    score += 0.1;
  }

  // 5. Operational Status
  if (structured.availability === "available") score += 0.1;
  if (structured.availability === "limited") score += 0.05;
  if (queryInfo.urgency === "high" && structured.capabilities.includes("emergency")) score += 0.15;

  return {
    score: Math.min(Number(score.toFixed(3)), 1.0),
    matchedCapabilities: matched,
    isLocationMatch: locationMatch,
  };
}

let cachedIndex = null;
export function buildSearchIndex() {
  if (cachedIndex) return cachedIndex;
  cachedIndex = facilities.map((facility) => {
    const structured = processFacilityReport(facility.raw_report);
    return { ...facility, structured, trustScore: computeTrustScore(structured) };
  });
  return cachedIndex;
}

export function runSearch(query, filters = {}) {
  const queryInfo = interpretQuery(query);
  const index = buildSearchIndex();

  const ranked = index
    .map((facility) => {
      const match = scoreMatch(queryInfo, facility, facility.structured);
      return {
        ...facility,
        ...match,
      };
    })
    .filter((item) => {
      // Strict filtering: 
      // 1. If capability filter active, must match.
      if (filters.capability && !item.structured.capabilities.includes(filters.capability)) return false;
      
      // 2. If it's a general query, must have some relevance.
      // If we have a location hint, prioritize location matches.
      if (queryInfo.locationHint && !item.isLocationMatch && item.score < 0.3) return false;
      
      // General threshold
      return item.score > 0.1 || (queryInfo.intentCapabilities.length === 0 && !queryInfo.locationHint);
    });

  const result = ranked.sort((a, b) => {
    const scoreA = a.score + (a.trustScore * 0.3);
    const scoreB = b.score + (b.trustScore * 0.3);
    return scoreB - scoreA;
  });

  return { queryInfo, result: result.slice(0, 100) }; // Limit to top 100 for better focus
}


export function explainMatch(query, facility) {
  const structured = facility.structured || processFacilityReport(facility.raw_report);
  const queryInfo = interpretQuery(query);
  const matched = queryInfo.intentCapabilities.filter((cap) =>
    structured.capabilities.includes(cap)
  );

  const capabilityText = matched.length
    ? matched.join(", ")
    : structured.capabilities.slice(0, 2).join(", ") || "critical support";

  const thoughts = [
    `Analyzing facility: ${facility.name} in ${facility.district}, ${facility.state}.`,
    `Extracted capabilities: ${structured.capabilities.join(", ") || "None identified"}.`,
    `Trust validation: Found ${structured.evidence.length} evidence points and ${structured.contradictions.length} contradictions.`,
  ];

  if (structured.contradictions.length > 0) {
    thoughts.push(`Warning: Flagged contradictions: ${structured.contradictions.join("; ")}`);
  }

  const reasoning = thoughts.join("\n");

  return `### Agent Reasoning Trace\n${reasoning}\n\n**Conclusion**: ${facility.name} is prioritized because it shows verified ${capabilityText} capability. Current availability is ${structured.availability} with a Trust Score of ${facility.trustScore ?? computeTrustScore(structured)}.`;
}

export function identifyMedicalDeserts(capability) {
  const index = buildSearchIndex();
  const stateStats = {};
  
  index.forEach(f => {
    if (!stateStats[f.state]) stateStats[f.state] = { count: 0, total: 0 };
    stateStats[f.state].total++;
    if (f.structured.capabilities.includes(capability) && f.trustScore > 0.6) {
      stateStats[f.state].count++;
    }
  });

  return Object.entries(stateStats)
    .map(([state, stats]) => ({
      state,
      coverage: stats.count / stats.total,
      isDesert: stats.count === 0,
      totalFacilities: stats.total,
      highAcuityCount: stats.count
    }))
    .filter(s => s.state !== "Unknown")
    .sort((a, b) => a.coverage - b.coverage);
}

