# CarePulse

A real-time ICU patient monitoring platform that enables healthcare professionals to continuously monitor patient vital signs, receive instant alerts for abnormal conditions, and leverage machine learning–based risk prediction for proactive medical intervention.

## Overview

CarePulse is designed to improve patient monitoring in intensive care environments by integrating real-time data streaming, automated alert generation, historical data storage, and machine learning–based risk assessment into a unified platform.

The system allows doctors and nurses to monitor assigned patients remotely, receive critical alerts, and make informed decisions based on continuously updated patient health information.

---

## Key Features

### Real-Time Patient Monitoring

* Live vital sign streaming using WebSockets
* Real-time dashboard updates
* Continuous ICU patient monitoring
* Multi-user monitoring support

### Vital Signs Tracking

The platform continuously tracks:

* Heart Rate
* Respiratory Rate
* Blood Pressure
* Mean Arterial Pressure (MAP)
* Oxygen Saturation (SpO₂)
* Body Temperature
* End-Tidal CO₂
* FiO₂
* Tidal Volume
* Central Venous Pressure (CVP)
* ECG Waveform Data

### Alert Management System

* Automatic abnormal vital detection
* High and Critical severity alerts
* Real-time alert notifications
* Alert recovery detection
* Active alert persistence after server restart
* Alert cooldown mechanism to prevent duplicate notifications

### Machine Learning Risk Prediction

* Federated Learning–based prediction model
* Future patient risk assessment
* Risk level classification (LOW / HIGH)
* High-risk probability estimation
* Real-time ML prediction display on dashboard
* ML-based alert notifications

### Email Notification System

* Automated abnormal vital alerts
* High-risk prediction alerts
* Notifications sent to assigned medical staff
* Email distribution using Nodemailer

### Patient Management

* Create and manage patient records
* Assign doctors and nurses
* Maintain patient medical history
* Store patient demographic information

### Authentication & Authorization

* JWT-based authentication
* Role-based access control
* Secure user sessions
* Separate dashboards for Admin, Doctors, and Nurses

---

## System Architecture

```text
ICU Monitoring Device
          │
          ▼
     WebSocket Server
          │
          ▼
   Application Server
          │
 ┌────────┼─────────┬───────────┐
 ▼        ▼         ▼           ▼
MongoDB  Alert    Email      ML Service
Database Engine   Service    (Flask)
 │                            │
 │                            ▼
 │                    Risk Prediction
 │
 ▼
Real-Time Distribution
          │
          ▼
Doctor / Nurse Dashboard
          │
          ▼
Live Monitoring & Alerts
```

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* React Router
* React Query
* Recharts
* Tailwind CSS
* Shadcn UI
* Axios
* React Hook Form
* Zod

### Backend

* Node.js
* Express.js
* TypeScript
* WebSocket (ws)
* MongoDB
* Mongoose
* JWT Authentication
* Nodemailer

### Machine Learning

* Python
* Flask
* Scikit-Learn
* Federated Learning
* Joblib

---

## Project Structure

```text
CarePulse/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── test/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schema/
│   │   ├── utils/
│   │   ├── websocket/
│   │   ├── app.ts
│   │   └── server.ts
│
├── federated_project/
│   ├── app.py
│   ├── server.py
│   ├── clientA.py
│   ├── clientB.py
│   ├── clientC.py
│   ├── predict.py
│   ├── global_model.pkl
│   ├── global_weights.pkl
│   ├── scaler.pkl
│   └── requirements.txt
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd CarePulse
```

### Backend Setup

```bash
cd backend

npm install

npm run dev
```

Backend runs on:

```text
http://localhost:8090
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

### Machine Learning Service Setup

```bash
cd federated_project

pip install -r requirements.txt

python app.py
```

ML Service runs on:

```text
http://localhost:5000
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

```env
MONGODB_URI=<your_mongodb_connection_string>

PORT=8090
WS_PORT=8070

JWT_SECRET=<your_jwt_secret>

ALERT_EMAIL_USER=<gmail_address>
ALERT_EMAIL_PASS=<gmail_app_password>

NUM=5
```

---

## Machine Learning Prediction

### Sample Response

```json
{
  "prediction": 1,
  "risk_level": "HIGH",
  "high_risk_probability": 0.9995,
  "success": true
}
```

### Prediction Labels

| Prediction | Meaning   |
| ---------- | --------- |
| 0          | Low Risk  |
| 1          | High Risk |

---

## Contributors

Developed as a team project by students of NIT Jalandhar.

---

## License

This project is intended for educational, research, and healthcare monitoring purposes.
