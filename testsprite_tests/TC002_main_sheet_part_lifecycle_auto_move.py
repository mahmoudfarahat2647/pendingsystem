import requests
import time

BASE_URL = "http://localhost:3000"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_main_sheet_part_lifecycle_auto_move():
    part_data = {
        "partNumber": "TEST-12345",
        "description": "Test part for lifecycle auto move",
        "status": "Pending",
        "visualIndicator": "pending-icon"
    }
    part_id = None

    try:
        # Create a new part with status "Pending"
        resp_create = requests.post(
            f"{BASE_URL}/main-sheet/parts",
            json=part_data,
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert resp_create.status_code == 201, f"Create part failed: {resp_create.text}"
        part = resp_create.json()
        part_id = part.get("id")
        assert part_id is not None, "Created part ID is None"

        # Poll and verify status changes through lifecycle and visual indicators
        expected_lifecycle = [
            ("Pending", "pending-icon"),
            ("Arrived", "arrived-icon"),
            ("Available", "available-icon"),
            ("Call List", "calllist-icon"),
        ]

        for expected_status, expected_indicator in expected_lifecycle:
            for _ in range(30):  # poll max 30 times, wait 1 second each
                resp_get = requests.get(
                    f"{BASE_URL}/main-sheet/parts/{part_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT,
                )
                assert resp_get.status_code == 200, f"Get part failed: {resp_get.text}"
                data = resp_get.json()

                current_status = data.get("status")
                current_indicator = data.get("visualIndicator")

                if current_status == expected_status and current_indicator == expected_indicator:
                    break
                time.sleep(1)
            else:
                assert False, f"Part did not transition to status '{expected_status}' with indicator '{expected_indicator}' in time"

    finally:
        if part_id:
            requests.delete(
                f"{BASE_URL}/main-sheet/parts/{part_id}",
                headers=HEADERS,
                timeout=TIMEOUT,
            )

test_main_sheet_part_lifecycle_auto_move()