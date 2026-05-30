
# Support Sphere AI - PII Redaction & Analysis API

Support Sphere AI is a privacy-first, hybrid-cloud customer support ticket analyzer. It ingests raw customer tickets, identifies and strips Personally Identifiable Information (PII) using advanced Large Language Models, and returns a strictly formatted JSON payload containing a concise summary, customer sentiment, and the fully redacted text.

This application features a **Provider Abstraction Layer**, allowing it to run entirely air-gapped on local infrastructure using open-weight models (like Qwen 2.5), or seamlessly scale via Google's Gemini Cloud APIs without changing a single line of application logic.

## 🚀 Key Features

* **Hybrid-Cloud LLM Routing:** Switch between self-hosted Local LLMs (Ollama) and Managed Cloud APIs (Google Gemini) instantly via environment variables.
* **Strict Schema Enforcement:** LLM outputs are defensively intercepted and validated via `zod` to guarantee perfect JSON structural integrity before reaching the frontend.
* **Zero Hardcoded IPs:** Fully abstracted network topology. Nginx reverse proxies traffic securely within the Docker network, eliminating exposed backend ports and hardcoded runtime IPs.
* **Secure Environment Management:** Total separation of codebase and configuration. API keys and host IPs are strictly managed via local `.env` files.

---

## 🏗️ Architecture

1. **Frontend:** React + Vite SPA, served by an Nginx web server.
2. **Reverse Proxy:** Nginx intercepts frontend API calls on port `80` and routes them internally to the backend.
3. **Backend API:** Fastify (Node.js/TypeScript) application that orchestrates prompt engineering and Zod schema validation.
4. **LLM Engine (Local Mode):** Ollama instance running `qwen2.5:14b` on an isolated LXC container.
5. **LLM Engine (Cloud Mode):** Google Generative AI SDK querying `gemini-2.5-flash` via Google AI Studio.

### 🏗️ Architectural Trade-offs

1.  **Local LLM vs. Managed API (Gemini):** While Gemini offers easier immediate integration and potentially higher reasoning capabilities, a local model guarantees **100% data privacy**—a critical consideration given the strict PII redaction requirements. The trade-off is higher local infrastructure overhead (requiring a dedicated VM/LXC).
2.  **Fastify vs. Express:** Selected Fastify for its superior async performance and strict schema validation capabilities, which are beneficial when dealing with structured JSON outputs from LLMs.
3.  **Vite/React vs. Next.js:** For a simple internal dashboard, Next.js introduces unnecessary SSR complexity. A static React SPA served via Nginx in Docker provides a much smaller attack surface and lighter footprint.

### 📋 AI Safety & Evaluation Considerations

* **Prompt Engineering Strictness:** The system prompt forces a raw JSON output and explicitly defines PII categories to ensure the model focuses purely on extraction and redaction.
* **Temperature Control:** Set to `0.1` to reduce hallucinations and ensure deterministic, analytical outputs.
* **Zero-Trust Display:** The frontend assumes the raw text might be dangerous and relies entirely on the `redactedTicket` payload for display.
* **Future Evaluation:** In a production environment, I would implement an LLM evaluation framework (like LangSmith or Ragas) to run regression tests against a golden dataset of support tickets to measure the exact accuracy of PII redaction over time.


---

## 📋 Prerequisites

To run this application natively using Docker, you need:
* **Docker & Docker Compose:** Installed on your host machine.
* **Node.js (v20+):** For local development (optional).
* *(For Local Mode Only)*: An active **Ollama** server running on your network (or localhost).
* *(For Cloud Mode Only)*: A free API Key from **[Google AI Studio](https://aistudio.google.com/)**.

---
### Running the Application
1. Clone the repository:
   ```bash
   git clone https://github.com/vassilsh/support-sphere-ai-


## ⚙️ Configuration & Environment Setup


This project uses a `.env` file to manage secrets and network routing securely. 

1. Copy the example configuration file:
   ```bash
   cp .env.example .env

```

2. Open `.env` and configure your desired LLM Provider:
**Option A: Local Privacy-First Mode (Ollama)**
```env
# Point this to your local Ollama IP
OLLAMA_HOST=[http://192.168.1.](http://192.168.1.)XX:11434 

# Tell the backend to use Ollama
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:14b

GEMINI_API_KEY=

```


**Option B: Cloud Scale Mode (Google Gemini)**
```env
OLLAMA_HOST=

# Tell the backend to route to Google AI Studio
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.5-flash 

# Insert your active API key here
GEMINI_API_KEY=AIzaSyYourActualKeyHere...

```



---

## 🐳 Deployment (Docker Compose)

The entire application stack is containerized for zero-dependency deployments.

1. **Build and start the containers in detached mode:**
```bash
docker compose up --build -d

```


2. **Access the Application:**
Open your browser and navigate to `http://localhost` (or the IP address of the machine hosting Docker). You do not need to specify a port, as Nginx handles port 80 traffic automatically.
3. **View Backend Server Logs:**
If you need to debug LLM validation errors or network timeouts:
```bash
docker compose logs backend --tail 50 -f

```


4. **Stop the Application:**
```bash
docker compose down

```



---

## 💻 Local Development Mode

If you wish to modify the React frontend or Fastify backend without rebuilding Docker containers:

1. **Backend:**
```bash
cd backend
npm install
npm run dev

```


*(Ensure your `.env` variables are exported to your local shell or use a package like `dotenv` in dev mode).*
2. **Frontend:**
```bash
cd frontend
npm install
npm run dev

```


*Note: When running via Vite's local dev server (`http://localhost:5173`), you must configure Vite's proxy rules in `vite.config.ts` to forward `/api` requests to `localhost:3001`, as the Nginx proxy is bypassed.*

