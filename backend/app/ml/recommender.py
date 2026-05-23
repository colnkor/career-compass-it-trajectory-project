import pickle
from dataclasses import dataclass
from sentence_transformers import SentenceTransformer
from sklearn.neighbors import NearestNeighbors


@dataclass
class RecommendationResult:
    """Результат работы пайплайна."""
    status: str                 # "accepted" | "rejected"
    reason: str | None          # причина отклонения еслu rejected
    professions: list[dict]     # топ-3 профессии с confidence


class CareerRecommender:
    """
    Пайплайн рекомендаций профессий.

    Содержит два независимых KNN-индекса:
      - _knn        — текстовый, обучается на описаниях/тегах профессий
      - _trait_knn  — трейтовый, обучается на эталонных векторах ответов

    Итоговый confidence = text_weight * text_sim + trait_weight * trait_sim.
    Если трейты не переданы (пользователь не ответил на закрытые вопросы)
    или trait_knn не обучен — используется только текстовый скор.

    Обучение (Colab):
        recommender = CareerRecommender()
        recommender.fit(texts, labels)
        recommender.fit_traits(trait_matrix, labels, trait_vocab)
        recommender.save("payload.pkl")

    Инференс (FastAPI):
        recommender = CareerRecommender.load("payload.pkl")
        result = recommender.get_result(user_text, trait_scores={"analytical": 0.8, ...})
    """

    SIMILARITY_THRESHOLD = 0.80
    NOISE_LABEL = "Noise"

    def __init__(
        self,
        model_name: str = "sergeyzh/rubert-tiny-turbo",
        n_neighbors: int = 3,
        text_weight: float = 0.6,
    ):
        self.model_name = model_name
        self.n_neighbors = n_neighbors
        self.text_weight = text_weight
        self.trait_weight = 1.0 - text_weight

        self._encoder = SentenceTransformer(model_name)

        # Текстовый KNN
        self._knn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine")
        self._labels: list[str] = []
        self._fitted = False

        # Трейтовый KNN
        self._trait_knn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine")
        self._trait_labels: list[str] = []
        self._trait_vocab: list[str] = []   # упорядоченный список трейтов — словарь
        self._trait_fitted = False

    # ------------------------------------------------------------------
    # Обучение
    # ------------------------------------------------------------------

    def fit(self, texts: list[str], labels: list[str]) -> "CareerRecommender":
        """
        Обучает текстовый KNN на описаниях/тегах профессий.

        Args:
            texts:  список текстовых описаний (по одному на каждый семпл)
            labels: список меток (название профессии или "Noise")
        """
        self._labels = labels
        embeddings = self._encoder.encode(texts, show_progress_bar=True)
        self._knn.fit(embeddings)
        self._fitted = True
        return self

    def fit_traits(
        self,
        trait_matrix: list[list[float]],
        labels: list[str],
        trait_vocab: list[str],
    ) -> "CareerRecommender":
        """
        Обучает трейтовый KNN на эталонных векторах профессий.

        Args:
            trait_matrix: матрица размером [n_samples, len(trait_vocab)].
                          Каждая строка — эталонный профиль одной профессии
                          (или нескольких семплов одной профессии для аугментации).
            labels:       метки (название профессии) для каждой строки матрицы.
                          "Noise" не используется — трейты не фильтруют, только ранжируют.
            trait_vocab:  упорядоченный список трейтов, совпадающий с колонками матрицы.
                          Пример: ["analytical", "creative", "ux", "backend", ...]
                          ВАЖНО: этот же порядок используется при инференсе.

        Пример подготовки в Colab:
            trait_vocab = ["analytical", "creative", "backend", "ux", "data"]
            profiles = {
                "Data Analyst":        [0.9, 0.4, 0.3, 0.2, 0.9],
                "Frontend Developer":  [0.4, 0.8, 0.5, 0.9, 0.2],
                "Backend Developer":   [0.5, 0.3, 0.95, 0.3, 0.4],
            }
            matrix = list(profiles.values())
            labels = list(profiles.keys())
            recommender.fit_traits(matrix, labels, trait_vocab)
        """
        self._trait_vocab = trait_vocab
        self._trait_labels = labels
        self._trait_knn.fit(trait_matrix)
        self._trait_fitted = True
        return self

    # ------------------------------------------------------------------
    # Инференс
    # ------------------------------------------------------------------

    def get_result(
        self,
        user_text: str,
        trait_scores: dict[str, float] | None = None,
    ) -> RecommendationResult:
        """
        Главный метод — принимает текст и (опционально) трейты пользователя.

        Args:
            user_text:    свободный текст из опросника
            trait_scores: нормализованный словарь трейтов пользователя вида
                          {"analytical": 0.5, "creative": 0.3, ...}.
                          Вычисляется в роутере из option_ids через БД.
                          None или пустой dict → только текстовый скор.

        Returns:
            RecommendationResult со статусом и списком профессий.
        """
        if not self._fitted:
            raise RuntimeError("Модель не обучена. Вызови fit() или load().")

        # --- 1. Текстовый KNN ---
        query_embedding = self._encoder.encode([user_text])
        distances, indices = self._knn.kneighbors(query_embedding)

        best_similarity = 1.0 - distances[0][0]
        closest_label = self._labels[indices[0][0]]

        # Фильтр: шум
        if closest_label == self.NOISE_LABEL:
            return RecommendationResult(
                status="rejected",
                reason="Текст не похож на описание IT-интересов. Попробуй написать подробнее.",
                professions=[],
            )

        # Фильтр: слишком расплывчато
        if best_similarity < self.SIMILARITY_THRESHOLD:
            return RecommendationResult(
                status="rejected",
                reason=(
                    f"Описание слишком расплывчатое (confidence: {best_similarity:.0%}). "
                    "Добавь больше деталей."
                ),
                professions=[],
            )

        # Собираем text_scores: {profession_name: similarity}
        text_scores: dict[str, float] = {}
        for i in range(self.n_neighbors):
            idx = indices[0][i]
            label = self._labels[idx]
            if label != self.NOISE_LABEL:
                # Берём лучший скор если профессия встречается несколько раз
                sim = round(1.0 - float(distances[0][i]), 4)
                text_scores[label] = max(text_scores.get(label, 0.0), sim)

        # --- 2. Трейтовый KNN (если доступен и переданы трейты) ---
        trait_scores_map: dict[str, float] = {}

        use_traits = (
            self._trait_fitted
            and trait_scores
            and len(trait_scores) > 0
        )

        if use_traits:
            trait_vec = self._trait_scores_to_vector(trait_scores)  # type: ignore[arg-type]
            t_distances, t_indices = self._trait_knn.kneighbors([trait_vec])

            for i in range(self.n_neighbors):
                idx = t_indices[0][i]
                label = self._trait_labels[idx]
                sim = round(1.0 - float(t_distances[0][i]), 4)
                trait_scores_map[label] = max(trait_scores_map.get(label, 0.0), sim)

        # --- 3. Композитный скор ---
        all_professions = set(text_scores) | set(trait_scores_map)

        if use_traits:
            composite = {
                prof: (
                    self.text_weight * text_scores.get(prof, 0.0)
                    + self.trait_weight * trait_scores_map.get(prof, 0.0)
                )
                for prof in all_professions
            }
        else:
            # Трейты недоступны — используем только текстовый скор
            composite = dict(text_scores)

        # Топ-N по убыванию скора
        top_n = sorted(composite.items(), key=lambda x: x[1], reverse=True)[: self.n_neighbors]

        return RecommendationResult(
            status="accepted",
            reason=None,
            professions=[
                {"name": name, "confidence": round(score, 3)}
                for name, score in top_n
            ],
        )

    # ------------------------------------------------------------------
    # Вспомогательные методы
    # ------------------------------------------------------------------

    def _trait_scores_to_vector(self, trait_scores: dict[str, float]) -> list[float]:
        """
        Переводит словарь трейтов пользователя в вектор, выровненный по _trait_vocab.

        Трейты, которых нет в словаре пользователя, получают значение 0.0.
        Неизвестные трейты (не из _trait_vocab) молча игнорируются.
        """
        return [trait_scores.get(trait, 0.0) for trait in self._trait_vocab]

    # ------------------------------------------------------------------
    # Сериализация
    # ------------------------------------------------------------------

    def save(self, path: str) -> None:
        """Сохраняет артефакты обучения обоих KNN."""
        payload = {
            "model_name": self.model_name,
            "n_neighbors": self.n_neighbors,
            "text_weight": self.text_weight,
            # Текстовый KNN
            "knn": self._knn,
            "labels": self._labels,
            # Трейтовый KNN
            "trait_knn": self._trait_knn,
            "trait_labels": self._trait_labels,
            "trait_vocab": self._trait_vocab,
            "trait_fitted": self._trait_fitted,
        }
        with open(path, "wb") as f:
            pickle.dump(payload, f)
        print(f"Артефакты пайплайна сохранены: {path}")

    @classmethod
    def load(cls, path: str) -> "CareerRecommender":
        """
        Загружает пайплайн из .pkl.

        Backward-compatible: старые файлы без трейтового KNN загрузятся
        и будут работать в text-only режиме.
        """
        with open(path, "rb") as f:
            payload = pickle.load(f)

        instance = cls(
            model_name=payload["model_name"],
            n_neighbors=payload["n_neighbors"],
            text_weight=payload.get("text_weight", 0.6),  # дефолт для старых pkl
        )

        # Текстовый KNN
        instance._knn = payload["knn"]
        instance._labels = payload["labels"]
        instance._fitted = True

        # Трейтовый KNN (опционально — для backward compatibility)
        instance._trait_knn = payload.get("trait_knn", instance._trait_knn)
        instance._trait_labels = payload.get("trait_labels", [])
        instance._trait_vocab = payload.get("trait_vocab", [])
        instance._trait_fitted = payload.get("trait_fitted", False)

        mode = "text + traits" if instance._trait_fitted else "text only"
        print(f"Пайплайн загружен [{mode}]: {path}")
        return instance