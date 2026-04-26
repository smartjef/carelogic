# System Evaluation: Agentic Healthcare Intelligence Quizzes

This document outlines the core test scenarios (quizzes) used to validate the **Drishti AI** reasoning engine. These tests are designed to challenge the agent's ability to navigate messy Indian facility data and identify "Truth Gaps."

---

### Quiz 1: The "Staffing Gap" Audit
**Scenario**: Facility `f_test_01` claims "Advanced Surgical Center" in its description. However, the extracted `staff_roster` contains only general practitioners and no **Anesthesiologist**.
*   **Expected Agent Action**: Flag a **Contradiction Alert**. 
*   **Reasoning**: Medical standards dictate that advanced surgery cannot be performed without specialized anesthesia support. The Trust Score should be penalized by ~15-20%.

### Quiz 2: The "Hardware Gap" (ICU Verification)
**Scenario**: A facility in rural Uttar Pradesh lists "ICU Services" but the equipment log (extracted via IDP) contains: `["Bed", "Monitor", "Stethoscope"]`. It lacks **Ventilators** or an **Oxygen Plant**.
*   **Expected Agent Action**: Categorize ICU as "Constrained" or "Non-functional."
*   **Reasoning**: An ICU without a ventilator is technically a high-dependency unit, not a critical care unit. The agent must show this "Evidence Trace."

### Quiz 3: Regional Desert Identification
**Scenario**: Query: "Locate the highest risk medical desert for Dialysis in Odisha."
*   **Expected Agent Action**: Identify districts where verified coverage is <10% despite high population density.
*   **Output**: A list of PIN codes prioritized by the lack of verified renal care facilities.

### Quiz 4: Complex Multi-Attribute Reasoning
**Scenario**: Query: "Find a facility in Bihar for an emergency appendectomy that typically leverages part-time doctors."
*   **Expected Agent Action**: 
    1.  Filter by location (Bihar).
    2.  Filter by capability (Surgery/Emergency).
    3.  Filter by staffing hint (Part-time).
*   **Trust Requirement**: The agent must prioritize facilities with "24/7 Emergency" listed to ensure the part-time staffing doesn't compromise the "Emergency" requirement.

### Quiz 5: The "Availability" Contradiction
**Scenario**: A facility report states "We offer 24/7 emergency support," but a later sentence in the notes says "Specialists are only on-call between 9 AM and 5 PM."
*   **Expected Agent Action**: Flag a "Truth Gap" alert regarding 24/7 availability.
*   **Output**: "Trust Flag: Contradiction found between 24/7 claim and limited specialist hours."

---

## Evaluation Checklist
- [ ] **Extraction Accuracy**: Does the agent identify 90%+ of equipment mentioned in messy notes?
- [ ] **Reasoning Trace**: Is every Trust Score adjustment backed by a specific sentence citation?
- [ ] **Self-Correction**: Does the Validator Agent correctly identify if a surgery claim is physically impossible?
- [ ] **UX Transparency**: Is the Chain of Thought clear to an NGO planner?
