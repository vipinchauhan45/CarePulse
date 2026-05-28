import joblib
import numpy as np
import pandas as pd

model  = joblib.load("global_model.pkl")
scaler = joblib.load("scaler.pkl")

COLUMNS = [
    "Heart Rate", "Respiratory Rate", "Body Temperature",
    "Oxygen Saturation", "Systolic Blood Pressure",
    "Diastolic Blood Pressure", "Age", "Gender",
    "Weight (kg)", "Height (m)",
    "Derived_HRV", "Derived_Pulse_Pressure",
    "Derived_BMI", "Derived_MAP",
]

def build_patient_row(hr, rr, bt, spo2, sbp, dbp, age, gender, weight, height):
    pp  = sbp - dbp                 
    bmi = weight / (height ** 2)     
    hrv = 1000 / hr if hr > 0 else 0 
    map_ = dbp + (pp / 3)            

    return {
        "Heart Rate": hr, "Respiratory Rate": rr,
        "Body Temperature": bt, "Oxygen Saturation": spo2,
        "Systolic Blood Pressure": sbp, "Diastolic Blood Pressure": dbp,
        "Age": age, "Gender": gender,
        "Weight (kg)": weight, "Height (m)": height,
        "Derived_HRV": hrv, "Derived_Pulse_Pressure": pp,
        "Derived_BMI": bmi, "Derived_MAP": map_,
    }

raw_patients = [
    build_patient_row(hr=70,  rr=16, bt=36.5, spo2=99, sbp=110, dbp=70,
                      age=25, gender=0, weight=60,  height=1.65),
    build_patient_row(hr=90,  rr=20, bt=37.5, spo2=95, sbp=130, dbp=85,
                      age=45, gender=1, weight=75,  height=1.70),
    build_patient_row(hr=120, rr=30, bt=39.5, spo2=85, sbp=180, dbp=110,
                      age=75, gender=1, weight=90,  height=1.75),
]

patients_df = pd.DataFrame(raw_patients, columns=COLUMNS)

patients_scaled = scaler.transform(patients_df)

predictions    = model.predict(patients_scaled)
probabilities  = model.predict_proba(patients_scaled)
decision_vals  = model.decision_function(patients_scaled)

print("\n" + "=" * 55)
print("  ICU PATIENT RISK PREDICTION  (Federated Global Model)")
print("=" * 55)

for i, (pred, prob, dv) in enumerate(
        zip(predictions, probabilities, decision_vals), start=1):

    label      = "HIGH RISK" if pred == 1 else "Low Risk"
    confidence = max(prob) * 100

    print(f"\n  Patient {i}")
    print(f"    Prediction  : {label}")
    print(f"    Probability → Low Risk: {prob[0]:.2%}  |  High Risk: {prob[1]:.2%}")
    print(f"    Confidence  : {confidence:.1f}%")
    print(f"    Decision val: {dv:.4f}")

print("\n" + "=" * 55)
