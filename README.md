# SupportSphere AI Ticket Analysis

An AI-powered customer support ticket analysis prototype. This service ingests support tickets, utilizes a Large Language Model (LLM) to generate concise summaries, detect customer sentiment, and strictly redact Personally Identifiable Information (PII) before the data is displayed to internal teams.

## Architecture & Tech Stack

* **Backend:** Node.js + Fastify + TypeScript. Chosen for its high performance, low overhead, and excellent plugin ecosystem.
* **Frontend:** React + Vite. Chosen for fast development, lightweight SPA delivery, and easy containerization via Nginx.
* **LLM Integration:** Local `llama3.1` (8B) via Ollama. 
* **Infrastructure:** Multi-container Docker setup orchestration via Docker Compose.

### Architectural Trade-offs
1.  **Local LLM vs. Managed API (OpenAI/Anthropic):** I opted for a locally hosted Llama 3.1 model. While OpenAI offers easier immediate integration and potentially higher reasoning capabilities, a local model guarantees **100% data privacy**—a critical consideration given the strict PII redaction requirements. The trade-off is higher local infrastructure overhead (requiring a dedicated VM/LXC).
2.  **Fastify vs. Express:** Selected Fastify for its superior async performance and strict schema validation capabilities, which are beneficial when dealing with structured JSON outputs from LLMs.
3.  **Vite/React vs. Next.js:** For a simple internal dashboard, Next.js introduces unnecessary SSR complexity. A static React SPA served via Nginx in Docker provides a much smaller attack surface and lighter footprint.

### AI Safety & Evaluation Considerations
* **Prompt Engineering Strictness:** The system prompt forces a raw JSON output and explicitly defines PII categories to ensure the model focuses purely on extraction and redaction.
* **Temperature Control:** Set to `0.1` to reduce hallucinations and ensure deterministic, analytical outputs.
* **Zero-Trust Display:** The frontend assumes the raw text might be dangerous and relies entirely on the `redactedTicket` payload for display. 
* **Future Evaluation:** In a production environment, I would implement an LLM evaluation framework (like LangSmith or Ragas) to run regression tests against a golden dataset of support tickets to measure the exact accuracy of PII redaction over time.

## Setup & Execution Instructions

### Prerequisites
* Docker & Docker Compose
* An accessible Ollama instance running `llama3.1`

### Running the Application
1. Clone the repository:
   ```bash
   git clone https://github.com/vassilsh/support-sphere-ai-
   cd support-sphere-ai
