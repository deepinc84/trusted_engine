# Paginated proposal PDF manual test

1. Create and save a roofing-only estimate; create its proposal and verify preview/PDF option cards, totals, page numbers, and no internal costs.
2. Repeat with a soft-metals-only estimate and verify all enabled scope sections and no roofing requirement.
3. Repeat with a combined estimate and select optional soft-metal work; verify combined GST and total.
4. Paste several paragraphs into the roofing scope and confirm continuation pages contain every paragraph.
5. Add long terms and confirm headings stay with following text and acceptance moves to a fresh page when required.
6. Upload a private JPEG cover, save, generate the PDF, and verify the image and attribution. Repeat with PNG and verify image rendering; use WEBP to verify the clean unsupported-format placeholder fallback.
7. Reset to Street View and verify the preview attribution and graceful PDF placeholder when a server-safe image is unavailable.
8. Download the generated draft PDF and verify Letter sizing, headers, footers, and `Page X of Y`.
9. Send the proposal and verify the email attachment matches the locked revision.
10. Open the tokenized customer proposal, make valid selections, and sign once with typed and once in a new proposal with drawn signature.
11. Download the signed PDF through the customer token route and verify it says `Accepted Proposal` and contains the accepted selections.
12. Verify page numbering is sequential and the reported total equals the physical page count.
13. Compare long source text to PDF text and confirm no content is omitted or outside margins.
14. Search the PDF for supplier, labour cost, material cost, source reference, profit, margin, token, and private storage path; none should occur.
