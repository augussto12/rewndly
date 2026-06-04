# Seeds

Seeds are optional and environment-specific.

## Development Admin

`seed_dev_admin.sql` creates the local development admin:

- Username: `Colucho`
- Initial password: `Admin123!`
- `must_change_password`: `true`

The password is stored as a PBKDF2-SHA256 hash. This seed is only for local development.

## Production Admin Strategy

Production must not use `Admin123!`.

Create the first admin through a controlled bootstrap process using server secrets or environment variables:

- `REWNDLY_ADMIN_USERNAME`
- `REWNDLY_ADMIN_EMAIL`
- `REWNDLY_ADMIN_INITIAL_PASSWORD`
- `REWNDLY_ADMIN_MUST_CHANGE_PASSWORD=true`

The bootstrap process must run once, hash the password, mark the account as requiring a password change, and refuse to overwrite an existing admin unless explicitly requested by an operator.
