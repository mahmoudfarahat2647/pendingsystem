import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_data_grid_sorting_filtering_virtualization():
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # Sample payload to test sorting, filtering, and virtualization features:
    # Assuming the data grid API supports POST /api/datagrid/query with body including sorting, filtering, and pagination params.
    query_payload = {
        "sort": [
            {"field": "partNumber", "order": "asc"},
            {"field": "customerName", "order": "desc"}
        ],
        "filter": {
            "status": {"operator": "eq", "value": "Available"},
            "partNumber": {"operator": "contains", "value": "ABC"}
        },
        "pagination": {
            "startRow": 0,
            "endRow": 50
        },
        "virtualization": True
    }

    response = None
    try:
        response = requests.post(
            f"{BASE_URL}/api/datagrid/query",
            headers=headers,
            json=query_payload,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    assert response is not None, "No response received"
    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Expected structure: {
    #   "rows": [...], 
    #   "lastRow": number or null,
    #   "totalCount": number
    # }
    assert isinstance(data, dict), "Response JSON root should be an object"
    assert "rows" in data, "Response missing 'rows' key"
    assert isinstance(data["rows"], list), "'rows' should be a list"
    assert "lastRow" in data, "Response missing 'lastRow' key"
    assert "totalCount" in data, "Response missing 'totalCount' key"

    # Validate sorting order on the first page of data
    rows = data["rows"]
    if len(rows) > 1:
        # Check primary sort by partNumber ascending
        part_numbers = [row.get("partNumber", "") for row in rows]
        assert part_numbers == sorted(part_numbers), "Rows are not sorted by partNumber ascending"

    # Validate filtering: all rows should have status 'Available' and 'ABC' in partNumber
    for row in rows:
        assert row.get("status") == "Available", f"Row with id {row.get('id')} has incorrect status"
        assert "ABC" in row.get("partNumber", ""), f"Row with id {row.get('id')} does not contain 'ABC' in partNumber"

    # Validate virtualization: totalCount should be >= number of returned rows and lastRow should be integer or null
    total_count = data["totalCount"]
    last_row = data["lastRow"]
    assert isinstance(total_count, int) and total_count >= len(rows), "Invalid totalCount"
    assert (isinstance(last_row, int) and last_row >= len(rows)) or last_row is None, "Invalid lastRow value"


test_data_grid_sorting_filtering_virtualization()