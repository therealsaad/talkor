# Optional school report PDF renderer — STAGING VALIDATION REQUIRED

Talkora's V3 private `reports:export` job produces keyset-paginated **daily, weekly or monthly school CSV snapshots** with the existing MongoDB report models and staff-scoped report services. This V4 package adds a **dependency-free Node renderer** that converts one private CSV snapshot to a printable PDF using a locally installed Chromium/Chrome binary.

**Important:** The converter's CSV parsing / escaping tests pass, but the installed headless Chromium binary in the packaging sandbox hung during an actual PDF smoke test. PDF output has **not been validated in this environment**. Treat the scheduled PDF workflow as an *optional staging feature*, NOT a production-certified one. Test actual generated pages, Unicode student names, long rows, and permissions on the target Windows/scheduler host.

## One-off conversion (PowerShell on a trusted school/staging admin host)

1. Complete V3 `docs/PRODUCTION_REPORT_SCHEDULING.md` (private Mongo connection, trusted report worker, output directory, restricted account permissions).
2. Set the system environment variables in the private job context:

```powershell
$env:TALKORA_PRIVATE_REPORT_EXPORT = 'enabled'
$env:TALKORA_PRIVATE_REPORT_DIR = 'D:\TalkoraPrivateReports'
```

3. Export a **school-only private** CSV with the original V3 job (replace ID with your own test-school ObjectId):

```powershell
cd Talkora\backend
pnpm reports:export -- --period weekly --school YOUR_TEST_SCHOOL_OBJECT_ID
```

4. Convert the generated CSV from your private folder, for example:

```powershell
cd ..
node .\tools\reports\csv-to-private-pdf.cjs --input "D:\TalkoraPrivateReports\report.csv" --output "D:\TalkoraPrivateReports\report.pdf" --browser "C:\Program Files\Google\Chrome\Application\chrome.exe" --period weekly
```

The input/output must stay inside the configured private report directory. It refuses to overwrite a PDF, truncates nothing silently, HTML-escapes input before printing, renders without network resources, and restricts the output PDF file permissions where supported. No user data is printed to stdout.

## Scheduling the two-step pipeline

Set up Windows Task Scheduler with a dedicated restricted service user and a known Chrome installation. The job entrypoint is:

```powershell
.\tools\reports\export-and-render.ps1 -Period weekly -SchoolId YOUR_TEST_SCHOOL_OBJECT_ID -ChromePath 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

This is an **operator setup**, not something silently installed by the ZIP. Run separately for daily/weekly/monthly as required. Configure retention, backups, audit trail, encryption-at-rest, monitoring, retry/alert, and access controls according to the school policy. Chrome/Chromium is a runtime prerequisite (not included).

## Child privacy

The PDF contains a **school-scoped multi-student report**. Never email this whole PDF to an individual parent. Use the existing staff-only individual student report page and an authorized school sharing process. Individual-parent PDF creation and automatic private per-parent distribution are NOT implemented by this CLI. No parent portal was introduced.
