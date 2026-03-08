from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies import get_current_user
from services.ai import generate_custom_plan
from services.supabase_client import get_supabase

router = APIRouter()


def _insert_plan_row(db, user_id: str, role: str, milestone: str, total_modules: int, completed_modules: int):
    plan_id = str(uuid4())
    attempts = [
        (
            'learning_plans',
            {
                'id': plan_id,
                'user_id': user_id,
                'job_role': role,
                'current_milestone': milestone,
                'completed_modules': completed_modules,
                'total_modules': total_modules,
            },
        ),
        (
            'learning_plans',
            {
                'id': plan_id,
                'user_id': user_id,
                'job_role': role,
                'current_milestone': milestone,
                'completed_modules': completed_modules,
            },
        ),
        (
            'learning_plans',
            {
                'id': plan_id,
                'user_id': user_id,
                'role': role,
                'current_milestone': milestone,
                'completed_modules': completed_modules,
                'total_modules': total_modules,
            },
        ),
        (
            'learning_plans',
            {
                'id': plan_id,
                'user_id': user_id,
                'role': role,
                'current_milestone': milestone,
                'completed_modules': completed_modules,
            },
        ),
        (
            'training_plans',
            {
                'id': plan_id,
                'user_id': user_id,
                'role': role,
                'current_milestone': milestone,
                'total_modules': total_modules,
                'completed_modules': completed_modules,
            },
        ),
        (
            'training_plans',
            {
                'id': plan_id,
                'user_id': user_id,
                'role': role,
                'current_milestone': milestone,
                'completed_modules': completed_modules,
            },
        ),
        (
            'training_plans',
            {
                'id': plan_id,
                'user_id': user_id,
                'job_role': role,
                'current_milestone': milestone,
                'total_modules': total_modules,
                'completed_modules': completed_modules,
            },
        ),
    ]

    last_error = None
    for table, payload in attempts:
        try:
            row = db.table(table).insert(payload).execute()
            if row.data:
                return row.data[0], table
        except Exception as e:
            last_error = e

    raise Exception(f'Unable to insert plan history: {last_error}')


def _fetch_plan_history(db, user_id: str):
    combined_rows = []

    for table in ('learning_plans', 'training_plans'):
        fetched_rows = None
        for with_order in (True, False):
            try:
                query = db.table(table).select('*').eq('user_id', user_id).limit(20)
                if with_order:
                    query = query.order('created_at', desc=True)
                res = query.execute()
                fetched_rows = res.data or []
                break
            except Exception:
                continue

        if fetched_rows is not None:
            for row in fetched_rows:
                if isinstance(row, dict):
                    enriched = dict(row)
                    enriched['source_table'] = table
                    combined_rows.append(enriched)

    if not combined_rows:
        return [], 'learning_plans'

    combined_rows.sort(key=lambda row: row.get('created_at') or '', reverse=True)
    return combined_rows[:20], 'mixed'


def _delete_plan_row(
    db,
    user_id: str,
    plan_id: str,
    table_hint: Optional[str] = None,
    created_at: Optional[str] = None,
    milestone: Optional[str] = None,
    role: Optional[str] = None,
):
    allowed_tables = ('learning_plans', 'training_plans')
    if table_hint in allowed_tables:
        tables = (table_hint,) + tuple(table for table in allowed_tables if table != table_hint)
    else:
        tables = allowed_tables

    def _norm_text(value):
        return str(value or '').strip().lower()

    def _time_match(a: str, b: str):
        aa = str(a or '').strip()
        bb = str(b or '').strip()
        if not aa or not bb:
            return False
        return aa == bb or aa.startswith(bb) or bb.startswith(aa)

    def _try_delete_by_id(table_name: str, candidate_id):
        if candidate_id is None:
            return False

        try:
            existing = db.table(table_name).select('id').eq('id', candidate_id).eq('user_id', user_id).limit(1).execute()
            if not existing.data:
                return False

            db.table(table_name).delete().eq('id', candidate_id).eq('user_id', user_id).execute()
            verify = db.table(table_name).select('id').eq('id', candidate_id).eq('user_id', user_id).limit(1).execute()
            return not verify.data
        except Exception as e:
            print(f'Plan delete skipped in {table_name}: {e}')
            return False

    def _try_delete_candidate(table_name: str, row: dict):
        for candidate in (row.get('id'), row.get('plan_id')):
            if _try_delete_by_id(table_name, candidate):
                return True

        # Fallback for legacy rows where id may be absent/mismatched.
        created_value = str(row.get('created_at') or '').strip()
        if not created_value:
            return False

        milestone_value = row.get('current_milestone') or row.get('milestone')
        role_value = row.get('job_role') or row.get('role')

        filter_attempts = [
            {'created_at': created_value, 'current_milestone': milestone_value, 'role': role_value},
            {'created_at': created_value, 'current_milestone': milestone_value, 'job_role': role_value},
            {'created_at': created_value, 'current_milestone': milestone_value},
            {'created_at': created_value},
        ]

        for filters in filter_attempts:
            try:
                query = db.table(table_name).delete().eq('user_id', user_id)
                verify_query = db.table(table_name).select('id').eq('user_id', user_id)

                applied = 0
                for key, value in filters.items():
                    if value is None:
                        continue
                    query = query.eq(key, value)
                    verify_query = verify_query.eq(key, value)
                    applied += 1

                if applied == 0:
                    continue

                query.execute()
                verify = verify_query.limit(1).execute()
                if not verify.data:
                    return True
            except Exception:
                continue

        return False

    def _delete_from_rows(table_name: str, rows: list):
        req_milestone = _norm_text(milestone)
        req_role = _norm_text(role)
        req_created = str(created_at or '').strip()

        def pick(predicate):
            for row in rows:
                try:
                    if predicate(row):
                        return row
                except Exception:
                    continue
            return None

        strict_candidate = pick(
            lambda row: (
                (not req_created or _time_match(row.get('created_at'), req_created))
                and (not req_milestone or _norm_text(row.get('current_milestone') or row.get('milestone')) == req_milestone)
                and (not req_role or _norm_text(row.get('job_role') or row.get('role')) == req_role)
            )
        )
        if strict_candidate is not None and _try_delete_candidate(table_name, strict_candidate):
            return True

        milestone_role_candidate = pick(
            lambda row: (
                (not req_milestone or _norm_text(row.get('current_milestone') or row.get('milestone')) == req_milestone)
                and (not req_role or _norm_text(row.get('job_role') or row.get('role')) == req_role)
            )
        )
        if milestone_role_candidate is not None and _try_delete_candidate(table_name, milestone_role_candidate):
            return True

        milestone_only_candidate = pick(
            lambda row: req_milestone and _norm_text(row.get('current_milestone') or row.get('milestone')) == req_milestone
        )
        if milestone_only_candidate is not None and _try_delete_candidate(table_name, milestone_only_candidate):
            return True

        role_only_candidate = pick(
            lambda row: req_role and _norm_text(row.get('job_role') or row.get('role')) == req_role
        )
        if role_only_candidate is not None and _try_delete_candidate(table_name, role_only_candidate):
            return True

        # Last safe fallback: if user has only one row in this table, delete it.
        if len(rows) == 1 and _try_delete_candidate(table_name, rows[0]):
            return True

        return False

    id_text = str(plan_id or '').strip()
    if id_text and ':' in id_text and not id_text.startswith('tmp-plan-'):
        parts = id_text.split(':', 1)
        if len(parts) == 2 and parts[0] in allowed_tables:
            hinted_table, raw_id = parts
            id_text = raw_id.strip()
            tables = (hinted_table,) + tuple(table for table in allowed_tables if table != hinted_table)

    for table in tables:
        if id_text and not id_text.startswith('tmp-plan-'):
            if _try_delete_by_id(table, id_text):
                return table

            if id_text.isdigit() and _try_delete_by_id(table, int(id_text)):
                return table

        try:
            rows = db.table(table).select('*').eq('user_id', user_id).limit(100).execute().data or []
        except Exception as e:
            print(f'Plan context lookup skipped in {table}: {e}')
            continue

        if _delete_from_rows(table, rows):
            return table

    return None

def _normalize_plan_row(item: dict):
    return {
        'id': item.get('id'),
        'role': item.get('role') or item.get('job_role') or 'Technology',
        'current_milestone': item.get('current_milestone') or item.get('milestone') or 'Continue Learning',
        'completed_modules': item.get('completed_modules') or 0,
        'total_modules': item.get('total_modules') or 8,
        'created_at': item.get('created_at'),
        'source_table': item.get('source_table'),
    }


def _safe_upsert_progress(db, user_id: str, role: Optional[str] = None, modules_completed: Optional[int] = None):
    try:
        progress_res = db.table('user_progress').select('*').eq('user_id', user_id).execute()
        if not progress_res.data:
            payload = {'user_id': user_id}
            if role:
                payload['target_role'] = role
            if modules_completed is not None:
                payload['modules_completed'] = modules_completed
            db.table('user_progress').insert(payload).execute()
            return

        updates = {}
        if role:
            updates['target_role'] = role
        if modules_completed is not None:
            updates['modules_completed'] = modules_completed

        if updates:
            db.table('user_progress').update(updates).eq('user_id', user_id).execute()
    except Exception as e:
        print(f'user_progress upsert skipped: {e}')



def _ensure_user_row(db, user_id: str, email: Optional[str] = None):
    try:
        payload = {'id': user_id}
        if email:
            payload['email'] = email
        db.table('users').upsert(payload).execute()
    except Exception as e:
        print(f'users upsert skipped: {e}')
@router.get('')
@router.get('/')
def get_training_plan(role: str = Query('Technology Professional')):
    data = generate_custom_plan(role)

    title = data.get('nextMilestone')
    if not title or title in ('undefined', 'null'):
        title = f'Mastering {role.title()}'

    total_count = data.get('total', 8)

    return {
        'nextMilestone': title,
        'milestone': title,
        'title': title,
        'name': title,
        'topic': title,
        'total': total_count,
        'modules': total_count,
        'total_modules': total_count,
    }


@router.post('/save')
async def save_training_plan(data: dict, user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')
    user_email = user.get('email')

    _ensure_user_row(db, user_id=user_id, email=user_email)

    role = data.get('role', 'Technology')
    current_milestone = data.get('current_milestone') or data.get('milestone') or 'Continue Learning'
    total_modules = int(data.get('total_modules', 8))
    completed_modules = int(data.get('completed_modules', 0))

    saved, table = _insert_plan_row(db, user_id, role, current_milestone, total_modules, completed_modules)
    _safe_upsert_progress(db, user_id=user_id, role=role, modules_completed=completed_modules)

    return {'status': 'success', 'plan_id': saved.get('id'), 'table': table}


@router.get('/history')
async def get_plan_history(user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')
    user_email = user.get('email')

    _ensure_user_row(db, user_id=user_id, email=user_email)

    rows, table = _fetch_plan_history(db, user_id)
    normalized = [_normalize_plan_row(item) for item in rows]

    return {'history': normalized, 'table': table}


@router.delete('/history/{plan_id}')
async def delete_plan_history_item(
    plan_id: str,
    table: Optional[str] = Query(default=None),
    created_at: Optional[str] = Query(default=None),
    milestone: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default=None),
    user: dict = Depends(get_current_user),
):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')
    user_email = user.get('email')

    _ensure_user_row(db, user_id=user_id, email=user_email)

    deleted_table = _delete_plan_row(
        db,
        user_id,
        plan_id,
        table_hint=table,
        created_at=created_at,
        milestone=milestone,
        role=role,
    )
    if not deleted_table:
        raise HTTPException(status_code=404, detail='Plan history item not found or could not be deleted')

    return {'status': 'success', 'plan_id': plan_id, 'table': deleted_table}


@router.post('/complete-module/{module_id}')
async def complete_module(module_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase(user.get('token'))
    user_id = user.get('id') or user.get('sub')
    user_email = user.get('email')

    _ensure_user_row(db, user_id=user_id, email=user_email)

    new_count = None
    for table in ('learning_plans', 'training_plans'):
        try:
            plan_res = db.table(table).select('*').eq('id', module_id).eq('user_id', user_id).limit(1).execute()
            if plan_res.data:
                current_plan = plan_res.data[0]
                current_completed = int(current_plan.get('completed_modules') or 0)
                new_count = current_completed + 1
                db.table(table).update({'completed_modules': new_count}).eq('id', module_id).eq('user_id', user_id).execute()
                break
        except Exception as e:
            print(f'Plan module increment skipped in {table}: {e}')

    if new_count is None:
        new_count = 1

    _safe_upsert_progress(db, user_id=user_id, modules_completed=new_count)

    return {'status': 'success', 'total_completed': new_count}





