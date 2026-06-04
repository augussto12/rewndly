-- Development-only seed.
-- Do not run this file in production.

INSERT INTO users (
    id,
    username,
    email,
    password_hash,
    display_name,
    role,
    must_change_password,
    is_disabled,
    is_deleted,
    created_at,
    updated_at
)
VALUES (
    'a663ffb8-f842-4a08-9286-bda71f984e96',
    'Colucho',
    'colucho@moviesys.local',
    'PBKDF2-SHA256$100000$V8K8WG/xxUCG+7qeIyI1PA==$BM/STLUxTb8OVm9UG9+JsyqLnABgssNNhqDRQi++XVA=',
    'Colucho',
    'Admin',
    true,
    false,
    false,
    now(),
    now()
)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_privacy_settings (
    id,
    user_id,
    profile_visibility,
    show_activity,
    show_stats,
    created_at,
    updated_at
)
VALUES (
    '92e8660f-db26-4750-9b23-1ad8ad65c7c1',
    'a663ffb8-f842-4a08-9286-bda71f984e96',
    'Private',
    false,
    false,
    now(),
    now()
)
ON CONFLICT (user_id) DO NOTHING;
