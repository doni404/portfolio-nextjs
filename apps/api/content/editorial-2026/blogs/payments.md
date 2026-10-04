A webhook is not just an HTTP request. It is a delivery attempt for an event that may arrive late, arrive twice, or describe a state your application has already moved beyond.

Reliable payment integration starts by treating delivery and business processing as separate responsibilities.

## Verify before trusting

Authenticate the delivery using the provider's documented verification mechanism. For Stripe, signature verification depends on the original request bytes; parsing and re-serializing JSON can invalidate the signature. Follow the [official webhook guide](https://docs.stripe.com/webhooks) for the SDK and endpoint version you use.

Other providers have different signing headers, certificate checks, or verification APIs. A shared business event model can be useful, but the verification adapter must remain provider-specific.

Do not log signing secrets or full payment payloads. Keep only the fields needed for diagnosis, with an intentional retention policy.

## Accept durably, then acknowledge

The receiver should verify the event and store it durably before returning success. Slow work belongs in a worker, not in the request path.

```text
Verify delivery
    -> Persist event with unique provider/event key
    -> Acknowledge receipt
    -> Worker applies business transition
    -> Mark event processed
```

This outline omits implementation details on purpose. Your database transaction, queue publishing, and worker acknowledgement need to agree on where an accepted event becomes durable. A transactional outbox is one option when a database write and a queue publish would otherwise fail independently.

## Duplicate delivery is normal

A unique event key prevents the same provider event from being accepted twice. It does not automatically prevent duplicate business effects from two different events about the same payment.

Design both layers:

1. **Delivery idempotency:** one stored record per provider event ID.
2. **Business idempotency:** one valid state transition or ledger effect per business operation.

Use a database constraint, not a check-then-insert race, to enforce uniqueness. Keep the state update and its processing marker in a transaction where practical.

## Do not infer ordering from arrival time

Stripe documents that event order is not guaranteed. A failed delivery can arrive after a newer successful one.

Model payment states explicitly. Reject impossible backwards transitions, distinguish pending from final states, and retrieve the authoritative provider object when an event alone is insufficient to resolve the state.

For an example subscription flow, "payment succeeded" and "access provisioned" should be separate recorded facts. This makes a provisioning failure visible without pretending the payment failed.

## Retries need limits and visibility

Make retryable failures different from permanent failures. A temporary database outage may deserve another attempt; an unsupported event type may not.

Use bounded retries with backoff, then move exhausted work into a reviewable failed state. Keep a controlled replay path with an audit trail. Replaying an event should not mean manually modifying financial state.

Observe event age, processing failures, duplicate deliveries, and reconciliation mismatches. Queue depth alone does not tell you whether important events are stuck.

## Reconcile independently

Webhooks are a fast notification path, not the only source of truth. Periodically compare your payment records with provider records and investigate differences.

Test duplicates, reversed arrival order, timeouts, worker crashes, and a database failure after verification. The happy path is only one of the paths that production will take.

A dependable payment workflow is one where a repeated event is harmless, a missing event is detectable, and recovery does not require guesswork.
