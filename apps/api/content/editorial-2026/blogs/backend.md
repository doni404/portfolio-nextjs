Microservices are not a starting requirement. They are an organizational and operational choice. Before splitting a backend, identify the business boundary and the team that will own it.

gRPC can make communication between services explicit, but a typed interface does not remove distributed-system failure modes.

## Find a boundary worth operating

Group behavior around a capability: reservations, identity, billing, or notifications. Avoid creating a service for every database table.

A useful boundary has a coherent responsibility, an owner, and a reason to evolve independently. If two services must change together for every feature, reconsider whether the split is helping.

For a small team, a modular application can preserve those boundaries without the deployment and networking overhead of separate services. Extract a module when independent scaling, ownership, or isolation justifies the cost.

## Make the contract explicit

A Protocol Buffers contract should describe a business operation rather than mirror an internal table. Keep transport messages separate from persistence entities so storage changes do not leak into every caller.

```protobuf
syntax = "proto3";

service ReservationService {
  rpc GetReservation(GetReservationRequest) returns (Reservation);
}

message GetReservationRequest {
  string reservation_id = 1;
}

message Reservation {
  string reservation_id = 1;
  string status = 2;
}
```

This is an illustrative contract, not the complete Trajectory implementation. A real API also needs authorization, error semantics, validation, and a compatibility policy.

## Every call needs a time budget

A caller should decide how long it is willing to wait. The [gRPC deadline guide](https://grpc.io/docs/guides/deadlines/) explains that calls do not receive a deadline by default and that application code should set realistic deadlines.

Use one end-to-end budget instead of allowing each downstream hop a fresh, generous timeout. Propagate cancellation and stop expensive work when the caller no longer needs the answer.

Distinguish "not found," "not authorized," "temporarily unavailable," and "deadline exceeded." Mapping every failure to an internal error makes both recovery and monitoring harder.

## Retries are a business decision

The [gRPC retry guide](https://grpc.io/docs/guides/retry/) describes configurable retry behavior. Decide which operations are safe to repeat before enabling it.

A read may be repeatable. A create operation needs an idempotency strategy before a lost response can safely trigger another request. A client cannot tell from a timeout alone whether the server committed the operation.

Avoid nested retry policies that multiply attempts across several services. Put retry ownership in one place, use a bounded budget, and expose exhausted attempts in telemetry.

## Keep data ownership visible

Each capability should own the meaning of its data. Prefer asking the owning service for a business operation over having another service update its tables directly.

Cross-service workflows often need a recorded progression rather than one giant transaction. Make intermediate states, compensating actions, and reconciliation visible. Not every workflow needs a complex orchestration framework, but every workflow needs a recovery story.

## Ship with an operational contract

A service is more than its RPC definitions. Document deployment, health checks, dependency failures, logs, and the person who responds when it breaks.

Track request IDs across calls. Measure latency and errors by operation. Exercise a downstream outage before users discover the behavior for you.

Good service boundaries reduce coordination. When they instead create more coordination, the design deserves another look.
