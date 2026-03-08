from fastapi import APIRouter, Depends, Query

from dependencies import get_current_user
from services.ai import generate_quiz
from services.supabase_client import get_supabase

router = APIRouter()


def _safe_update_progress_quiz(db, user_id: str, score: int):
    try:
        res = db.table('user_progress').select('*').eq('user_id', user_id).execute()

        if not res.data:
            db.table('user_progress').insert({'user_id': user_id, 'average_quiz_score': score}).execute()
            return score

        old_score = int(res.data[0].get('average_quiz_score') or 0)
        final_score = max(old_score, score)
        db.table('user_progress').update({'average_quiz_score': final_score}).eq('user_id', user_id).execute()
        return final_score
    except Exception as e:
        print(f'user_progress quiz update skipped: {e}')
        return score


@router.get('/generate')
def generate_new_quiz(role: str = Query('Technology Professional')):
    return generate_quiz(role)


@router.get('/history')
async def get_quiz_history(user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')

    for with_order in (True, False):
        try:
            query = db.table('quizzes').select('*').eq('user_id', user_id).limit(30)
            if with_order:
                query = query.order('created_at', desc=True)
            res = query.execute()
            return {'history': res.data or []}
        except Exception as e:
            print(f'Quiz history fetch failed: {e}')

    return {'history': []}


@router.post('/submit')
async def submit_quiz(data: dict, user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')
    new_score = int(data.get('score', 0))
    topic = data.get('topic', 'General')
    total_questions = int(data.get('total_questions', 0))

    attempt_row = None
    try:
        inserted = (
            db.table('quizzes')
            .insert(
                {
                    'user_id': user_id,
                    'topic': topic,
                    'score': new_score,
                    'total_questions': total_questions,
                }
            )
            .execute()
        )
        attempt_row = inserted.data[0] if inserted.data else None
    except Exception as e:
        print(f'Quiz history insert failed: {e}')

    final_score = _safe_update_progress_quiz(db=db, user_id=user_id, score=new_score)

    return {'status': 'success', 'score': final_score, 'attempt': attempt_row}
