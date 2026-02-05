import uuid
import boto3
from botocore.config import Config as BotoConfig
from app.core.config import settings

_s3 = None

def s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client(
            "s3",
            region_name=settings.aws_region,
            config=BotoConfig(retries={"max_attempts": 3}),
        )
    return _s3

def new_object_key(org_id: str, filename: str) -> str:
    ext = filename.split(".")[-1].lower() if "." in filename else "bin"
    return f"uploads/{org_id}/{uuid.uuid4().hex}.{ext}"

def presign_post(org_id: str, filename: str, content_type: str = "application/octet-stream"):
    key = new_object_key(org_id, filename)
    # Preserve original filename in S3 metadata for later use as title fallback
    fields = {
        "Content-Type": content_type,
        "x-amz-meta-original-filename": filename,
    }
    conditions = [
        {"Content-Type": content_type},
        {"x-amz-meta-original-filename": filename},
        ["content-length-range", 1, 50 * 1024 * 1024],
    ]
    resp = s3().generate_presigned_post(
        Bucket=settings.s3_bucket,
        Key=key,
        Fields=fields,
        Conditions=conditions,
        ExpiresIn=settings.s3_presign_expiry,
    )
    return {"bucket": settings.s3_bucket, "key": key, "original_filename": filename, **resp}


def presign_get(key: str, expiry_seconds: int = 3600) -> str:
    """Generate a presigned URL to view/download a document from S3.

    Args:
        key: The S3 object key (e.g., "uploads/org_id/uuid.pdf")
        expiry_seconds: How long the URL should be valid (default: 1 hour)

    Returns:
        Presigned URL string
    """
    return s3().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expiry_seconds,
    )
