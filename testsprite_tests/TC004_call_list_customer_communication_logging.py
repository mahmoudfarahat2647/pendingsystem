import requests
import uuid

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def test_call_list_customer_communication_logging():
    # Step 1: Create a new call entry to test tracking and logging
    create_payload = {
        "customerName": f"Test Customer {uuid.uuid4()}",
        "phoneNumber": "123-456-7890",
        "callStatus": "pending",
        "callNotes": "Initial test call log"
    }
    created_call = None
    try:
        resp_create = requests.post(f"{BASE_URL}/api/call-list", json=create_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp_create.status_code == 201, f"Expected 201 Created, got {resp_create.status_code}"
        created_call = resp_create.json()
        assert "id" in created_call, "Response JSON must contain 'id'"
        call_id = created_call["id"]

        # Step 2: Retrieve the call list and verify the created call is present
        resp_list = requests.get(f"{BASE_URL}/api/call-list", headers=HEADERS, timeout=TIMEOUT)
        assert resp_list.status_code == 200, f"Expected 200 OK, got {resp_list.status_code}"
        calls = resp_list.json()
        assert isinstance(calls, list), "Call list response should be a list"
        found_call = next((c for c in calls if c.get("id") == call_id), None)
        assert found_call is not None, "Created call not found in call list"
        assert found_call.get("callStatus") == "pending", "Call status should be 'pending'"
        assert found_call.get("callNotes") == create_payload["callNotes"], "Call notes should match the created payload"

        # Step 3: Update the call status and notes to simulate communication logging
        update_payload = {
            "callStatus": "completed",
            "callNotes": "Call completed successfully and communication logged"
        }
        resp_update = requests.put(f"{BASE_URL}/api/call-list/{call_id}", json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert resp_update.status_code == 200, f"Expected 200 OK on update, got {resp_update.status_code}"
        updated_call = resp_update.json()
        assert updated_call.get("callStatus") == "completed", "Call status update failed"
        assert updated_call.get("callNotes") == update_payload["callNotes"], "Call notes update failed"

        # Step 4: Verify the updated call in the list again
        resp_list_after_update = requests.get(f"{BASE_URL}/api/call-list", headers=HEADERS, timeout=TIMEOUT)
        assert resp_list_after_update.status_code == 200, f"Expected 200 OK, got {resp_list_after_update.status_code}"
        calls_after_update = resp_list_after_update.json()
        updated_found_call = next((c for c in calls_after_update if c.get("id") == call_id), None)
        assert updated_found_call is not None, "Updated call not found in call list"
        assert updated_found_call.get("callStatus") == "completed", "Updated call status should be 'completed'"
        assert updated_found_call.get("callNotes") == update_payload["callNotes"], "Updated call notes should match"

    finally:
        # Clean up created resource
        if created_call and "id" in created_call:
            requests.delete(f"{BASE_URL}/api/call-list/{created_call['id']}", headers=HEADERS, timeout=TIMEOUT)

test_call_list_customer_communication_logging()