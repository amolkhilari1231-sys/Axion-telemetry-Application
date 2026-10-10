# Axion Telemetry Query & Dashboard Service

RESTful API and Dashboard Service for monitoring real-time condition metrics, asset health, anomalous devices, and factory telemetry.

---

## 🛠️ Tech Stack

- **Backend Framework:** FastAPI (Python 3.9+)
- **Server:** Uvicorn
- **Database:** PostgreSQL / TimescaleDB (Async drivers using `asyncpg`)
- **Frontend Framework:** React 19 + Vite + Recharts + Lucide Icons
- **Containerization:** Docker

---

## 📂 Project Structure

```text
├── config.py            # Environment & app configurations
├── database.py          # PostgreSQL/TimescaleDB connection pool & queries
├── main.py              # FastAPI application & API endpoints
├── Dockerfile           # Docker container definition
├── requirements.txt     # Python backend dependencies
├── README.md            # Project documentation
└── frontend/            # React + Vite frontend application
    ├── src/             # Components, pages & asset visualizations
    ├── package.json     # Frontend dependencies & npm scripts
    └── vite.config.js   # Vite configuration
```

---

## ⚙️ Environment Configuration

The application reads configuration from environment variables defined in `config.py`:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL/TimescaleDB connection string | `postgresql://postgres:Admin%40123@localhost:5432/postgres` |
| `PORT` | Backend API server port | `8000` |

> **Note:** For special characters in passwords (like `@`), make sure to URL-encode them (`@` becomes `%40`).

---

## 🚀 Getting Started

### 1. Prerequisites

- **Python:** 3.9 or higher installed
- **Node.js:** v18 or higher & npm installed
- **PostgreSQL / TimescaleDB:** Database running and accessible

---

### 2. Backend Setup & Running

#### Option A: Local Run (Virtual Environment)

1. **Navigate to the project directory:**
   ```bash
   cd Axion-telemetry-query-service-main
   ```

2. **Create a virtual environment:**
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell / Command Prompt):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Environment Variables (Optional / Required for DB connection):**
   - **Linux / macOS:**
     ```bash
     export DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
     export PORT=8000
     ```
   - **Windows (PowerShell):**
     ```powershell
     $env:DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
     $env:PORT="8000"
     ```
   - **Windows (CMD):**
     ```cmd
     set DATABASE_URL=postgresql://username:password@localhost:5432/dbname
     set PORT=8000
     ```

5. **Run the FastAPI server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Alternatively:*
   ```bash
   python main.py
   ```

---

#### Option B: Running with Docker

1. **Build Docker Image:**
   ```bash
   docker build -t axion-telemetry-service .
   ```

2. **Run Docker Container:**
   ```bash
   docker run -d -p 8000:8000 -e DATABASE_URL="postgresql://postgres:Admin%40123@host.docker.internal:5432/postgres" --name axion-backend axion-telemetry-service
   ```

---

### 3. Frontend Setup & Running

1. **Navigate to the `frontend` directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The frontend will run locally (typically at `http://localhost:5173`).

4. **Build Frontend for Production:**
   ```bash
   npm run build
   ```

---

## 📡 API Endpoints

Once backend is running on `http://localhost:8000` (or your VM IP), you can access:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard/summary` | Overall dashboard metrics & online asset count |
| `GET` | `/devices` | List of all monitored devices & current status |
| `GET` | `/devices/{device_id}/latest` | Latest telemetry entry for a specific device |
| `GET` | `/devices/{device_id}/trends?hours=1` | Historical telemetry trends for a device |
| `GET` | `/devices/top-anomalous` | List of devices with anomalous health scores |
| `GET` | `/dashboard/throughput` | Operational throughput data |
| `GET` | `/dashboard/regions` | Regional telemetry summary |
| `GET` | `/factories` | List of all factory facilities |
| `GET` | `/factories/{factory_id}/lines` | Production lines under a given factory |
| `GET` | `/production-lines/{line_id}/machines` | Machines under a specific production line |
| `GET` | `/moisture-tests` | Moisture analysis test records |

---

## 📖 API Documentation & Testing

FastAPI automatically generates interactive documentation:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

