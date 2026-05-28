from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)
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


@app.route("/predict", methods=["POST"])
def predict():

    data = request.json
    patient = pd.DataFrame([data], columns=COLUMNS)
    patient_scaled = scaler.transform(patient)
    prediction = int(model.predict(patient_scaled)[0])
    probability = float(model.predict_proba(patient_scaled)[0][1])

    return jsonify({
        "prediction": prediction,
        "high_risk_probability": probability
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)
