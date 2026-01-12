import requests
import uuid
import time

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS = {"Content-Type": "application/json"}

def test_booking_system_multi_customer_vin_grouping():
    # Step 1: Create a booking with multi-customer VIN grouping
    booking_payload = {
        "appointmentDate": "2026-02-20T10:00:00Z",
        "groupName": f"TestGroup-{uuid.uuid4()}",
        "customers": [
            {
                "customerId": str(uuid.uuid4()),
                "name": "Customer One",
                "vins": ["1HGBH41JXMN109186", "1HGCM82633A004352"]
            },
            {
                "customerId": str(uuid.uuid4()),
                "name": "Customer Two",
                "vins": ["2T1BURHE5JC045678", "3N1AB7AP5KY123456"]
            }
        ]
    }

    booking_id = None
    try:
        # Create booking
        create_resp = requests.post(
            f"{BASE_URL}/api/bookings",
            json=booking_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Failed to create booking: {create_resp.text}"
        booking_data = create_resp.json()
        booking_id = booking_data.get("bookingId")
        assert booking_id, "bookingId missing in response"

        # Step 2: Retrieve the created booking and verify multi-customer VIN grouping
        get_resp = requests.get(
            f"{BASE_URL}/api/bookings/{booking_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 200, f"Failed to get booking: {get_resp.text}"
        fetched_booking = get_resp.json()
        assert fetched_booking.get("groupName") == booking_payload["groupName"]
        customers = fetched_booking.get("customers")
        assert isinstance(customers, list) and len(customers) == 2, "Customers data incorrect"
        vin_lists = [set(c.get("vins", [])) for c in customers]
        expected_vins = [set(c["vins"]) for c in booking_payload["customers"]]
        assert vin_lists == expected_vins, "VIN grouping mismatch"

        # Step 3: Retrieve booking history to confirm entry recorded accurately
        history_resp = requests.get(
            f"{BASE_URL}/api/bookings/{booking_id}/history",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert history_resp.status_code == 200, f"Failed to get booking history: {history_resp.text}"
        history = history_resp.json()
        assert isinstance(history, list) and len(history) > 0, "No booking history found"
        latest_record = history[-1]
        assert latest_record.get("bookingId") == booking_id
        assert latest_record.get("action") == "created"
        assert "timestamp" in latest_record

    finally:
        # Clean up: delete the created booking if exists
        if booking_id:
            try:
                del_resp = requests.delete(
                    f"{BASE_URL}/api/bookings/{booking_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
                # Allow 404 if already deleted
                assert del_resp.status_code in (200, 204, 404), f"Failed to delete booking: {del_resp.text}"
            except Exception:
                pass

test_booking_system_multi_customer_vin_grouping()
