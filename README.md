# Un rato de trivia

Una pequeña app web de trivia en español, construida con FastAPI y JavaScript sin frameworks.

## Ejecutar localmente

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Abre <http://127.0.0.1:8000>. La documentación interactiva de la API está en <http://127.0.0.1:8000/docs>.

## API

- `GET /api/questions?shuffle=true`: devuelve las preguntas sin incluir las respuestas correctas.
- `POST /api/score`: recibe las respuestas y devuelve la puntuación y una explicación por pregunta.
