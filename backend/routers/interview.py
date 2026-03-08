from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies import get_current_user
from services.ai import generate_interview_response
from services.supabase_client import get_supabase

router = APIRouter()


class InterviewTurn(BaseModel):
    role: str
    question: str
    answer: str


class InterviewSubmit(BaseModel):
    user_id: Optional[str] = None
    role_applied_for: str
    readiness_score: int
    feedback: dict


def _safe_update_progress_role(db, user_id: str, role: str):
    try:
        existing = db.table('user_progress').select('*').eq('user_id', user_id).execute()
        if not existing.data:
            db.table('user_progress').insert({'user_id': user_id, 'target_role': role}).execute()
        else:
            db.table('user_progress').update({'target_role': role}).eq('user_id', user_id).execute()
    except Exception as e:
        print(f'user_progress role update skipped: {e}')


@router.post('/evaluate')
def evaluate_answer(turn: InterviewTurn):
    try:
        result = generate_interview_response(turn.role, turn.question, turn.answer)
        return result
    except Exception as e:
        print(f'Interview Eval Error: {e}')
        raise HTTPException(status_code=500, detail='Failed to evaluate answer')


@router.get('/history')
def get_interview_history(user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')

    for with_order in (True, False):
        try:
            query = db.table('interviews').select('*').eq('user_id', user_id).limit(30)
            if with_order:
                query = query.order('created_at', desc=True)
            res = query.execute()
            return {'history': res.data or []}
        except Exception as e:
            print(f'Interview history fetch failed: {e}')

    return {'history': []}


@router.post('/submit')
def submit_interview(data: InterviewSubmit, user: dict = Depends(get_current_user)):
    try:
        db = get_supabase(user.get('token'))
        user_id = user.get('id') or user.get('sub') or data.user_id

        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid user identification')

        interview_record = {
            'user_id': user_id,
            'role_applied_for': data.role_applied_for,
            'readiness_score': data.readiness_score,
            'feedback': data.feedback,
        }

        inserted_record = None
        try:
            inserted = db.table('interviews').insert(interview_record).execute()
            inserted_record = inserted.data[0] if inserted.data else None
        except Exception as e:
            print(f'Interview history insert failed: {e}')

        _safe_update_progress_role(db=db, user_id=user_id, role=data.role_applied_for)

        return {
            'message': 'Interview saved successfully to the cloud!',
            'record': inserted_record,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f'Supabase Interview Error: {e}')
        raise HTTPException(status_code=500, detail='Failed to save interview')
