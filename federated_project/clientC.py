
import flwr as fl
import numpy as np
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, f1_score, log_loss
from utils import load_data, get_model_params, set_model_params

HOSPITAL_DATA = "data/hospitalC.csv"
CLIENT_NAME   = "Hospital C"

X_train, X_test, y_train, y_test = load_data(HOSPITAL_DATA)
print(f" {CLIENT_NAME} — Train: {X_train.shape}, Test: {X_test.shape}")

model = SGDClassifier(
    loss="log_loss",
    penalty="l2",
    alpha=0.001,
    learning_rate="optimal",
    random_state=42,
)
model.partial_fit(X_train, y_train, classes=np.array([0, 1]))


class HospitalClient(fl.client.NumPyClient):

    def get_parameters(self, config):
        return get_model_params(model)

    def fit(self, parameters, config):
        set_model_params(model, parameters)

        for _ in range(5):
            model.partial_fit(X_train, y_train, classes=np.array([0, 1]))

        train_acc = accuracy_score(y_train, model.predict(X_train))
        print(f"   {CLIENT_NAME} — local train accuracy: {train_acc:.4f}")

        return get_model_params(model), len(X_train), {"accuracy": float(train_acc)}

    def evaluate(self, parameters, config):
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


if __name__ == "__main__":
    fl.client.start_numpy_client(
        server_address="localhost:8080",
        client=HospitalClient(),
    )