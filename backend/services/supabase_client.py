import os
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path=env_path, override=True)

url = os.getenv('SUPABASE_URL')
service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SECRET_KEY')
anon_key = os.getenv('SUPABASE_ANON_KEY')


def _looks_like_secret_key(key: Optional[str]) -> bool:
    text = str(key or '').strip()
    return text.startswith('sb_secret_') or text.startswith('sk_')


# Some setups accidentally place a secret key in SUPABASE_ANON_KEY.
# Promote it so backend requests run with server privileges.
if not service_role_key and _looks_like_secret_key(anon_key):
    service_role_key = anon_key

# Prefer service-role key on backend so server operations are stable.
base_key = service_role_key or anon_key

if not url or not base_key:
    raise ValueError(f'CRITICAL ERROR: SUPABASE_URL and key are required. Checked env file at: {env_path}')

supabase: Client = create_client(url, base_key)


def get_supabase(user_token: Optional[str] = None) -> Client:
    # Only scope with user JWT when the backend truly has no privileged key.
    if user_token and anon_key and not service_role_key:
        scoped = create_client(url, anon_key)
        try:
            scoped.postgrest.auth(user_token)
        except Exception as e:
            print(f'Warning: failed to scope supabase client with user token: {e}')
        return scoped

    return supabase
