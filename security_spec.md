# Security Specification for Nusantara Pepper

## Data Invariants
1. Products must have a valid name, grade, and moisture level.
2. Inquiries must have a valid sender email and message.
3. Only authorized admin emails (`pramukapattimura@gmail.com`, `min8ciamis@gmail.com`, `yasidaifada@gmail.com`) can perform write operations on products, slides, and settings, and manage inquiries.
4. Public can only read products and create inquiries.

## The Dirty Dozen Payloads (Expect PERMISSION_DENIED)
1. **Unauthorized Product Create**: {} as anonymous.
2. **Product Spoof**: Create product with `name: 'Fake'` with logged-in non-admin user.
3. **Ghost Field Update**: Admin update product with `is_verified: true` (unauthorized field).
4. **ID Poisoning**: Create product with ID `junk_1.5kb_string...`.
5. **Inquiry Sniffing**: Anonymous user tries to `list` /inquiries.
6. **Inquiry Modification**: Anonymous user tries to `update` an existing inquiry.
7. **Cross-User Inquiry Read**: Non-admin user tries to `get` an inquiry they did not send.
8. **PII Leak**: Non-admin tries to read `email` field of all inquiries.
9. **Admin Spoofing**: User with email `attacker@gmail.com` tries to write to `/products`.
10. **Timestamp Fraud**: Create inquiry with `createdAt` as a past date from client.
11. **Resource Exhaustion**: Create inquiry with 2MB message field.
12. **Status Bypass**: Non-admin user tries to create an inquiry with `status: 'replied'`.

## Test Runner (Simplified Concept)
See `firestore.rules.test.ts` for detailed assertions.
