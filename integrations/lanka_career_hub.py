"""
Lanka Career Hub — safe bot sync for Python / GitHub Actions bots.
Never raises by default; FB posting keeps working if website is down.

GitHub Secrets:
  LANKA_CAREER_HUB_URL
  LANKA_CAREER_HUB_API_KEY
"""

import json
import os
import urllib.error
import urllib.request

WEBSITE_URL = os.getenv("LANKA_CAREER_HUB_URL") or os.getenv("WEBSITE_URL") or "http://localhost:3000"
API_KEY = os.getenv("LANKA_CAREER_HUB_API_KEY") or os.getenv("BOT_API_KEY") or "lanka-bot-key-change-me"
TIMEOUT_SEC = int(os.getenv("LANKA_CAREER_HUB_TIMEOUT_MS", "15000")) / 1000


def build_payload(job: dict) -> dict:
    return {
        "title": job.get("title"),
        "company": job.get("company"),
        "description": job.get("description") or job.get("details") or job.get("body") or "",
        "district": job.get("district") or job.get("location") or "Colombo",
        "category": job.get("category") or job.get("job_category") or "office-admin",
        "work_type": job.get("work_type") or job.get("workType") or "onsite",
        "salary": job.get("salary"),
        "deadline": job.get("deadline") or job.get("closing_date"),
        "apply_link": job.get("apply_link") or job.get("applyLink") or job.get("url"),
        "fb_post_id": job.get("fb_post_id") or job.get("fbPostId") or job.get("post_id"),
    }


def post_job_to_website(job: dict) -> dict:
    payload = json.dumps(build_payload(job)).encode("utf-8")
    req = urllib.request.Request(
        f"{WEBSITE_URL.rstrip('/')}/api/webhook/jobs",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT_SEC) as res:
        return json.loads(res.read().decode("utf-8"))


def sync_job_to_website(job: dict, throw_on_error: bool = False) -> dict:
    """Safe sync — does not break FB flow if website fails."""
    try:
        result = post_job_to_website(job)
        if not result.get("duplicate"):
            print(f"[Lanka Career Hub] Job synced: #{result.get('id')} — {job.get('title')}")
        return {"ok": True, **result}
    except Exception as err:
        message = str(err)
        print(f"[Lanka Career Hub] Sync skipped (FB post OK): {message}")
        if throw_on_error:
            raise
        return {"ok": False, "error": message}
