"""IT8530 Phase 1 bridge: analyse only the two prepared feature records.

No arbitrary file paths, uploads, executable execution, LLM, OpenClaw or Gitea actions.
This is a minimal integration milestone, not the final orchestration layer.
"""
from datetime import datetime, timezone
import json
import math
from pathlib import Path
from typing import Callable
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


class ScanRequest(BaseModel):
    sample_id: str


def create_mobile_router(predict: Callable, request_type: type, example_dir: Path) -> APIRouter:
    router = APIRouter(prefix="/api", tags=["IT8530 Mobile - Phase 1"])
    samples = {
        "benign-example": {
            "id": "benign-example",
            "name": "benign_example.json",
            "description": "Prepared benign feature record (242 features)",
            "filename": "benign_example.json",
        },
        "malware-example": {
            "id": "malware-example",
            "name": "malware_example.json",
            "description": "Prepared malware feature record (242 features)",
            "filename": "malware_example.json",
        },
    }
    # Temporary in-memory history: restarts clear it. Replace with persistent storage later.
    scans: dict[str, dict] = {}

    @router.get("/samples")
    def list_samples():
        return [{k: v for k, v in sample.items() if k != "filename"} for sample in samples.values()]

    @router.post("/scans", status_code=201)
    def start_scan(request: ScanRequest):
        sample = samples.get(request.sample_id)
        if sample is None:
            raise HTTPException(status_code=404, detail="Unknown prepared sample ID")
        path = example_dir / sample["filename"]  # Server-controlled allowlist, never user path
        try:
            with path.open(encoding="utf-8") as f:
                features = json.load(f)
            # Call the actual IT8532 model; this is NOT a simulated prediction.
            result = predict(request_type(**features))
            probability = result["malware_probability"]
            threshold = result["decision_threshold"]
            if not all(math.isfinite(v) for v in (probability, threshold)):
                raise ValueError("Non-finite prediction output")
        except Exception as exc:
            # Avoid exposing internal paths, tracebacks or implementation details.
            raise HTTPException(status_code=503, detail="Prediction service unavailable or invalid") from exc

        scan_id = str(uuid4())
        near_threshold = abs(probability - threshold) <= 0.02
        record = {
            "scan_id": scan_id,
            "sample_id": sample["id"],
            "name": sample["name"],
            "status": "manual_review" if near_threshold else "completed",
            "classification": result["classification"],
            "malware_probability": probability,
            "decision_threshold": threshold,
            "human_review_required": near_threshold,
            "scanned_at": datetime.now(timezone.utc).isoformat(),
            "source": "real_xgboost_pre_extracted_features",
        }
        scans[scan_id] = record
        return record

    @router.get("/scans/{scan_id}")
    def get_scan(scan_id: str):
        record = scans.get(scan_id)
        if record is None:
            raise HTTPException(status_code=404, detail="Scan not found")
        return record

    return router
