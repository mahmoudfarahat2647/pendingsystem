import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_trigger_backup_workflow():
    url = f"{BASE_URL}/api/trigger-backup"
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, headers=headers, timeout=TIMEOUT)
        # Assert the request was successful (2xx)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_response = response.json()
        # Assert response contains expected keys/values indicating success
        assert "message" in json_response, "Response JSON missing 'message' key"
        assert "success" in json_response or "status" in json_response, "Response JSON missing 'success' or 'status' key"
        # Accept either explicit success boolean or status string
        if "success" in json_response:
            assert json_response["success"] is True, "Backup workflow trigger not successful"
        elif "status" in json_response:
            assert json_response["status"].lower() in ("success", "started", "triggered"), "Backup workflow status is not successful"
    except requests.RequestException as e:
        assert False, f"Request to trigger backup workflow API failed: {e}"

test_trigger_backup_workflow()