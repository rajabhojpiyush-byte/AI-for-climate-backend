# ResQAI — AI Disaster & Climate Emergency Response Platform

ResQAI is an intelligent emergency reporting and situational triage system. It leverages multi-modal AI to intake citizen disaster reports, classify hazard types and severity, detect duplicates, and organize command center responses in real time.

---

## 🛠️ Prerequisites

Before running the project, make sure you have installed:
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher (with `npm`)

---

## 🚀 Quick Setup & Installation

### 1. Backend Setup (FastAPI + AI Engine)

Open a terminal in the root directory:

```bash
# 1. Create a virtual environment
python -m venv venv

# 2. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS / Linux:
source venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. (Optional) Set up Environment Variables
# Create a .env file in the root directory if using Nugen AI:
# NUGEN_API_KEY=your_api_key_here
# NUGEN_MODEL_ID=your_model_id_here
# NUGEN_ENDPOINT=https://api.nugen.ai/v1/chat/completions

# 5. Start the backend server
uvicorn main:app --reload --port 8000
```

- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Frontend Setup (React + Vite + Tailwind CSS)

Open a second terminal:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install all npm dependencies
npm install

# 3. Launch the development server
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)

---

## 📦 Tech Stack & Packages

### Backend (`requirements.txt`)
- **FastAPI**: REST API framework
- **Uvicorn**: ASGI web server
- **SQLAlchemy**: SQLite ORM database management
- **Pydantic**: Request/response validation schemas
- **python-multipart**: Image file upload handling
- **requests & python-dotenv**: External AI API client and environment configuration

### Frontend (`frontend/package.json`)
- **React 19**: Component UI architecture
- **Vite**: Ultra-fast build tool and dev server
- **Tailwind CSS v4**: Modern styling
- **React Router DOM v7**: Page routing & navigation
- **Leaflet**: Interactive map rendering for incident locations
- **Lucide React**: Iconography system

---

## 🗺️ System Architecture & Workflow

```
[ Citizen Report ] (Description + Photo + GPS)
       │
       ▼
[ FastAPI Backend ] ───► [ Nugen AI Service ]
       │                        │
       ▼                        ▼
[ SQLite DB (disaster.db) ] ◄── AI Category, Severity, Priority
       │
       ▼
[ Authority Dashboard ] (RealMap + Triage + Live Feed)
```
