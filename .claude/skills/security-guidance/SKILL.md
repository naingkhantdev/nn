---
name: security-guidance
description: Reviews code for security vulnerabilities using the OWASP Top 10 and secure-coding practices, and suggests fixes. Use when writing auth, handling user input, or before a release.
---

# security-guidance

## Check for (OWASP Top 10 and common issues)
1. **Injection** — SQL, NoSQL, command, template. Use parameterized queries; never build queries with string concatenation.
2. **Broken access control** — every endpoint checks that the user is allowed to access THIS resource (IDOR).
3. **Authentication** — password hashing (argon2/bcrypt), rate limiting, secure session cookies (HttpOnly, Secure, SameSite).
4. **Sensitive data** — secrets in code or logs, missing HTTPS, PII in error messages.
5. **XSS** — output encoding; no unsanitized HTML in innerHTML / dangerouslySetInnerHTML.
6. **SSRF** — validate URLs the server fetches; block internal addresses.
7. **Dependencies** — known-vulnerable versions.
8. **Security misconfiguration** — debug mode on, open CORS, default credentials.

## Output
A table: severity | file:line | issue | how it could be exploited (described in general terms) | fix.

## Rules
- Defensive review only. Do not write working exploits.
- Report real findings with evidence, not a generic checklist.
