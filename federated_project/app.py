from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

model = joblib.load("global_model.pkl")
scaler = joblib.load("scaler.pkl")

COLUMNS = [
    "Heart Rate",
    "Respiratory Rate",
    "Body Temperature",
    "Oxygen Saturation",
    "Systolic Blood Pressure",
    "Diastolic Blood Pressure",
    "Age",
    "Gender",
    "Weight (kg)",
    "Height (m)",
    "Derived_HRV",
    "Derived_Pulse_Pressure",
    "Derived_BMI",
    "Derived_MAP",
]

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "success": True,
        "message": "ML API is running"
    })

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        if not data:
            return jsonify({
                "success": False,
                "message": "No JSON data received"
            }), 400

        missing_fields = [col for col in COLUMNS if col not in data]

        if missing_fields:
            return jsonify({
                "success": False,
                "message": "Missing required fields",
                "missing_fields": missing_fields
            }), 400

        patient = pd.DataFrame([data], columns=COLUMNS)

        patient_scaled = scaler.transform(patient)

        prediction = int(model.predict(patient_scaled)[0])
        probability = float(model.predict_proba(patient_scaled)[0][1])

        return jsonify({
            "success": True,
            "prediction": prediction,
            "risk_level": "HIGH" if prediction == 1 else "LOW",
            "high_risk_probability": probability
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Prediction failed",
            "error": str(e)
        }), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)