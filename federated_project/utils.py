import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split


def load_data(path: str, test_size: float = 0.2, random_state: int = 42):
    """
    Load a hospital CSV and return train/test splits.

    The CSV is already scaled (StandardScaler applied in prepareData.ipynb).
    The last column must be named 'label' (0 = low risk, 1 = high risk).

    Returns
    -------
    X_train, X_test : np.ndarray  (float64)
    y_train, y_test : np.ndarray  (int)
    """
    df = pd.read_csv(path)

    print(f"\n Loading: {path}")
    print(f"   Shape   : {df.shape}")

    # Verify label column
    assert "label" in df.columns, (
        f"'label' column not found in {path}. "
        "Re-run prepareData.ipynb to regenerate hospital CSVs."
    )

    label_counts = df["label"].value_counts().to_dict()
    print(f"   Classes : {label_counts}")

    X = df.drop("label", axis=1).values.astype(np.float64)
    y = df["label"].values.astype(int)

    return train_test_split(X, y, test_size=test_size,
                            random_state=random_state, stratify=y)

def get_model_params(model):
    """Extract [coef_, intercept_] as list of numpy arrays."""
    return [model.coef_.copy(), model.intercept_.copy()]


def set_model_params(model, params):
    """Set model weights from aggregated global parameters."""
    model.coef_      = params[0].copy()
    model.intercept_ = params[1].copy()
    return model