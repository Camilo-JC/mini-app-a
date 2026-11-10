from random import sample
from typing import Annotated

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


class Question:
    def __init__(
        self,
        id: str,
        category: str,
        text: str,
        options: list[str],
        answer: int,
        explanation: str,
    ) -> None:
        self.id = id
        self.category = category
        self.text = text
        self.options = options
        self.answer = answer
        self.explanation = explanation


QUESTIONS = [
    Question(
        "q1",
        "Ciencia",
        "¿Cuál es el planeta más grande del sistema solar?",
        ["Saturno", "Júpiter", "Neptuno", "Marte"],
        1,
        "Júpiter es el planeta más grande: su masa es más de dos veces la de todos los demás planetas juntos.",
    ),
    Question(
        "q2",
        "Geografía",
        "¿Cuál es la capital de Australia?",
        ["Sídney", "Melbourne", "Canberra", "Brisbane"],
        2,
        "Canberra fue elegida como capital en 1908, en parte como solución al desacuerdo entre Sídney y Melbourne.",
    ),
    Question(
        "q3",
        "Naturaleza",
        "¿Qué animal es el mamífero más grande del mundo?",
        ["Elefante africano", "Tiburón ballena", "Ballena azul", "Jirafa"],
        2,
        "La ballena azul puede superar los 30 metros de longitud y es el animal más grande conocido.",
    ),
    Question(
        "q4",
        "Historia",
        "¿En qué año llegó el ser humano a la Luna por primera vez?",
        ["1965", "1969", "1972", "1975"],
        1,
        "La misión Apolo 11 alunizó el 20 de julio de 1969.",
    ),
    Question(
        "q5",
        "Arte",
        "¿Quién pintó la Mona Lisa?",
        ["Vincent van Gogh", "Pablo Picasso", "Claude Monet", "Leonardo da Vinci"],
        3,
        "Leonardo da Vinci pintó el retrato, también conocido como La Gioconda, a comienzos del siglo XVI.",
    ),
    Question(
        "q6",
        "Ciencia",
        "¿Qué gas absorben principalmente las plantas durante la fotosíntesis?",
        ["Oxígeno", "Nitrógeno", "Dióxido de carbono", "Hidrógeno"],
        2,
        "Las plantas absorben dióxido de carbono y, usando la energía de la luz, producen azúcares y liberan oxígeno.",
    ),
    Question(
        "q7",
        "Geografía",
        "¿Cuál es el océano más extenso de la Tierra?",
        ["Atlántico", "Índico", "Ártico", "Pacífico"],
        3,
        "El océano Pacífico cubre cerca de un tercio de la superficie terrestre.",
    ),
    Question(
        "q8",
        "Cultura",
        "¿Cuál de estos instrumentos tiene teclas, cuerdas y martillos?",
        ["Violín", "Piano", "Flauta", "Trompeta"],
        1,
        "Al pulsar una tecla del piano, un martillo golpea una cuerda para producir el sonido.",
    ),
    Question(
        "q9",
        "Ciencia",
        "¿Cuál es el símbolo químico del oro?",
        ["Ag", "Au", "Fe", "Or"],
        1,
        "Au viene del nombre latino del oro, aurum.",
    ),
    Question(
        "q10",
        "Literatura",
        "¿Quién escribió Don Quijote de la Mancha?",
        [
            "Federico García Lorca",
            "Miguel de Cervantes",
            "Lope de Vega",
            "Francisco de Quevedo",
        ],
        1,
        "Miguel de Cervantes publicó la primera parte de la novela en 1605.",
    ),
]

QUESTION_BY_ID = {question.id: question for question in QUESTIONS}

app = FastAPI(title="Trivia", description="Una trivia rápida para poner a prueba tus conocimientos.")
app.mount("/static", StaticFiles(directory="static"), name="static")


class PublicQuestion(BaseModel):
    id: str
    category: str
    text: str
    options: list[str]


class ScoreRequest(BaseModel):
    answers: dict[str, Annotated[int, Field(ge=0)]]


class QuestionResult(BaseModel):
    id: str
    question: str
    selected_option: str | None
    correct_option: str
    is_correct: bool
    explanation: str


class ScoreResponse(BaseModel):
    score: int
    total: int
    percentage: int
    results: list[QuestionResult]


@app.get("/", include_in_schema=False)
def home() -> FileResponse:
    return FileResponse("static/index.html")


@app.get("/api/questions", response_model=list[PublicQuestion])
def get_questions(shuffle: bool = True) -> list[PublicQuestion]:
    questions = sample(QUESTIONS, k=len(QUESTIONS)) if shuffle else QUESTIONS
    return [
        PublicQuestion(
            id=question.id,
            category=question.category,
            text=question.text,
            options=question.options,
        )
        for question in questions
    ]


@app.post("/api/score", response_model=ScoreResponse)
def calculate_score(payload: ScoreRequest) -> ScoreResponse:
    unknown_ids = set(payload.answers) - QUESTION_BY_ID.keys()
    if unknown_ids:
        raise HTTPException(status_code=422, detail="La respuesta incluye preguntas desconocidas.")
    if set(payload.answers) != QUESTION_BY_ID.keys():
        raise HTTPException(status_code=422, detail="Responde todas las preguntas antes de ver tu resultado.")

    results = []
    for question in QUESTIONS:
        selected_index = payload.answers[question.id]
        if selected_index >= len(question.options):
            raise HTTPException(status_code=422, detail="Una de las opciones seleccionadas no es válida.")
        results.append(
            QuestionResult(
                id=question.id,
                question=question.text,
                selected_option=question.options[selected_index],
                correct_option=question.options[question.answer],
                is_correct=selected_index == question.answer,
                explanation=question.explanation,
            )
        )

    score = sum(result.is_correct for result in results)
    return ScoreResponse(
        score=score,
        total=len(results),
        percentage=round(score / len(results) * 100),
        results=results,
    )
