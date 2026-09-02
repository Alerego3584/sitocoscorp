# Security and compliance review — Alerego.dev

**Scope:** Cloudflare Pages site `alerego.dev`, Pages Functions (`/api`, `/media`), KV `ALEREGO_META` (key `galleries_metadata`), R2 `ALEREGO_GALLERY`. Production portfolio with a password-protected CMS at `/admin/`.

**Not in scope:** AWS/Azure/GCP accounts, EC2, Security Groups, CloudTrail, Kubernetes, HIPAA, PCI-DSS, FedRAMP, SOC 2 Type II. Those frameworks do not map to this stack; treating them as N/A avoids fake controls.

**Frameworks that do apply:** general CIS-style hardening (least privilege, logging, encryption, perimeter), OWASP ASVS for the admin API, GDPR for an EU-facing photographer site (contact email, language preference in `localStorage`).

---

## Control domain coverage

| Domain | Status | Notes |
| --- | --- | --- |
| Identity (admin) | Partially implemented | Shared password + HMAC session; no MFA; rate limit on login |
| Network / TLS | Implemented (host) | Cloudflare edge TLS; HSTS in `_headers`; no origin VMs |
| Data (R2/KV) | Implemented for purpose | Gallery objects are public by design; KV holds titles/paths, not card data |
| Logging | Not implemented | Pages has limited request logs; no SIEM, no integrity-locked audit trail |
| Compute | N/A | No VMs/containers; Functions are the compute |

---

## Findings

| Finding | Service | Severity | Control ref | Remediation |
| --- | --- | --- | --- | --- |
| Admin token was `base64(time:secret)` (secret in token) | Pages Functions | Critical (fixed) | OWASP ASVS 3.5 / CIS IAM “no shared secrets in bearer” | HMAC-SHA256 token (`iat`/`exp`); rotate `JWT_SECRET` after deploy |
| Unbounded R2 write path | R2 `ALEREGO_GALLERY` | High (fixed) | CIS object-storage write restriction | Allowlist `cosplay|corporate/featured/{slug}/{full\|thumbnails}/{file}` + MIME + 12 MB |
| No brute-force control on admin login | `/api/admin/auth` | High (mitigated) | CIS “limit failed logins” | 5 attempts / 10 min per IP (isolate memory; resets on new isolate) |
| Single shared admin password, no MFA | IAM / Cloudflare account | High | CIS MFA on privileged users | Enable MFA on the Cloudflare login; use a long unique `ADMIN_PASSWORD`; do not reuse the local default |
| Debug HTML in publish root | Pages static | Medium (fixed) | Attack surface reduction | Removed `debug-links.html`, `test-slugs.html` |
| Public CORS `*` on sets API | `/api/public/sets` | Low (fixed) | OWASP API7 | Removed; data was already public |
| Missing CSP / HSTS | `_headers` | Medium (fixed) | Mozilla Observatory / CIS web | CSP + HSTS added; Tailwind CDN requires `'unsafe-eval'` on admin |
| Admin linked from footer | Static HTML | Low | Security through obscurity is not a control | Kept for operations; `nofollow` + `noindex` |
| Token in `localStorage` | Admin JS | Medium | XSS → session theft | Keep CSP tight; do not add third-party scripts on `/admin` beyond Tailwind/Inter |
| Functions request logs not retained as evidence | Cloudflare | Medium | GDPR Art. 32 / logging | Enable Cloudflare logpush or dashboard HTTP logs if you need incident evidence |
| No WAF custom rules in repo | Cloudflare | Medium | Perimeter | Enable WAF managed rules + Bot Fight in the dashboard (cannot ship in git) |

### Immediate actions (Critical / High)

1. Deploy this code, then **sign out of admin** (old tokens invalid) and set a new `JWT_SECRET` in Pages if the old one was ever shared.
2. Cloudflare dashboard: **MFA** on the account that owns Pages.
3. Confirm R2 public access is only via `/media` Function, not an `*.r2.dev` public bucket listing.
4. Change `ADMIN_PASSWORD` if it ever matched a documented local default.

**Change management:** rotating `JWT_SECRET` logs everyone out of `/admin`. Upload allowlist rejects paths outside featured full/thumbnails (do not point the CMS at arbitrary keys). Login rate limit can briefly lock you out after failed passwords (wait 10 minutes or change isolate).

---

## CLI / console — top remediations

Already in this repo: HMAC auth, path allowlist, rate limit, CSP/HSTS, CORS removal.

Dashboard (do after GitHub connect):

1. Pages → Settings → Variables: `ADMIN_PASSWORD`, `JWT_SECRET` (encrypt, production + preview).
2. Pages → Settings → Bindings: existing KV `ALEREGO_META`, existing R2 `ALEREGO_GALLERY` (do not create new stores).
3. Security → WAF: enable Cloudflare managed ruleset.
4. R2 bucket: disable public development URL if unused; keep serving through `/media`.
5. Account: enable 2FA; review members with Pages edit.

---

## Recommended cloud-native controls

- Cloudflare **WAF** + Bot Fight Mode on `alerego.dev`.
- **Always Use HTTPS** (usually default on Pages custom domains).
- KV/R2 encryption at rest (Cloudflare default); TLS in transit to the edge.
- Optional: Cloudflare Access in front of `/admin*` if you want identity beyond a site password (disruption: extra login). Flag as optional; not required for a one-person CMS.

---

## GDPR gap (honest, not SOC 2)

| Control | Requirement | Current | Gap | Severity | Remediation |
| --- | --- | --- | --- | --- | --- |
| Lawful contact | Art. 6 | Email + Instagram in UI | Need a short privacy notice (who you are, why email is shown) | Medium | One `/privacy` page or footer paragraph — legal wording, not a lawyer substitute |
| Storage limitation | Art. 5 | `localStorage` language key only | Not a tracking cookie; still disclose if you add analytics later | Low | No banner required for this key alone; **legal review** if you add GA/Plausible |
| Security of processing | Art. 32 | TLS, HMAC admin, upload limits | Logging/alerting still thin | Medium | Dashboard HTTP analytics; alert on spike of 401s to `/api/admin/auth` |
| Processor terms | Art. 28 | Cloudflare is processor | Need Cloudflare DPA acceptance in dashboard | Medium | Review Cloudflare GDPR addendum |
| SOC 2 / HIPAA / PCI | — | N/A | Do not collect PHI or PAN | — | Do not store card data in KV/R2 |

**Evidence checklist (if you ever need it):** Pages deploy logs, binding screenshots, `_headers` in git, env vars present (not values), this file, privacy text, Cloudflare MFA screenshot.

**30 / 60 / 90 days:** 30 — deploy hardening, MFA, rotate secrets, privacy sentence. 60 — WAF, disable unused R2 public URLs, optional Access on `/admin`. 90 — consider logpush if you want retention; Dependabot on GitHub; do not block merges on Medium SCA noise.

**Audit readiness:** not pursuing SOC 2. GDPR “readiness” is a privacy page + processor DPA + this hardening, not a 12-month ISMS.

---

## Data protection (this site)

| Tier | Examples | Handling |
| --- | --- | --- |
| Public | Portfolio photos, set titles | R2 via `/media`; intended public |
| Internal | Admin password, JWT secret | Pages encrypted env; never git |
| Confidential | Collaborator logos, about stills | Static `/images`; not secret |
| Restricted | None today (no PHI/PCI) | Do not add without a review |

Encryption: TLS 1.2+ at Cloudflare edge; AES at rest on KV/R2 (provider). No application-level field encryption (no PII stores). DLP: N/A at Microsoft Purview scale; do not commit dumps of `galleries_metadata` with unreleased work if that matters commercially.

---

## DevSecOps / IAM / IR / vulns (calibrated)

- **CI:** none required to ship. After GitHub: Dependabot + secret scanning. Do not fail PRs on Medium.
- **Secrets:** Pages env + `.dev.vars` gitignored. Pre-commit Gitleaks is optional.
- **IAM:** one human Cloudflare owner; Functions service binding is the “workload identity”; least privilege = do not bind extra KV/R2.
- **IR (P1–P4):** P1 = admin password leak or R2 wipe. Containment: rotate `ADMIN_PASSWORD`/`JWT_SECRET`, revoke Pages deploy tokens, restore KV from last known good JSON. GDPR 72h only if personal data of visitors is involved (today: email is yours, not a user database). Legal counsel before public statements.
- **Vulns:** no VMs to Nessus. Prioritize CISA KEV on the **Cloudflare/Tailwind CDN** supply chain and npm `sharp` if you run import scripts. SLA: Critical edge/auth issues same day; static XSS in admin before next shoot.

---

## Ongoing monitoring

Watch Cloudflare analytics for 4xx/5xx on `/api/admin/*`. After failed-login bursts, wait out the rate limit rather than widening it. Re-read this file when adding analytics, comments, or payments (scope change).
