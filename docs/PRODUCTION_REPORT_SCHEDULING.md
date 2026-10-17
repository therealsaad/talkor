# Scheduled school reports — operations runbook

**This feature is a cron-compatible export command, not a running cloud scheduler.** Production school staff must authorize when/where it runs and how files are delivered to parents. A cron/scheduled job service is required.

Only run on a private backend worker with MongoDB access. Exports include identifiable minors' performance information. Do **not** commit CSVs or publish them to a web static directory or public S3 bucket. Restrict directory access, retention, backups, administrator access and cross-school access appropriately. The command requires both explicit opt-in and the target active school's database ID.

```powershell
cd backend
$env:TALKORA_PRIVATE_REPORT_EXPORT = 'enabled'
$env:TALKORA_PRIVATE_REPORT_DIR = 'D:\private-talkora-reports'
pnpm reports:export -- --period daily --school YOUR_24_CHAR_SCHOOL_ID
```

Run daily for `daily`, once per week for `weekly`, and once per month for `monthly` using your chosen worker scheduler. The reporting windows are rolling UTC last 1, 7 or 30 days. Output CSV is created with owner-only permissions on Unix systems; Windows permissions inherit directory ACLs—configure them explicitly. The command pages school students in sets of 50 with max 4 concurrent individual reports. It writes privately to disk and prints a SHA-256 checksum, file name, and record count. It **does not** send email or automatically publish PDFs.

For a printable, Unicode-safe parent PDF, an authorized teacher/administrator can use `/school/students/<id>/report` → **Print / Save PDF**. Any automated email/PDF distribution still needs a secure delivery design with guardian verification, consent, retention policy and a PDF renderer. This is a deployment requirement, not a silently working feature.

API alternative for authorized staff: `GET /api/v1/analytics/reports/export.csv?period=weekly&limit=30[&after=<cursor>]`. Limit 1–100; response header `X-Talkora-Next-Cursor` signals another page. Authorization is school-scoped and teacher-scoped. Use a protected backend tool/client with Bearer token, never a public static URL.
