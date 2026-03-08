from typing import Any, Dict, List

from fastapi import APIRouter, Depends

from dependencies import get_current_user
from services.supabase_client import get_supabase

router = APIRouter()


def _safe_select(
    db,
    table: str,
    columns: str = '*',
    filters: Dict[str, Any] | None = None,
    limit: int | None = None,
    order_by: str | None = 'created_at',
    desc: bool = True,
) -> List[Dict[str, Any]]:
    try:
        query = db.table(table).select(columns)
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)

        if order_by:
            try:
                query = query.order(order_by, desc=desc)
            except Exception:
                pass

        if limit is not None:
            query = query.limit(limit)

        res = query.execute()
        return res.data or []
    except Exception as e:
        print(f'Profile fetch failed for {table}: {e}')
        return []


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default


def _normalize_plan_row(item: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': item.get('id'),
        'role': item.get('role') or item.get('job_role') or 'Technology',
        'current_milestone': item.get('current_milestone') or item.get('milestone') or 'Continue Learning',
        'completed_modules': _to_int(item.get('completed_modules'), 0),
        'total_modules': max(_to_int(item.get('total_modules'), 8), 1),
        'created_at': item.get('created_at'),
    }


def _sort_by_created(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(rows, key=lambda x: x.get('created_at') or '', reverse=True)


@router.get('/me')
def get_profile(user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')
    email = user.get('email') or ''

    user_row = _safe_select(
        db,
        'users',
        columns='id,email,first_name,last_name,created_at',
        filters={'id': user_id},
        limit=1,
        order_by=None,
    )
    profile_row = user_row[0] if user_row else {}

    first_name = profile_row.get('first_name') or ''
    last_name = profile_row.get('last_name') or ''
    if not first_name and email:
        first_name = email.split('@')[0].split('.')[0].replace('_', ' ').title()

    initials = ((first_name[:1] if first_name else '') + (last_name[:1] if last_name else '')).upper()
    if not initials:
        initials = (email[:1] or 'U').upper()

    progress_rows = _safe_select(db, 'user_progress', filters={'user_id': user_id}, order_by=None)
    quiz_rows = _safe_select(db, 'quizzes', filters={'user_id': user_id}, order_by=None)
    resume_rows = _safe_select(db, 'resumes', filters={'user_id': user_id}, order_by=None)
    interview_rows = _safe_select(db, 'interviews', filters={'user_id': user_id}, order_by=None)

    learning_rows = _safe_select(db, 'learning_plans', filters={'user_id': user_id}, order_by=None)
    training_rows = _safe_select(db, 'training_plans', filters={'user_id': user_id}, order_by=None)
    merged_plan_rows = _sort_by_created([_normalize_plan_row(r) for r in learning_rows + training_rows])

    best_resume_progress = max((_to_int(r.get('best_resume_score')) for r in progress_rows), default=0)
    best_resume_history = max((_to_int(r.get('score')) for r in resume_rows), default=0)
    best_resume = max(best_resume_progress, best_resume_history)

    avg_quiz_progress = max((_to_int(r.get('average_quiz_score')) for r in progress_rows), default=0)
    avg_quiz_history = max((_to_int(r.get('score')) for r in quiz_rows), default=0)
    avg_quiz = max(avg_quiz_progress, avg_quiz_history)

    latest_plan = merged_plan_rows[0] if merged_plan_rows else {
        'completed_modules': 0,
        'total_modules': 10,
        'current_milestone': 'Continue Learning',
        'role': 'Technology',
    }

    modules_progress = max((_to_int(r.get('modules_completed')) for r in progress_rows), default=0)
    completed_modules = max(modules_progress, _to_int(latest_plan.get('completed_modules')))
    total_modules = max(_to_int(latest_plan.get('total_modules'), 10), 1)

    target_role = next((r.get('target_role') for r in reversed(progress_rows) if r.get('target_role')), None)
    role = target_role or latest_plan.get('role') or 'Technology'

    total_activities = len(quiz_rows) + len(resume_rows) + len(interview_rows) + completed_modules

    composite_score = round((best_resume + avg_quiz) / 2)
    if composite_score >= 90:
        interview_rank = 'Top 5%'
    elif composite_score >= 80:
        interview_rank = 'Top 15%'
    elif composite_score >= 70:
        interview_rank = 'Top 30%'
    elif composite_score >= 60:
        interview_rank = 'Top 45%'
    else:
        interview_rank = 'Top 60%'

    recent_quizzes = _safe_select(
        db,
        'quizzes',
        columns='id,topic,score,total_questions,created_at',
        filters={'user_id': user_id},
        limit=5,
    )
    recent_interviews = _safe_select(
        db,
        'interviews',
        columns='id,role_applied_for,readiness_score,created_at',
        filters={'user_id': user_id},
        limit=5,
    )
    recent_resumes = _safe_select(
        db,
        'resumes',
        columns='id,score,created_at',
        filters={'user_id': user_id},
        limit=5,
    )
    recent_plans = merged_plan_rows[:5]

    return {
        'user': {
            'id': user_id,
            'email': profile_row.get('email') or email,
            'first_name': first_name,
            'last_name': last_name,
            'initials': initials,
            'joined_at': profile_row.get('created_at'),
        },
        'summary': {
            'best_resume': best_resume,
            'avg_quiz': avg_quiz,
            'training_progress': {
                'completed': completed_modules,
                'total': total_modules,
                'milestone': latest_plan.get('current_milestone') or 'Continue Learning',
                'role': role,
            },
            'total_activities': total_activities,
            'hours_trained': round(completed_modules * 1.5, 1),
            'interview_rank': interview_rank,
        },
        'counts': {
            'plans': len(merged_plan_rows),
            'quizzes': len(quiz_rows),
            'interviews': len(interview_rows),
            'resumes': len(resume_rows),
        },
        'recent': {
            'plans': recent_plans,
            'quizzes': recent_quizzes,
            'interviews': recent_interviews,
            'resumes': recent_resumes,
        },
    }
