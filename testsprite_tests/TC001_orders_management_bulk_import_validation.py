import requests
import uuid

BASE_URL = "http://localhost:3000"
HEADERS_JSON = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_orders_management_bulk_import_validation():
    bulk_import_endpoint = f"{BASE_URL}/api/orders/bulk-import"

    # Prepare bulk import payload with two new parts, one with an attachment, one duplicate part number
    unique_part_number = str(uuid.uuid4())[:8]
    duplicate_part_number = "DUPLICATE123"

    payload = {
        "orders": [
            {
                "part_number": unique_part_number,
                "description": "New part request with attachment",
                "quantity": 10,
                "attachments": [
                    {
                        "filename": "spec_sheet.pdf",
                        "filetype": "application/pdf",
                        "content_base64": "JVBERi0xLjQKJ..."  # dummy base64 content shortened
                    }
                ]
            },
            {
                "part_number": duplicate_part_number,
                "description": "First duplicate part",
                "quantity": 5,
                "attachments": []
            },
            {
                "part_number": duplicate_part_number,
                "description": "Second duplicate part",
                "quantity": 3,
                "attachments": []
            }
        ]
    }

    # First, submit a single import with the duplicate part number once to simulate existing order
    initial_payload = {
        "orders": [
            {
                "part_number": duplicate_part_number,
                "description": "Existing part for duplicate check",
                "quantity": 1,
                "attachments": []
            }
        ]
    }
    # Create initial order to cause duplicate conflict in bulk import
    try:
        r_init = requests.post(
            bulk_import_endpoint, json=initial_payload, headers=HEADERS_JSON, timeout=TIMEOUT
        )
        assert r_init.status_code in (200, 201), f"Initial setup failed: {r_init.text}"

        # Now bulk import with duplicate and validate response
        r = requests.post(bulk_import_endpoint, json=payload, headers=HEADERS_JSON, timeout=TIMEOUT)
        assert r.status_code == 400 or r.status_code == 409, "Expected conflict or validation error for duplicates"

        response_json = r.json()
        assert "duplicates" in response_json or "errors" in response_json, "Expected duplicate validation info in response"

        duplicates_reported = response_json.get("duplicates", []) or response_json.get("errors", [])
        assert any(
            dup.get("part_number") == duplicate_part_number for dup in duplicates_reported
        ), "Duplicate part number not reported in the response"

        # Also test attachment support for unique part
        # Assuming the API returns details about successfully created orders
        # If the API allows partial success: check that unique part with attachment was accepted
        success_orders = response_json.get("success", []) if "success" in response_json else []
        unique_part_created = any(
            order.get("part_number") == unique_part_number for order in success_orders
        )
        if r.status_code == 200:
            assert unique_part_created, "Unique part with attachment was not successfully imported"

    finally:
        # Cleanup: Delete all created orders by part_number
        def delete_order_by_part_number(part_number):
            search_endpoint = f"{BASE_URL}/api/orders/search"
            delete_endpoint = f"{BASE_URL}/api/orders"

            # Search orders by part number to get their IDs
            resp_search = requests.get(
                search_endpoint, params={"part_number": part_number}, headers=HEADERS_JSON, timeout=TIMEOUT
            )
            if resp_search.status_code != 200:
                return
            orders_found = resp_search.json().get("orders", [])
            for order in orders_found:
                order_id = order.get("id")
                if order_id:
                    requests.delete(f"{delete_endpoint}/{order_id}", headers=HEADERS_JSON, timeout=TIMEOUT)

        delete_order_by_part_number(duplicate_part_number)
        delete_order_by_part_number(unique_part_number)

test_orders_management_bulk_import_validation()