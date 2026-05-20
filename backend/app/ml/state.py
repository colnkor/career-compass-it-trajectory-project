from pathlib import Path
from app.ml.recommender import CareerRecommender

MODELS_DIR = Path(__file__).parent / "trained"
RECOMMENDER_PATH = MODELS_DIR / "recommender.pkl"


class MLModels:
    """
    Хранилище ML моделей в памяти приложения.
    Не знает как работает пайплайн — только загружает и отдаёт.
    """

    def __init__(self):
        self.recommender: CareerRecommender | None = None
        self._loaded = False

    async def load(self):
        if not RECOMMENDER_PATH.exists():
            print(f"Файл модели не найден: {RECOMMENDER_PATH}")
            print("   Обучи модель в Colab и положи recommender.pkl в app/ml/trained/")
            return

        self.recommender = CareerRecommender.load(str(RECOMMENDER_PATH))
        self._loaded = True

    def clear(self):
        self.recommender = None
        self._loaded = False

    @property
    def is_ready(self) -> bool:
        return self._loaded


ml_models = MLModels()