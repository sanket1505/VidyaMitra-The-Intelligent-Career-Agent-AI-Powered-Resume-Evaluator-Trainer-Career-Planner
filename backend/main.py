from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, interview, jobs, learning, market, media, plan, profile, progress, quiz, resume

app = FastAPI(title='Vidyamitra API', version='0.1.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/')
def root():
    return {'name': 'Vidyamitra API', 'status': 'ok'}


app.include_router(auth.router, prefix='/auth', tags=['Auth'])
app.include_router(resume.router, prefix='/resume', tags=['Resume'])
app.include_router(plan.router, prefix='/plan', tags=['Plan'])
app.include_router(quiz.router, prefix='/quiz', tags=['Quiz'])
app.include_router(interview.router, prefix='/interview', tags=['Interview'])
app.include_router(jobs.router, prefix='/jobs', tags=['Jobs'])
app.include_router(progress.router, prefix='/progress', tags=['Progress'])
app.include_router(learning.router, prefix='/learning', tags=['Learning'])
app.include_router(media.router, prefix='/media', tags=['Media'])
app.include_router(market.router, prefix='/market', tags=['Market'])
app.include_router(profile.router, prefix='/profile', tags=['Profile'])
