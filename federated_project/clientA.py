"""
clientA.py — Federated Learning Client for Hospital A

Key fixes over original:
  1. No double-scaling  (data is pre-scaled in the CSV)
  2. Full-dataset training per round (not tiny random batches)
  3. Proper warm-start via partial_fit on the full training set
  4. Reports both accuracy AND F1-score to server
  5. Does NOT save global_model.pkl (server owns the global weights)
"""

import flwr as fl
import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, f1_score, log_loss
from utils import load_data, get_model_params, set_model_params

# ── Configuration ──────────────────────────────────────────────────────────────
HOSPITAL_DATA = "data/hospitalA.csv"
CLIENT_NAME   = "Hospital A"

# ── Load data ──────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = load_data(HOSPITAL_DATA)
print(f"{CLIENT_NAME} — Train: {X_train.shape}, Test: {X_test.shape}")


# ── Model ──────────────────────────────────────────────────────────────────────
# SGDClassifier with log_loss ≡ online logistic regression.
# Higher max_iter + tol for better per-round convergence.
model = SGDClassifier(
    loss="log_loss",
    penalty="l2",
    alpha=0.001,
    learning_rate="optimal",
    random_state=42,
)

# Warm-start: one initial pass so coef_ / intercept_ exist
model.partial_fit(X_train, y_train, classes=np.array([0, 1]))

# ── Flower Client ──────────────────────────────────────────────────────────────

class HospitalClient(fl.client.NumPyClient):

    def get_parameters(self, config):
        return get_model_params(model)

    def fit(self, parameters, config):
        """Receive global weights → train locally → return updated weights."""
        set_model_params(model, parameters)

        # Train on the FULL local dataset (not tiny batches)
        # partial_fit with max_iter=5 runs 5 SGD passes through the data
        for _ in range(5):
            model.partial_fit(X_train, y_train, classes=np.array([0, 1]))

        train_acc = accuracy_score(y_train, model.predict(X_train))
        print(f"  {CLIENT_NAME} — local train accuracy: {train_acc:.4f}")

        return get_model_params(model), len(X_train), {"accuracy": float(train_acc)}

    def evaluate(self, parameters, config):
        """Receive global weights → evaluate on local test set → report metrics."""
        set_model_params(model, parameters)

        y_pred      = model.predict(X_test)
        y_pred_prob = model.predict_proba(X_test)

        loss = log_loss(y_test, y_pred_prob)
        acc  = accuracy_score(y_test, y_pred)
        f1   = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        print(
            f"   {CLIENT_NAME} — "
            f"loss: {loss:.4f} | acc: {acc:.4f} | F1: {f1:.4f}"
        )

        return float(loss), len(X_test), {"accuracy": float(acc), "f1": float(f1)}


#Connect to server

if __name__ == "__main__":
    fl.client.start_numpy_client(
        server_address="localhost:8080",
        client=HospitalClient(),
    )
