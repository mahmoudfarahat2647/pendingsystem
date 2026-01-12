import requests

BASE_URL = "http://localhost:3000"
SEARCH_ENDPOINT = f"{BASE_URL}/api/search"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_search_functionality_cross_tab_accuracy():
    # Sample queries to test cross-tab search accuracy across VIN, Customer Name, Part Number, and Company fields
    test_queries = {
        "vin": "1HGCM82633A004352",
        "customer_name": "John Doe",
        "part_number": "PN-12345-XYZ",
        "company": "Auto Parts Co"
    }

    for field, query in test_queries.items():
        try:
            response = requests.post(
                SEARCH_ENDPOINT,
                json={"query": query},
                headers=HEADERS,
                timeout=TIMEOUT
            )
            response.raise_for_status()
        except requests.RequestException as e:
            assert False, f"HTTP request failed for {field} search with error: {e}"

        data = response.json()
        # Validate that response is a list (search results)
        assert isinstance(data, list), f"Expected list of results for {field} search, got {type(data)}"

        # At least one matching result is expected for each query
        assert len(data) > 0, f"No results found for {field} search with query '{query}'"

        # Check that each returned result contains the query term in the relevant field (case insensitive)
        matched_items = 0
        for item in data:
            if field == "vin" and "vin" in item and query.lower() in item["vin"].lower():
                matched_items += 1
            elif field == "customer_name" and "customerName" in item and query.lower() in item["customerName"].lower():
                matched_items += 1
            elif field == "part_number" and "partNumber" in item and query.lower() in item["partNumber"].lower():
                matched_items += 1
            elif field == "company" and "company" in item and query.lower() in item["company"].lower():
                matched_items += 1

        assert matched_items > 0, f"No results matched the {field} field for query '{query}'"

test_search_functionality_cross_tab_accuracy()
