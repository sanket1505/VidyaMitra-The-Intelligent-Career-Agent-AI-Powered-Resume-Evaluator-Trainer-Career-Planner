from services.supabase_client import get_supabase

supabase = get_supabase()


def register_user(email, password, first_name, last_name):
    try:
        auth_res = supabase.auth.sign_up({'email': email, 'password': password})
        if not auth_res.user:
            return {'error': 'Authentication signup failed.'}

        user_id = auth_res.user.id
        user_data = {
            'id': user_id,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
        }

        supabase.table('users').upsert(user_data).execute()
        return {'user_id': user_id, 'email': email}

    except Exception as e:
        print(f'Registration Error: {str(e)}')
        return {'error': str(e)}


def login_user(email, password):
    try:
        res = supabase.auth.sign_in_with_password({'email': email, 'password': password})

        if not res.user or not res.session:
            return {'error': 'Login failed. Invalid session returned.'}

        return {
            'user_id': res.user.id,
            'email': res.user.email,
            'token_type': 'bearer',
            'access_token': res.session.access_token,
            'refresh_token': res.session.refresh_token,
            'expires_in': res.session.expires_in,
        }
    except Exception as e:
        print(f'Login Error: {str(e)}')
        return {'error': 'Invalid email or password'}


def refresh_user_session(refresh_token):
    try:
        res = supabase.auth.refresh_session(refresh_token)

        if not res or not res.user or not res.session:
            return {'error': 'Session refresh failed. Invalid refresh token.'}

        return {
            'user_id': res.user.id,
            'email': res.user.email,
            'token_type': 'bearer',
            'access_token': res.session.access_token,
            'refresh_token': res.session.refresh_token,
            'expires_in': res.session.expires_in,
        }
    except Exception as e:
        print(f'Refresh Error: {str(e)}')
        return {'error': 'Session refresh failed. Please log in again.'}
