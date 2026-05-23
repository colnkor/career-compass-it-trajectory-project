import time
from uuid import uuid4
import httpx
import os

class LLMService:
    cert_p = "app/services/cert/custom_bundle.pem"
    GIGACHAT_API = (
        "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    )
    AUTH_KEY = os.getenv("LLM_API_KEY", None)

    def __init__(self, sys_prompt):
        self.system_prompt = sys_prompt

        # Инициализируем пустые значения для ленивой загрузки токена
        self.access_token = None
        self.exp_time = 0

    async def __get_access_token(self):
        """Асинхронное получение токена доступа GigaChat."""
        url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"

        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "RqUID": str(uuid4()),
            "Authorization": f"Basic {self.AUTH_KEY}",
        }

        payload = {"scope": "GIGACHAT_API_PERS"}

        # Привязываем сертификат к клиенту через параметр verify
        async with httpx.AsyncClient(
            verify=self.cert_p, timeout=10.0
        ) as client:
            response = await client.post(url, headers=headers, data=payload)

            if response.status_code == 200:
                data = response.json()
                self.exp_time = data["expires_at"]
                self.access_token = data["access_token"]
            else:
                raise Exception(
                    f"Код доступа к LLM не был получен! Статус: {response.status_code}"
                )

    async def get_answer(self, query: str, shadow_sys: str = None) -> str:
        """Получить ответ от модели GigaChat."""
        # Проверяем, инициализирован ли токен и не истек ли он
        if not self.access_token or (int(time.time()) > self.exp_time):
            await self.__get_access_token()

        sysprompt = self.system_prompt if shadow_sys == None else shadow_sys 

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.access_token}",
        }

        payload = {
            "model": "GigaChat-2",
            "messages": [
                {"role": "system", "content": sysprompt},
                {"role": "user", "content": query},
            ],
        }

        # Привязываем сертификат для выполнения основного запроса к чату
        async with httpx.AsyncClient(
            verify=self.cert_p, timeout=30.0
        ) as client:
            response = await client.post(
                self.GIGACHAT_API, headers=headers, json=payload
            )

            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                raise Exception(f"Response error code: {response.status_code}")

    async def get_models(self):
        """Получить список доступных моделей (дописанный метод)."""
        if not self.access_token or (int(time.time()) > self.exp_time):
            await self.__get_access_token()

        url = "https://gigachat.devices.sberbank.ru/api/v1/models"
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.access_token}",
        }

        async with httpx.AsyncClient(
            verify=self.cert_p, timeout=10.0
        ) as client:
            response = await client.get(url, headers=headers)

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(
                    f"Не удалось получить модели. Код: {response.status_code}"
                )


llm_service = None

async def init_service(sys_prmt: str):
    global llm_service 
    llm_service = LLMService(sys_prmt)