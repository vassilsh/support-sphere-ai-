# Support Sphere AI - PII Redaction & Analysis API

Support Sphere AI is a privacy-first, hybrid-cloud customer support ticket analyzer. It ingests raw customer tickets, identifies and strips Personally Identifiable Information (PII) using advanced Large Language Models, and returns a strictly formatted JSON payload containing a concise summary, customer sentiment, and the fully redacted text.

This application features a **Provider Abstraction Layer**, allowing it to run entirely air-gapped on local infrastructure using open-weight models (like Llama 3.2 or Qwen 2.5), or seamlessly scale via Google's Gemini Cloud APIs without changing a single line of application logic. It also features a fully auditable database history layer for reviewing processed communications.

## 🚀 Key Features

* **Hybrid-Cloud LLM Routing:** Switch between self-hosted Local LLMs (Ollama) and Managed Cloud APIs (Google Gemini) instantly via environment variables.
* **Persistent Audit Logging:** Integrated an asynchronous SQLite database layer driven by **Prisma 7** to cache, structure, and permanently log every single processed transaction.
* **Rich Analytics Dashboard:** A beautiful dark-mode React history dashboard showing dynamic sentiment analysis badges, auto-generated executive summaries, and searchable, copyable redacted text strings with timestamps.
* **Strict Schema Enforcement:** LLM outputs are defensively intercepted and validated via `zod` to guarantee perfect JSON structural integrity before reaching the frontend.
* **Zero Hardcoded IPs:** Fully abstracted network topology. Nginx reverse proxies traffic securely within the Docker network, eliminating exposed backend ports and hardcoded runtime IPs.
* **Secure Environment Management:** Total separation of codebase and configuration. API keys and host IPs are strictly managed via local `.env` files.

---

## 🏗️ Architecture

1. **Frontend:** React + Vite SPA, served by an Nginx web server.
2. **Reverse Proxy:** Nginx intercepts frontend API calls on port `80` and routes them internally to the Fastify backend via relative paths (`/api/analyze` and `/api/history`).
3. **Backend API:** Fastify (Node.js v20/TypeScript) application leveraging native runtime global `fetch` to orchestrate prompt engineering, validation, and database mapping.
4. **Database Engine:** SQLite database accessed through the Prisma 7 client equipped with the native Alpine-compiled `@prisma/adapter-better-sqlite3` driver.
5. **LLM Engine (Local Mode):** Ollama instance running open-weights models (e.g., `llama3.2:1b` or `qwen2.5:14b`) over local networks or loopback bridges.
6. **LLM Engine (Cloud Mode):** Google Generative AI SDK querying `gemini-2.5-flash` via Google AI Studio.

### 🏗️ Architectural Trade-offs

1. **Local LLM vs. Managed API (Gemini):** While Gemini offers easier immediate integration and potentially higher reasoning capabilities, a local model guarantees **100% data privacy**—a critical consideration given the strict PII redaction requirements. The trade-off is higher local infrastructure overhead.
2. **SQLite + Prisma 7 vs. Production PostgreSQL:** For an internal PII compliance ledger, spinning up a heavy standalone database container introduces massive dependency chains. Using SQLite running on a Docker volume mount gives you zero-config, single-file lightweight persistence that easily supports high-speed relational query structures via Prisma.
3. **Fastify vs. Express:** Selected Fastify for its superior async performance and strict schema validation capabilities, which are beneficial when dealing with structured JSON outputs from LLMs.
4. **Vite/React vs. Next.js:** For an internal operations dashboard, Next.js introduces unnecessary SSR complexity. A static React SPA served via Nginx in Docker provides a much smaller attack surface and lighter runtime footprint.

### 📋 AI Safety & Evaluation Considerations

* **Prompt Engineering Strictness:** The system prompt forces a raw JSON output and explicitly defines PII categories to ensure the model focuses purely on extraction and redaction.
* **Temperature Control:** Set to `0.1` to reduce hallucinations and ensure deterministic, analytical outputs.
* **Zero-Trust Display:** The frontend assumes the raw text might be dangerous and relies entirely on the `redactedContent` payload for display.
* **Future Evaluation:** In a production environment, I would implement an LLM evaluation framework (like LangSmith or Ragas) to run regression tests against a golden dataset of support tickets to measure the exact accuracy of PII redaction over time.

---

## 📋 Prerequisites

To run this application natively using Docker, you need:
* **Docker & Docker Compose:** Installed on your host machine.
* **Node.js (v20+):** For local development (optional).
* *(For Local Mode Only)*: An active **Ollama** server running on your network (or host).
* *(For Cloud Mode Only)*: A free API Key from **[Google AI Studio](https://aistudio.google.com/)**.

---

## ⚙️ Configuration & Environment Setup

This project uses a `.env` file to manage secrets and network routing securely.

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone [https://github.com/vassilsh/support-sphere-ai-](https://github.com/vassilsh/support-sphere-ai-)
   cd support-sphere-ai-
Copy the example configuration file:

Bash
cp .env.example .env
Open .env and configure your desired LLM Provider:

Option A: Local Privacy-First Mode (Ollama)

Code snippet
# Point this to your local Ollama network endpoint or bridge URL
OLLAMA_HOST=[http://192.168.1.](http://192.168.1.)XX:11434

# Tell the backend to use Ollama
LLM_PROVIDER=ollama
LLM_MODEL=llama3.2:1b

# Configuration Database URL for SQLite inside container
DATABASE_URL=file:/app/prisma/dev.db

GEMINI_API_KEY=
Option B: Cloud Scale Mode (Google Gemini)

Code snippet
OLLAMA_HOST=

# Tell the backend to route to Google AI Studio
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash

# Configuration Database URL for SQLite inside container
DATABASE_URL=file:/app/prisma/dev.db

# Insert your active API key here
GEMINI_API_KEY=AIzaSyYourActualKeyHere...
🐳 Deployment (Docker Compose)
The entire application stack is containerized with a clean multi-stage builder to eliminate host compiler contamination.

Build and start the containers in detached mode:

Bash
docker compose up --build -d
Initialize & Push the Database Schema:
Because SQLite mounts to an isolated, fresh local volume file, you must push your Prisma schema directly to the container's database layout on your first boot:

Bash
docker compose exec backend npx prisma db push --url file:/app/prisma/dev.db
Access the Application:
Open your browser and navigate to http://localhost (or the IP address of your remote Docker server host). No port flags are required; Nginx automatically intercepts and routes port 80 traffic.

View Live Backend Server Logs:
If you need to debug live LLM responses, errors, or query processing metrics:

Bash
docker compose logs backend --tail 50 -f
Stop the Application:

Bash
docker compose down
💻 Local Development Mode
If you wish to modify the React frontend components or the Fastify backend without waiting on Docker container image rebuilds:

Backend Layer:

Bash
cd backend
npm install
npx prisma generate
npm run dev
Frontend Layer:

Bash
cd frontend
npm install
npm run dev
Note: When running via Vite's local dev server (http://localhost:5173), you must configure Vite's proxy rules in vite.config.ts to forward /api requests directly to localhost:3001, as the Nginx load-balancing routing block is bypassed in local host sandboxes.
