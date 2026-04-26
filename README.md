# Serving a Nation: Agentic Healthcare Intelligence System

[![Built for Databricks](https://img.shields.io/badge/Built%20for-Databricks-FF3621?logo=databricks&logoColor=white)](https://www.databricks.com/)
[![License: NGO-Impact](https://img.shields.io/badge/License-NGO--Impact-teal)](LICENSE)

In India, a postal code often determines a lifespan. While the nation boasts world-class medical hubs, 70% of the population lives in rural areas where healthcare access is a fragmented puzzle. **Serving a Nation** is an Agentic Intelligence System designed to navigate 10,000+ unstructured medical facility reports to find hidden life-saving capabilities and reduce Discovery-to-Care time.

## Core Mission

Our goal is to build the **Reasoning Layer** for Indian healthcare—moving beyond keyword search to an agentic system that can:
- **Audit Capability at Scale**: Verify functional ICUs vs. simple listings using unstructured extraction.
- **Identify Specialized Deserts**: Locate regional gaps for high-acuity needs like Oncology, Dialysis, and Emergency Trauma.
- **Navigate the Truth Gap**: Reason through non-standardized descriptions and flag contradictions (e.g., Surgery claims without Anesthesiologists).

## Key Features

### 1. Massive Unstructured Extraction
Leverages the Databricks Data Intelligence Platform logic to process free-form text from 10k facility records, including equipment logs, availability claims, and staff specialties.

### 2. The Trust Scorer & Validator Agent
Since real-world data is messy, our agent includes a **Self-Correction Loop**:
- **Logic Step**: Flags suspicious data (e.g., Advanced Surgery listed but no Anesthesiologist).
- **Statistical Confidence**: Implements **Prediction Intervals** around conclusions to provide NGO planners with a "Certainty Bound."

### 3. Agentic Traceability (MLflow Style)
Provides row-level and step-level citations. Every recommendation includes an **Agentic Reasoning Trace** showing the exact sentence in the medical report that justifies the decision.

### 4. Dynamic Crisis Mapping
A visual dashboard that overlays agent findings onto a map of India, highlighting high-risk medical deserts by PIN code and verified coverage percentage.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS + TailwindCSS (Flat, High-Density NGO UI)
- **Mapping**: [React-Leaflet](https://react-leaflet.js.org/) (OpenStreetMap)
- **Agentic Logic**: Custom JavaScript Reasoning Engine (`lib/agentic.js`)
- **Data**: 10,000 Normalized Indian Facility Records (`data/india_large.json`)

## Architecture

### Agentic Intelligence Layer (`lib/agentic.js`)
The core "Brain" of the system, handling:
- **`interpretQuery`**: Natural Language Intent detection for medical needs, location hints, and staffing requirements.
- **`processFacilityReport`**: IDP-driven extraction of capabilities, equipment, and contradictions.
- **`validatorAgent`**: Cross-references extracted data against known medical standards.
- **`computeTrustScore`**: Generates a 0-1 score with associated statistical prediction intervals.

### API Routes
- `POST /api/search`: Performs intent-aware ranking across the 10k corpus.
- `POST /api/explain`: Generates decision-ready Markdown rationale for a specific facility.

## Getting Started

### Prerequisites
- Node.js 18+
- NPM or PNPM

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard at `http://localhost:3000`.

### Credentials
- **User**: `admin@healthintel.io`
- **Pass**: `demo1234`

## Evaluation Metrics
- **Discovery & Verification (35%)**: High reliability in capability extraction from 10k messy rows.
- **IDP Innovation (30%)**: Advanced synthesis of free-form Indian facility notes.
- **Social Impact (25%)**: Effective identification of medical deserts for NGO planning.
- **User Experience (10%)**: Intuitive, high-density interface with clear Chain of Thought.
