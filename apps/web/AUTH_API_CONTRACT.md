# Auth API Contract (Frontend Integration)

This frontend is ready to call a backend auth service when `NEXT_PUBLIC_AUTH_API_BASE` is set.

Postman collection: `apps/web/postman/auth-api.postman_collection.json`

## Base URL
- `NEXT_PUBLIC_AUTH_API_BASE` (example: `https://api.example.com`)

## Endpoints
- `POST /auth/register`
- `POST /auth/login`

Both endpoints currently use the same response contract so the UI can switch between mock mode and backend mode without UX changes.

## Request: `POST /auth/register`

```json
{
  "email": "trainer@example.com",
  "password": "your-plain-password",
  "displayName": "TrainerName"
}
```

### curl example

```bash
curl -X POST "$NEXT_PUBLIC_AUTH_API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@example.com",
    "password": "change-me-123",
    "displayName": "TrainerName"
  }'
```

## Request: `POST /auth/login`

```json
{
  "email": "trainer@example.com",
  "password": "your-plain-password"
}
```

### curl example

```bash
curl -X POST "$NEXT_PUBLIC_AUTH_API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trainer@example.com",
    "password": "change-me-123"
  }'
```

## Success Response (200)

```json
{
  "user": {
    "email": "trainer@example.com",
    "displayName": "TrainerName"
  }
}
```

The frontend also accepts this shape:

```json
{
  "email": "trainer@example.com",
  "displayName": "TrainerName"
}
```

## Error Response (4xx/5xx)

Any non-2xx response is treated as failed auth by the frontend.

Recommended structure:

```json
{
  "error": "Invalid credentials"
}
```

## Security Requirements

- Use HTTPS only.
- Hash and salt passwords server-side (never store plaintext).
- Apply server-side rate limiting for login/register.
- Return generic login errors (avoid user enumeration).
- Set secure cookies (recommended):
  - `HttpOnly`
  - `Secure` (in HTTPS)
  - `SameSite=Strict` or `Lax`
- Validate and sanitize all incoming values server-side.

## CORS / CSP Notes

- Frontend CSP automatically allows `NEXT_PUBLIC_AUTH_API_BASE` origin in `connect-src`.
- If backend is on another origin, enable CORS for the web app origin.

## Local Fallback Behavior

If `NEXT_PUBLIC_AUTH_API_BASE` is empty/unreachable, frontend uses local mock auth automatically:
- Accounts in `localStorage`
- Session in `sessionStorage`
- Password hash via `SHA-256` in browser crypto

This fallback is for development only.
