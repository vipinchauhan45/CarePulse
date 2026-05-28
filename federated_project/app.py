from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load trained model and scaler ONCE
model = joblib.load("global_model.pkl")
scaler = joblib.load("scaler.pkl")

# Feature order must EXACTLY match training
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

    # Convert incoming JSON to dataframe
    patient = pd.DataFrame([data], columns=COLUMNS)

    # Scale input
    patient_scaled = scaler.transform(patient)

    # Predict
    prediction = int(model.predict(patient_scaled)[0])

    # Probability of HIGH RISK
    probability = float(model.predict_proba(patient_scaled)[0][1])

    return jsonify({
        "prediction": prediction,
        "high_risk_probability": probability
    })


if __name__ == "__main__":
    app.run(port=5000, debug=True)