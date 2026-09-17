# Security Specification - OptikCam

## Data Invariants
1. A lens must have a brand and a name.
2. Prices cannot be negative.
3. Catalog updates are restricted to administrators.
4. Processed file records track which files have been scanned to avoid redundant AI costs.

## Access Control
- **Public**: Can read the catalog and discounts.
- **Admin**: Can create/update/delete catalog items, discounts, and processed file records.
- **Users**: (Future) Could have private custom lists, but currently everything is shared/admin-managed.

## The "Dirty Dozen" Payloads
1. Create lens without `updatedAt`.
2. Update lens and change `id`.
3. Set price to -100.
4. Update a lens from a non-admin account.
5. Inject 1MB string into `notes`.
6. Create lens with invalid `productType`.
7. Delete the entire catalog as a public user.
8. Modify `sourceFileId` of a lens to point to a malicious script.
9. Bypass `processedFiles` to re-trigger expensive scans (if backend was vulnerable, but rules protect the state).
10. Spoof `admin` role in auth token (blocked by rule logic checking DB).
11. Create a lens with a 2000 character `name`.
12. Bulk update prices with a `multiplier` of 1000x.

## Rules Draft
(See firestore.rules)
