---
name: deploy-cloud-run
description: >
  Use me to package the application into a container and deploy it to
  Google Cloud Run using gcloud run deploy --source. I verify the environment,
  run the deploy, and report the live production URL.
  Owned by the devsecops persona. Activate with /deploy-cloud-run or by name.
tools: [Read, Bash]
---

# Skill: Deploy to Cloud Run

Package the application and ship it to Google Cloud Run in one command —
then hand back the live production URL.

## Steps

### Step 1 — Pre-flight checks
1. Read `spec/requirements.md` and `spec/ARCHITECTURE.md` to confirm:
   - The project targets Google Cloud Run as its deployment environment.
   - The approved tech stack is compatible with `gcloud run deploy --source`
     (Node.js, Python, Go, Java, Ruby, PHP, or a Dockerfile-based stack).
2. Verify that the necessary source files exist inside `src/`:
   - Look for a `Dockerfile`, `package.json`, `requirements.txt`, `go.mod`,
     or any other stack-appropriate entrypoint.
   - If none is found: **stop and report** — do not attempt to deploy.
3. Verify `gcloud` CLI is authenticated and a project is set:
   ```bash
   gcloud auth list
   gcloud config get-value project
   ```
   - If not authenticated or no project is set: **stop and report** the exact
     commands the user must run to fix it. Do not proceed.
4. Confirm no secrets are hardcoded in `src/` — run a quick grep for common
   patterns (`API_KEY`, `SECRET`, `PASSWORD` as literals in source files).
   Flag any findings as **Critical** before deploying.

### Step 2 — Deploy
5. Navigate into `src/` and run:
   ```bash
   gcloud run deploy --source . \
     --region <REGION> \
     --allow-unauthenticated \
     --quiet
   ```
   - **Region**: use the region declared in `spec/ARCHITECTURE.md` if present;
     otherwise default to `us-central1`.
   - `--allow-unauthenticated`: makes the service publicly accessible (web app default).
     If the spec marks the service as **private / internal**, omit this flag and
     note it in the report.
   - `--quiet`: suppresses interactive prompts so the deploy is non-interactive.
6. If the deploy command fails:
   - Show the full error output.
   - Diagnose the cause (missing APIs, quota, IAM permissions, build error, etc.).
   - Suggest the exact remediation command(s).
   - **Do not retry silently** — stop and wait for the user.

### Step 3 — Report
7. Extract the service URL from the `gcloud` output and report:

```
## 🚀 Deployed to Cloud Run!

- **Live URL**:  https://<service>-<hash>-<region>.run.app
- **Service**:   <service-name>
- **Region**:    <region>
- **Visibility**: Public (unauthenticated) / Private
- **Image**:     Built from src/ via Cloud Build

✅ Your app is live. Open the URL above to verify it is responding correctly.
```

---

## Constraints
- **Ask for confirmation** before deploying if the target environment is
  `production` and the spec does not explicitly mark it as the intended target.
- **Never hardcode credentials** — all secrets must be passed via
  Google Secret Manager or Cloud Run environment variables, not baked into the image.
- **Never modify `spec/` files** — this skill is execution-only.
- Only operate on files inside `src/` — do not touch the project root or
  `.agents/` during the deploy.
- If `--allow-unauthenticated` conflicts with a security requirement in
  `spec/requirements.md` or `.agents/rules/security.md`: omit the flag,
  note the conflict, and ask the user to confirm the intended access policy.
- Document the deploy decision (region, visibility, service name) as an ADR
  in `docs/ADR/NNN-cloud-run-deploy.md` if this is the first deploy.
