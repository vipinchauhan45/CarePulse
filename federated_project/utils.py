import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

def load_data(path: str, test_size: float = 0.2, random_state: int = 42):
    df = pd.read_csv(path)

    print(f"\n Loading: {path}")
    print(f"   Shape   : {df.shape}")
    assert "label" in df.columns, (
        f"'label' column not found in {path}. "
    )

    label_counts = df["label"].value_counts().to_dict()
    print(f"   Classes : {label_counts}")

    X = df.drop("label", axis=1).values.astype(np.float64)
    y = df["label"].values.astype(int)

    return train_test_split(X, y, test_size=test_size,
                            random_state=random_state, stratify=y)

def get_model_params(model):
    return [model.coef_.copy(), model.intercept_.copy()]


def set_model_params(model, params):
    model.coef_      = params[0].copy()
    model.intercept_ = params[1].copy()
    return model
