# pendingsystem

Logistics for automotive parts: each ordered part travels a pipeline of workflow stages
until the vehicle is brought in and the work is closed out. This glossary fixes the language
used across that pipeline. It is a glossary only — no implementation detail belongs here.

## Language

**Stage**:
The position of a part in the workflow. One of `orders`, `main`, `call`, `booking`,
`archive`, or `freeze`.
_Avoid_: status, state, step, phase

### Booking

**Booking**:
A commitment to bring one vehicle in on a given day so its parts can be fitted.
_Avoid_: appointment, reservation, slot

**Booking Date**:
The calendar day a vehicle is expected. One day, never a time of day.
_Avoid_: scheduled date, due date, appointment time

**Booked Vehicle**:
One vehicle on one Booking Date — identified by VIN, not by customer name. The unit
counted on the calendar. A customer with two vehicles on the same day is two Booked
Vehicles; one vehicle needing four parts is one.
_Avoid_: booking count, customer count, part count

**Active Booking**:
A Booking whose parts are still in the `booking` Stage — not yet closed out, whatever
its Booking Date. An Active Booking with a past Booking Date is overdue, not finished.
_Avoid_: upcoming booking, open booking, future booking

**Archived Booking**:
A Booking whose parts have reached the `archive` Stage. Completion is determined by
Stage, never by whether the Booking Date has passed.
_Avoid_: past booking, old booking, completed appointment

**Booking Inquiry**:
The read-only calendar view answering "who is booked, and when". It only ever displays
Bookings; it never creates or changes one.
_Avoid_: booking calendar, booking viewer, schedule modal

**Booking History**:
Every Booking Date recorded against a given VIN, across all Stages shown.
_Avoid_: past visits, customer timeline
