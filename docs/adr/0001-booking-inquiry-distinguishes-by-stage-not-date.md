# Booking Inquiry includes Archived Bookings and distinguishes them by Stage, not by date

Booking Inquiry answers "who is booked, and when". Restricting it to the `booking` Stage
was considered and rejected: at the time of writing, 3 Booked Vehicles sit in `booking`
while 36 sit in `archive`, so a `booking`-only calendar would hide roughly 92% of Booked
Vehicles and all five months of Booking History. Booking History is *made of* Archived
Bookings, so excluding them would empty the panel entirely.

Having included both, the calendar must tell them apart. We mute by **Stage** (Archived
Booking = muted) rather than by whether the Booking Date has passed. These are not the
same test: an Active Booking whose Booking Date is in the past is overdue work that
someone still needs to close out, and it stays bright precisely so it gets noticed. Muting
by date would hide exactly the rows most worth seeing.

## Consequences

- A day is rendered as active when it holds at least one Active Booking, evaluated across
  *all* lines for that day rather than the deduplicated representative line — a VIN may
  have one line archived and another still in `booking` on the same Booking Date, and the
  representative's Stage would otherwise decide the colour arbitrarily.
- `PendingRow.stage` is optional in the schema and cannot be trusted for this test. Lines
  are classified by which stage query returned them, not by reading the field.
- Frozen lines are excluded, matching the existing booking calendar. A frozen line can
  still carry a Booking Date, so it is invisible here. That gap predates this decision and
  is recorded as a separate concern.
