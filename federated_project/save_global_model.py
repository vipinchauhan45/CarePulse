import numpy as np
import joblib
import pandas as pd
from sklearn.metrics import confusion_matrix
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report
from utils import load_data


def build_global_model() -> SGDClassifier:
    """Load saved weights and inject them into a fresh SGDClassifier."""
    print("Loading global_weights.npy")
    weights = joblib.load("global_weights.pkl")

    coef_      = weights[0]   # shape: (1, n_features)
    intercept_ = weights[1]   # shape: (1,)

    # Build a dummy model with the right architecture
    # We need coef_ / intercept_ shapes → partial_fit once then overwrite
    # Use hospitalA just to get class info
    X_train, X_test, y_train, y_test = load_data("data/hospitalA.csv")

    model = SGDClassifier(
        loss="log_loss",
        penalty="l2",
        alpha=0.001,
        learning_rate="optimal",
        random_state=42,
    )
    model.partial_fit(X_train[:10], y_train[:10], classes=np.array([0, 1]))

    # Overwrite with global weights
    model.coef_      = coef_
    model.intercept_ = intercept_

    print(f"   coef_ shape      : {coef_.shape}")
    print(f"   intercept_ shape : {intercept_.shape}")
    return model


def evaluate_global_model(model: SGDClassifier):
    """Quick sanity check across all 3 hospital test sets."""
    print("\n Global Model Evaluation across all hospitals:\n")

    all_y_true, all_y_pred = [], []

    for hospital, path in [
        ("Hospital A", "data/hospitalA.csv"),
        ("Hospital B", "data/hospitalB.csv"),
        ("Hospital C", "data/hospitalC.csv"),
    ]:
        _, X_test, _, y_test = load_data(path)
        y_pred = model.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        f1  = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        print(f"  {hospital} → Accuracy: {acc:.4f}  |  F1: {f1:.4f}")
        all_y_true.extend(y_test)
        all_y_pred.extend(y_pred)

    print("\n  Overall Classification Report:")
    print(classification_report(all_y_true, all_y_pred,
                                target_names=["Low Risk", "High Risk"]))

    print("\nConfusion Matrix : \n", confusion_matrix(all_y_true, all_y_pred))
    
if __name__ == "__main__":
    model = build_global_model()
    evaluate_global_model(model)

    joblib.dump(model, "global_model.pkl")
    print("global_model.pkl saved")
    
