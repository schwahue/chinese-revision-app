# Final architecture review

**F1.** A confirmed snapshot and its revision alone cannot tell a client whether its pending review is already inside. If the upload succeeded but the acknowledgement was lost, reapplying the pending review to the snapshot temporarily doubles the visit count. Return receipts for the pending IDs at the same consistent revision, or recover the receipts before reapplying pending edits.

**F2.** The conditional snapshot proposal reduces owned infrastructure at pilot scale. Measure transfer and catch-up costs with a large personal list and a long disconnect. Polling relies on a running app, and browser data can be cleared or evicted.

**F3.** Specify the winner for simultaneous review-level changes, and a stable order for independent word additions. Both can affect which word is shown next. Duplicate custom entries, delayed reviews across a link and simultaneous first imports remain open.

**F4.** Keep the prompt ID as the completion ID; provide post-commit notifications between tabs when replacing localStorage.

The unchanged technical draft still leaves the architecture open. The [consolidated review](consolidated_review_report.md) recommends direct sync and records the checks needed before implementation.
