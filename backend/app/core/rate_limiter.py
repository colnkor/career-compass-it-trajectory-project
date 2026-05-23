import time
from collections import defaultdict, deque
from fastapi import HTTPException, status


class SlidingWindowRateLimiter:
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[int, deque] = defaultdict(deque)

    def check(self, user_id: int) -> None:
        now = time.time()
        q = self._requests[user_id]

        # Чистим старые записи за пределами окна
        while q and q[0] < now - self.window_seconds:
            q.popleft()

        if len(q) >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Слишком много запросов. Лимит: {self.max_requests} в {self.window_seconds} сек.",
                headers={"Retry-After": str(self.window_seconds)},
            )

        q.append(now)


# 10 запросов в минуту на пользователя
explain_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=60)