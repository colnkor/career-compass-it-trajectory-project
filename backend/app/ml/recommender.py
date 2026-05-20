import pickle
from dataclasses import dataclass
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors


@dataclass
class RecommendationResult:
    """Результат работы пайплайна."""
    status: str                    # "accepted" | "rejected"
    reason: str | None             # причина отклонения если rejected
    professions: list[dict]        # топ-3 профессии с confidence


class CareerRecommender:
    """
    Пайплайн рекомендаций профессий.

    Инкапсулирует всю логику — приложению не важно что внутри.
    Обучается в Colab, сохраняется как .pkl, загружается в FastAPI.

    Пример использования:
        recommender = CareerRecommender()
        recommender.fit(texts, labels)
        recommender.save("recommender.pkl")

        # В FastAPI:
        recommender = CareerRecommender.load("recommender.pkl")
        result = recommender.get_result("люблю анализировать данные")
    """

    SIMILARITY_THRESHOLD = 0.80   # ниже этого порога — "слишком расплывчато"
    NOISE_LABEL = "Noise"

    def __init__(
        self,
        model_name: str = "sergeyzh/rubert-tiny-turbo",
        n_neighbors: int = 3,
    ):
        self.model_name = model_name
        self.n_neighbors = n_neighbors

        self._encoder = SentenceTransformer(model_name)
        self._knn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine")
        self._labels: list[str] = []
        self._fitted = False

    # ------------------------------------------------------------------
    # Обучение — вызывается в Colab, не в FastAPI
    # ------------------------------------------------------------------

    def fit(self, texts: list[str], labels: list[str]) -> "CareerRecommender":
        """
        Обучает пайплайн на текстах и метках профессий.

        Args:
            texts:  список описаний / тегов профессий
            labels: список меток (название профессии или "Noise")
        """
        self._labels = labels
        embeddings = self._encoder.encode(texts, show_progress_bar=True)
        self._knn.fit(embeddings)
        self._fitted = True
        return self

    # ------------------------------------------------------------------
    # Инференс — вызывается в FastAPI
    # ------------------------------------------------------------------

    def get_result(self, user_text: str) -> RecommendationResult:
        """
        Главный метод — принимает текст пользователя, возвращает результат.

        Args:
            user_text: свободный текст из опросника

        Returns:
            RecommendationResult со статусом и списком профессий
        """
        if not self._fitted:
            raise RuntimeError("Модель не обучена. Вызови fit() или load().")

        # Векторизуем запрос пользователя
        query_embedding = self._encoder.encode([user_text])

        # Ищем ближайших соседей
        distances, indices = self._knn.kneighbors(query_embedding)

        best_similarity = 1 - distances[0][0]
        closest_label = self._labels[indices[0][0]]

        # Фильтр 1: шум
        if closest_label == self.NOISE_LABEL:
            return RecommendationResult(
                status="rejected",
                reason="Текст не похож на описание IT-интересов. Попробуй написать подробнее.",
                professions=[],
            )

        # Фильтр 2: слишком расплывчато
        if best_similarity < self.SIMILARITY_THRESHOLD:
            return RecommendationResult(
                status="rejected",
                reason=f"Описание слишком расплывчатое (confidence: {best_similarity:.0%}). Добавь больше деталей.",
                professions=[],
            )

        # Собираем топ-3 результата
        professions = []
        for i in range(self.n_neighbors):
            idx = indices[0][i]
            label = self._labels[idx]

            if label == self.NOISE_LABEL:
                continue

            professions.append({
                "name": label,
                "confidence": round(float(1 - distances[0][i]), 3),
            })

        return RecommendationResult(
            status="accepted",
            reason=None,
            professions=professions,
        )

    # ------------------------------------------------------------------
    # Сериализация — сохранение и загрузка
    # ------------------------------------------------------------------

    def save(self, path: str) -> None:
        """Сохраняет весь пайплайн в один .pkl файл."""
        with open(path, "wb") as f:
            pickle.dump(self, f)
        print(f"Пайплайн сохранён: {path}")

    @classmethod
    def load(cls, path: str) -> "CareerRecommender":
        """Загружает пайплайн из .pkl файла."""
        with open(path, "rb") as f:
            instance = pickle.load(f)
        print(f"Пайплайн загружен: {path} ({len(instance._labels)} меток)")
        return instance