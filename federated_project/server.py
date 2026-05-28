import flwr as fl
import numpy as np
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

def weighted_average(metrics):
    """Weighted average of accuracy across clients."""
    total_examples = sum(n for n, _ in metrics)
    agg_accuracy   = sum(n * m["accuracy"] for n, m in metrics) / total_examples
    agg_f1         = sum(n * m.get("f1", 0) for n, m in metrics) / total_examples

    print(
        f"\n  Global Accuracy : {agg_accuracy:.4f}"
        f"  |  Weighted F1 : {agg_f1:.4f}"
        f"  |  Clients: {len(metrics)}"
    )
    return {"accuracy": agg_accuracy, "f1": agg_f1}

import joblib

class SaveModelStrategy(fl.server.strategy.FedAvg):

    def aggregate_fit(self, server_round, results, failures):
        aggregated_parameters, aggregated_metrics = super().aggregate_fit(
            server_round, results, failures
        )

        if aggregated_parameters is not None:
            weights = fl.common.parameters_to_ndarrays(aggregated_parameters)
            joblib.dump(weights, "global_weights.pkl")

            print(f"Round {server_round}: weights saved")

        return aggregated_parameters, aggregated_metrics


strategy = SaveModelStrategy(
    fraction_fit=1.0,           
    fraction_evaluate=1.0,
    min_fit_clients=3,
    min_evaluate_clients=3,
    min_available_clients=3,
    fit_metrics_aggregation_fn=weighted_average,
    evaluate_metrics_aggregation_fn=weighted_average,
)

if __name__ == "__main__":
    print("Starting Federated Learning Server")
    print("   Rounds : 20  |  Clients expected : 3\n")

    fl.server.start_server(
        server_address="localhost:8080",
        config=fl.server.ServerConfig(num_rounds=20),
        strategy=strategy,
    )
