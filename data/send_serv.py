import json
import requests

update = "roadmap"

if update == "questionnaire":
    url = "http://localhost:8000/questionnaire/seed"
    with open("questions.json", "r", encoding="utf-8") as file:
        data = json.load(file)
elif update == "professions":
    url = "http://localhost:8000/professions/seed"
    with open("professsions.json", "r", encoding="utf-8") as file:
        data = json.load(file)
    for item in data['professions']:
        item.pop('id', None)
elif update == "roadmap":
    url = "http://localhost:8000/roadmap/seed"
    with open("roadmaps.json", "r", encoding="utf-8") as file:
        data = json.load(file)

# Отправляем POST-запрос
response = requests.post(url, json=data)

print("Status:", response.status_code)
print("Response:", response.text)