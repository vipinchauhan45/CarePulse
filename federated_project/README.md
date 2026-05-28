# Federated Learning ICU Monitoring System

This module integrates a Federated Learning based ICU risk prediction model with the CarePulse backend system.

## Features

* ICU high-risk prediction
* Federated learning architecture
* Flask ML API
* Integration with Node.js backend
* Real-time risk alerts

---

## Project Structure

federated_project/

* app.py
* predict.py
* server.py
* clientA.py
* clientB.py
* clientC.py
* global_model.pkl
* scaler.pkl
* requirements.txt

---

## Run Flask API

```bash
python app.py
```

Runs on:
http://localhost:5000

---

## Run Backend

```bash
cd backend
npm run dev
```

Runs on:
http://localhost:8090

---

## Prediction Endpoint

POST:

```bash
/vitals/predict
```

---

## Install Required Packages

```bash
pip install -r requirements.txt
```

---

## Sample Prediction Output

```json
{
  "success": true,
  "prediction": {
    "prediction": 1,
    "high_risk_probability": 0.64
  }
}
```

prediction = 1 → High Risk
prediction = 0 → Low Risk

