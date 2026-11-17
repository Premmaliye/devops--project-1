# ⚡ Energy Monitor API

A cloud-ready Node.js REST API designed for IoT smart meter telemetry and DevOps learning (Docker, CI/CD, Terraform, AWS ECR/EKS, Prometheus/Grafana).

---

## 🚀 Features

- **Standard IoT Meter Telemetry:** Ingestion for voltage (V), current (A), active power (kW), and cumulative energy (kWh).
- **Consumption Analytics:** Real-time system-wide aggregation, average/peak power metrics, and per-meter breakdown.
- **Cloud-Native Health Probes:** `/health` endpoint returning system uptime and memory metrics, optimized for Kubernetes liveness & readiness probes.
- **Graceful Shutdown:** Implements `SIGTERM`/`SIGINT` handling for zero-downtime container termination.
- **IoT Simulator:** Built-in background generator simulating multi-meter data streaming at 5-second intervals.
- **Automated Test Suite:** Comprehensive unit & integration tests using Jest and Supertest.

---

## 🛠️ Project Structure

```
.
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore configuration
├── package.json              # Dependencies and scripts
├── scripts/
│   └── simulate-iot.js       # Background IoT meter telemetry generator
├── src/
│   ├── app.js                # Express app configuration & middleware
│   ├── server.js             # HTTP listener with graceful shutdown
│   ├── controllers/
│   │   ├── analytics.controller.js
│   │   ├── info.controller.js
│   │   ├── meter.controller.js
│   │   └── reading.controller.js
│   ├── data/
│   │   └── store.js          # In-memory store (prepares interface for PostgreSQL)
│   └── routes/
│       ├── analytics.routes.js
│       ├── index.js
│       ├── meter.routes.js
│       └── reading.routes.js
└── tests/
    ├── analytics.test.js
    ├── app.test.js
    ├── meters.test.js
    └── readings.test.js
```

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Application overview & route catalog |
| `GET` | `/health` | Cloud health check (uptime, memory, status) |
| `GET` | `/api/meters` | List all registered meters |
| `GET` | `/api/meters/:id` | Fetch specific meter by ID |
| `POST` | `/api/meters` | Register a new meter |
| `GET` | `/api/readings` | Retrieve readings (filters: `meter_id`, `limit`, `start_time`, `end_time`) |
| `POST` | `/api/readings` | Submit new telemetry reading |
| `GET` | `/api/analytics` | Aggregate consumption and peak metrics |

### Example Reading Payload (`POST /api/readings`):

```json
{
  "meter_id": 20301,
  "meter_name": "Main Feeder Meter 1",
  "voltage": 415.0,
  "current": 12.5,
  "power_kw": 8.5,
  "energy_kwh": 1250.6,
  "timestamp": "2026-11-17T10:30:00Z"
}
```

---

## 🧪 Quickstart & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Start Development Server
```bash
npm run dev
# or npm start
```

### 4. Run IoT Meter Simulator
In a separate terminal while the server is running:
```bash
npm run simulate
```

---

## 🗺️ Next DevOps Roadmap Stages

- [x] **Phase 1:** Core REST API & automated tests
- [ ] **Phase 2:** Multi-stage Dockerfile and local containerization
- [ ] **Phase 3:** PostgreSQL integration with `docker-compose`
- [ ] **Phase 4:** MQTT Broker integration (Mosquitto / EMQX)
- [ ] **Phase 5:** GitHub Actions CI/CD pipeline (lint, test, build, push to AWS ECR)
- [ ] **Phase 6:** AWS Infrastructure with Terraform (VPC, ECR, EKS cluster)
- [ ] **Phase 7:** Kubernetes Deployment, Helm charts, and Prometheus/Grafana monitoring

