# MedLens AI Security Specification

## 1. Data Invariants
- **User Ownership & Isolation**: Every scan document in `/users/{userId}/scans/{scanId}` must strictly belong to the authenticated user where `request.auth.uid == userId` and `incoming().userId == request.auth.uid`.
- **No Cross-User Access**: No user may read, list, update, or delete another user's scan documents or profile documents.
- **Strict Keys & Size Limits**: Document fields must obey strict bounds (e.g., medicine name <= 200 chars, extracted text <= 10000 chars, summary <= 5000 chars).
- **Default Deny Catch-All**: All unlisted paths are blocked by default (`match /{document=**} { allow read, write: if false; }`).
- **No Blanket Lists**: List queries must be scoped to the authenticated user's subcollection or filtered by user ID.

## 2. The Dirty Dozen Payloads (Targeting Exploits)
1. **Cross-Tenant Impersonation**: User A attempts to write to `/users/{userB_id}/scans/{scan1}`. Target: `PERMISSION_DENIED`.
2. **Missing Auth Write**: Unauthenticated client attempts to create a scan document. Target: `PERMISSION_DENIED`.
3. **Payload Injection (Oversized string)**: Attempt to inject a 100KB payload into `medicineName`. Target: `PERMISSION_DENIED`.
4. **Path Variable Mismatch**: Authenticated User A tries to write a scan document where `incoming().userId = 'attacker_id'`. Target: `PERMISSION_DENIED`.
5. **Unauthorized Read**: User A tries to fetch `/users/{userB_id}` profile or scan document. Target: `PERMISSION_DENIED`.
6. **Global Query Leak**: User A attempts a collection group query or blanket query across all users' scans without filtering by `request.auth.uid`. Target: `PERMISSION_DENIED`.
7. **Ghost Field Mutation**: Writing unallowed administrative fields like `role: 'superadmin'`. Target: `PERMISSION_DENIED`.
8. **Malicious ID Poisoning**: Using non-alphanumeric or path-traversal document ID `../../admins/hack`. Target: `PERMISSION_DENIED`.
9. **Anonymous Spoofing**: Writing without a valid verified identity token. Target: `PERMISSION_DENIED`.
10. **Array Flooding**: Inserting an unbounded array with 10,000 items in `uses`. Target: `PERMISSION_DENIED`.
11. **Type Confusion**: Passing a boolean or array where a string title is required in `medicineName`. Target: `PERMISSION_DENIED`.
12. **Tampering with Immutable Timestamps / Identity**: Attempting to mutate `userId` on existing scan record. Target: `PERMISSION_DENIED`.
