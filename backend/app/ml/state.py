import pickle
from pathlib import Path

# Путь к папке с обученными моделями
MODELS_DIR = Path(__file__).parent / "trained"


class MLModels:
    """
    Хранилище ML моделей в памяти приложения.

    Модели загружаются один раз при старте через lifespan,
    и живут всё время работы сервера.

    Обучать модели здесь не нужно — только загружать готовые .pkl файлы.
    Обучение происходит отдельно (ноутбук / train.py скрипт).
    """

    def __init__(self):
        self.tfidf_vectorizer = None   # TF-IDF векторизатор
        self.knn_model = None          # KNN классификатор
        self.profession_labels = None  # Список профессий (индексы → названия)
        self._loaded = False

    async def load(self):
        """Загружает модели из файлов. Вызывается один раз в lifespan."""

        if not MODELS_DIR.exists():
            print(f"Папка с моделями не найдена: {MODELS_DIR}")
            print("   Запускаем в режиме без ML — рекомендации недоступны")
            return

        try:
            with open(MODELS_DIR / "tfidf.pkl", "rb") as f:
                self.tfidf_vectorizer = pickle.load(f)

            with open(MODELS_DIR / "knn.pkl", "rb") as f:
                self.knn_model = pickle.load(f)

            with open(MODELS_DIR / "labels.pkl", "rb") as f:
                self.profession_labels = pickle.load(f)

            self._loaded = True
            print(f"   Загружено профессий: {len(self.profession_labels)}")

        except FileNotFoundError as e:
            print(f"Файл модели не найден: {e}")
            print("   Запускаем без ML — обучите модели перед запуском")

    def clear(self):
        """Очищает модели при остановке приложения."""
        self.tfidf_vectorizer = None
        self.knn_model = None
        self.profession_labels = None
        self._loaded = False

    @property
    def is_ready(self) -> bool:
        """Проверяет, загружены ли модели."""
        return self._loaded


# Единственный экземпляр — импортируется везде где нужен
ml_models = MLModels()