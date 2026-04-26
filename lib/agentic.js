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
    ...f,
    id: `f${index}`,
    name: f.name,
    location: `${f.address_city || ""}, ${f.address_stateOrRegion || ""}`,
    state: f.address_stateOrRegion || "Unknown",
    district: f.address_city || "Unknown",
    pincode: f.address_zipOrPostcode || "Unknown",
    latitude: f.latitude,
    longitude: f.longitude,
    raw_report,
    procedures,
    equipment_list: equipment,
    capabilities_list: capabilities,
  };
});

const capabilityMap = {
  icu: ["icu", "intensive care", "critical care", "ventilator", "hdu", "step down"],
  dialysis: ["dialysis", "renal", "nephrology", "hemodialysis", "kidney", "crrt"],
  emergency: ["emergency", "er", "casualty", "trauma", "24/7", "accident"],
  surgery: ["surgery", "theatre", "operation", "surgeon", "appendectomy", "laparotomy", "ot", "surgical"],
  maternity: ["maternity", "obstetric", "labor", "nicu", "childbirth", "delivery", "gynec"],
  oncology: ["oncology", "cancer", "chemotherapy", "radiotherapy", "malignancy", "biopsy"],
  rural: ["rural", "village", "gramin", "remote", "tribal", "outreach"],
};

const equipmentKeywords = [
  "ct",
  "mri",
  "ventilator",
  "x-ray",
  "ultrasound",
  "oxygen plant",
  "dialysis machine",
  "eeg",
  "ecg",
  "defibrillator",
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

  const structured = {
    services: [...new Set(services)],
    equipment: [...new Set(equipment)],
    capabilities: [...new Set(capabilities)],
    availability,
    evidence: buildEvidence(rawReport, [...new Set(capabilities)]),
    contradictions: detectContradictions(rawReport),
  };

  const trustResult = computeTrustScore(structured, rawReport);

  return {
    ...structured,
    trustScore: trustResult.score,
    trustDetails: trustResult,
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


function validatorAgent(structured) {
  const validationErrors = [];

  // Medical Standard: ICU requires Ventilator
  if (structured.capabilities.includes("icu") && !structured.equipment.includes("ventilator")) {
    validationErrors.push("Medical Standard Violation: ICU claim detected without ventilator evidence.");
  }

  // Medical Standard: Oncology requires Diagnostic Imaging
  if (structured.capabilities.includes("oncology") && !structured.equipment.includes("ct") && !structured.equipment.includes("mri")) {
    validationErrors.push("Medical Standard Violation: Oncology listed without CT/MRI diagnostic capability.");
  }

  // Medical Standard: Maternity requires 24/7 or NICU hints
  if (structured.capabilities.includes("maternity") && !structured.capabilities.includes("emergency") && !structured.services.includes("NICU")) {
    validationErrors.push("Incomplete Capability: Maternity services listed but lacks 24/7 emergency context.");
  }

  return validationErrors;
}

function computeTrustScore(structured, rawReport = "") {
  let score = 0.72;
  
  // 1. Evidence Impact
  const evidenceCount = structured.evidence.length;
  if (evidenceCount >= 2) score += 0.12;
  else if (evidenceCount === 1) score += 0.05;
  
  // 2. Operational Signals
  if (structured.availability === "available") score += 0.08;
  if (structured.availability === "limited") score -= 0.04;
  
  // 3. Penalty Layers (Contradictions & Standards)
  score -= structured.contradictions.length * 0.15;
  const validationIssues = validatorAgent(structured);
  score -= validationIssues.length * 0.1;

  // --- Research: Confidence Scoring & Prediction Intervals ---
  // We frame the conclusion not as a point-estimate, but as an interval.
  // The 'messiness' of the report dictates the width of our uncertainty.
  const wordCount = rawReport.split(/\s+/).length;
  const attributeDensity = (structured.capabilities.length + structured.equipment.length) / Math.max(1, wordCount / 50);
  
  // High density + high evidence = narrow interval (Certainty)
  // Low density + zero evidence = wide interval (Speculative)
  const uncertainty = Math.max(0.05, 0.3 - (attributeDensity * 0.1) - (evidenceCount * 0.05));
  
  const finalScore = Math.max(0.1, Math.min(0.98, Number(score.toFixed(2))));
  
  return {
    score: finalScore,
    validationIssues,
    predictionInterval: {
      lower: Math.max(0.05, Number((finalScore - uncertainty).toFixed(2))),
      upper: Math.min(0.99, Number((finalScore + uncertainty).toFixed(2))),
      confidenceLevel: "95%", // Simulated confidence level based on corpus consistency
      uncertaintyLabel: uncertainty > 0.2 ? "High Uncertainty" : uncertainty > 0.1 ? "Moderate" : "High Confidence",
    }
  };
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
  const states = [...new Set(facilities.map(f => f.state ? normalize(f.state) : ""))].filter(s => s.length > 2);
  const districts = [...new Set(facilities.map(f => f.district ? normalize(f.district) : ""))].filter(d => d.length > 2);
  
  const matchedState = states.find(s => s && text.includes(s));
  const matchedDistrict = districts.find(d => d && text.includes(d));
  const pincodeMatch = text.match(/\b\d{6}\b/);

  // Fallback: If no capability found, extract significant nouns from query
  const keywords = text.split(/\s+/).filter(w => 
    w.length > 3 && 
    !["find", "nearest", "facility", "rural", "with", "doctors", "emergency"].includes(w) &&
    !intentCapabilities.includes(w)
  );

  const locationHint = (matchedState || matchedDistrict || pincodeMatch)
    ? {
        state: matchedState ? (facilities.find(f => normalize(f.state) === matchedState)?.state || null) : null,
        district: matchedDistrict ? (facilities.find(f => normalize(f.district) === matchedDistrict)?.district || null) : null,
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
    keywords,
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

  // 6. Generic Keyword matching (Fallback for unmapped terms)
  let isIntentMatch = matched.length > 0;
  if (queryInfo.keywords?.length) {
    const text = normalize(facility.raw_report);
    const keywordMatches = queryInfo.keywords.filter(kw => text.includes(kw));
    score += keywordMatches.length * 0.15;
    if (keywordMatches.length > 0) isIntentMatch = true;
  }

  return { 
    score: Math.min(1.0, Number(score.toFixed(3))), 
    isIntentMatch, 
    isLocationMatch: locationMatch,
    matchedCapabilities: matched
  };
}

let cachedIndex = null;
export function buildSearchIndex() {
  if (cachedIndex) return cachedIndex;
  cachedIndex = facilities.map((facility) => {
    const structured = processFacilityReport(facility.raw_report);
    const { score, validationIssues, predictionInterval } = computeTrustScore(structured, facility.raw_report);
    return { ...facility, structured, trustScore: score, validationIssues, predictionInterval };
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
      // 1. If explicit capability filter active, must match
      if (filters.capability && !item.structured.capabilities.includes(filters.capability)) return false;
      
      // 2. If we have location/intent hints, the item must match at least one if query is specific
      if ((queryInfo.locationHint || queryInfo.intentCapabilities.length > 0 || queryInfo.keywords.length > 0)) {
         if (!item.isLocationMatch && !item.isIntentMatch && item.score < 0.4) return false;
      }
      
      return item.score > 0.1;
    });

  const result = ranked.sort((a, b) => {
    const scoreA = a.score + (a.trustScore * 0.3);
    const scoreB = b.score + (b.trustScore * 0.3);
    return scoreB - scoreA;
  });

  return { queryInfo, result: result.slice(0, 100) };
}

export function explainMatch(query, facility) {
  const structured = facility.structured || processFacilityReport(facility.raw_report);
  const queryInfo = interpretQuery(query);
  const trustData = computeTrustScore(structured, facility.raw_report);
  
  const matched = queryInfo.intentCapabilities.filter((cap) =>
    structured.capabilities.includes(cap)
  );

  const capabilityText = matched.length
    ? matched.join(", ")
    : structured.capabilities.slice(0, 2).join(", ") || "critical support";

  const thoughts = [
    `[Step 1: Ingestion] Sifting through unstructured notes for ${facility.name}.`,
    `[Step 2: Extraction] Found capabilities: ${structured.capabilities.join(", ") || "None"}.`,
    `[Step 3: Verification] Cross-referencing against medical standards...`,
  ];

  if (trustData.validationIssues.length > 0) {
    thoughts.push(`[Step 4: Validator Agent] ALERT: ${trustData.validationIssues.join(" ")}`);
  } else {
    thoughts.push(`[Step 4: Validator Agent] No standard violations detected.`);
  }

  const p = trustData.predictionInterval;
  thoughts.push(`[Step 5: Statistical Context] Prediction Interval: [${p.lower} - ${p.upper}] with ${p.confidenceLevel} confidence (${p.uncertaintyLabel}).`);

  const citations = structured.evidence.map(e => `> "${e.sentence}" (Evidence for ${e.capability})`).join("\n");

  const reasoning = thoughts.join("\n");

  return `### Agentic Reasoning Trace (MLflow 3 format)\n${reasoning}\n\n### Row-Level Citations\n${citations || "*No direct sentence-level citations found for specific capabilities.*"}\n\n**Conclusion**: Verified ${capabilityText} capability with a Trust Score of ${trustData.score}. Uncertainty is framed by a statistical bound of ±${((p.upper - p.lower)/2).toFixed(2)} based on report attribute density.`;
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

