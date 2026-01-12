import requests
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:3000"
HEADERS = {
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_archive_history_retention_and_compliance():
    archive_endpoint = f"{BASE_URL}/api/archive"
    resource_id = None

    # Create an archive record with documented archived reason
    create_payload = {
        "data": {
            "item": "Test Item Compliance",
            "archivedReason": "Regulatory compliance retention test",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }

    try:
        # Create archive record
        create_resp = requests.post(archive_endpoint, json=create_payload, headers=HEADERS, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Expected 201 Created, got {create_resp.status_code}"
        created_data = create_resp.json()
        resource_id = created_data.get("id")
        assert resource_id is not None, "Archive record ID not returned"

        # Retrieve the archive record immediately and validate immutability attributes
        get_resp = requests.get(f"{archive_endpoint}/{resource_id}", headers=HEADERS, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 OK on fetch, got {get_resp.status_code}"
        archive_record = get_resp.json()
        assert archive_record.get("archivedReason") == create_payload["data"]["archivedReason"], "Archived reason mismatch"
        assert "timestamp" in archive_record, "Timestamp missing in archive record"
        created_timestamp = datetime.fromisoformat(archive_record["timestamp"].replace("Z", "+00:00"))

        # Check that record is immutable: attempt to update archivedReason should fail (e.g., 400 or 403)
        update_payload = {"archivedReason": "Changed reason"}
        update_resp = requests.put(f"{archive_endpoint}/{resource_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert update_resp.status_code in {400, 403, 405, 409}, "Archive record should be immutable but update succeeded"

        # Verify retention period: record timestamp must not be older than 48 hours
        now_utc = datetime.utcnow()
        retention_period = timedelta(hours=48)
        age = now_utc - created_timestamp
        assert age <= retention_period, f"Archive record exceeds retention period of 48 hours (age: {age})"

        # Optionally retrieve list and check the archived record presence and compliance fields
        list_resp = requests.get(archive_endpoint, headers=HEADERS, timeout=TIMEOUT)
        assert list_resp.status_code == 200, "Failed to get archive list"
        archive_list = list_resp.json()
        found = False
        for rec in archive_list:
            if rec.get("id") == resource_id:
                found = True
                assert "archivedReason" in rec, "Archived reason missing in list record"
                assert "timestamp" in rec, "Timestamp missing in list record"
                break
        assert found, "Created archive record not found in archive list"

    finally:
        # Cleanup: delete the created archive record if possible
        if resource_id:
            del_resp = requests.delete(f"{archive_endpoint}/{resource_id}", headers=HEADERS, timeout=TIMEOUT)
            assert del_resp.status_code in {200, 204, 404}, f"Unexpected delete status code: {del_resp.status_code}"

test_archive_history_retention_and_compliance()