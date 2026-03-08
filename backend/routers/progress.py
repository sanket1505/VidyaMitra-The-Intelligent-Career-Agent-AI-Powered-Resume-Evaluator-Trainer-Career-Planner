from fastapi import APIRouter, Depends

from dependencies import get_current_user
from services.supabase_client import get_supabase

router = APIRouter()


def _safe_select_rows(db, table: str, user_id: str):
    try:
        res = db.table(table).select('*').eq('user_id', user_id).execute()
        return res.data or []
    except Exception as e:
        print(f'Failed to fetch {table}: {e}')
        return []


def _latest_training_snapshot(db, user_id: str):
    for table in ('learning_plans', 'training_plans'):
        for with_order in (True, False):
            try:
                query = db.table(table).select('*').eq('user_id', user_id).limit(1)
                if with_order:
                    query = query.order('created_at', desc=True)
                res = query.execute()
                if res.data:
                    row = res.data[0]
                    return {
                        'completed': int(row.get('completed_modules') or 0),
                        'total': int(row.get('total_modules') or 10),
                        'milestone': row.get('current_milestone') or row.get('milestone') or 'Continue Learning',
                        'role': row.get('job_role') or row.get('role') or 'Technology',
                    }
            except Exception:
                continue

    return {'completed': 0, 'total': 10, 'milestone': 'Continue Learning', 'role': 'Technology'}


@router.get('/summary')
async def get_summary(user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')

    progress_rows = _safe_select_rows(db, 'user_progress', user_id)
    quiz_rows = _safe_select_rows(db, 'quizzes', user_id)
    resume_rows = _safe_select_rows(db, 'resumes', user_id)
    interview_rows = _safe_select_rows(db, 'interviews', user_id)

    best_resume_progress = max((row.get('best_resume_score') or 0) for row in progress_rows) if progress_rows else 0
    best_resume_history = max((row.get('score') or 0) for row in resume_rows) if resume_rows else 0
    best_resume = max(best_resume_progress, best_resume_history)

    avg_quiz_progress = max((row.get('average_quiz_score') or 0) for row in progress_rows) if progress_rows else 0
    avg_quiz_history = max((row.get('score') or 0) for row in quiz_rows) if quiz_rows else 0
    avg_quiz = max(avg_quiz_progress, avg_quiz_history)

    latest_training = _latest_training_snapshot(db, user_id)

    modules_progress = max((row.get('modules_completed') or 0) for row in progress_rows) if progress_rows else 0
    modules_completed = max(modules_progress, latest_training['completed'])

    target_role_progress = next((row.get('target_role') for row in reversed(progress_rows) if row.get('target_role')), None)
    target_role = target_role_progress or latest_training['role']

    total_activities = len(quiz_rows) + len(resume_rows) + len(interview_rows) + modules_completed

    return {
        'best_resume': best_resume,
        'training_progress': {
            'completed': modules_completed,
            'total': max(latest_training['total'], 1),
            'milestone': latest_training['milestone'],
            'role': target_role or 'Technology',
        },
        'avg_quiz': avg_quiz,
        'total_activities': total_activities,
    }
