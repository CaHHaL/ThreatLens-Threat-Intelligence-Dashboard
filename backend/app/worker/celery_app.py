import os
from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Wait: Since Celery runs separately, we should just read from environment identically to API
celery_app = Celery(
    "threatlens_worker",
    broker=str(settings.REDIS_URL),
    backend=str(settings.REDIS_URL),
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Using autodiscover
    include=[
        "app.worker.collectors.nvd_collector",
        "app.worker.collectors.cisa_kev_collector",
        "app.worker.collectors.otx_collector",
        "app.worker.normalizer",
        "app.worker.tasks.mitre_scorer",
        "app.worker.tasks.alert_evaluator",
    ]
)

celery_app.conf.beat_schedule = {
    # Run all collectors every 15 minutes
    "run-nvd-collector": {
        "task": "app.worker.collectors.nvd_collector.fetch_nvd_cves",
        "schedule": crontab(minute="*/15"),
    },
    "run-cisa-kev-collector": {
        "task": "app.worker.collectors.cisa_kev_collector.fetch_cisa_kev",
        "schedule": crontab(minute="*/15"),
    },
    "run-otx-collector": {
        "task": "app.worker.collectors.otx_collector.fetch_otx_pulses",
        "schedule": crontab(minute="*/15"),
    },
    # Enrichment every 30 minutes
    "run-enrichment": {
        "task": "app.worker.normalizer.enrich_iocs",
        "schedule": crontab(minute="*/30"),
    },
    # MITRE Frequency Scoring Daily at 1 AM
    "run-mitre-scoring": {
        "task": "app.worker.tasks.mitre_scorer.score_mitre_techniques",
        "schedule": crontab(hour=1, minute=0),
    },
    # Alert Rule Evaluator
    "run-alert-evaluation": {
        "task": "app.worker.tasks.alert_evaluator.run_alert_evaluation",
        "schedule": crontab(minute="*/15"),
    }
}
