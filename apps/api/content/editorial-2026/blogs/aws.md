Small teams do not need a smaller version of a large enterprise platform. They need a system they can understand, operate, and recover when something goes wrong.

The useful question is not "How many AWS services can we use?" It is "What does this product need to stay available, protect its data, and ship changes safely?"

## Start with constraints, not a service list

Write down the workload, traffic expectations, recovery requirements, and people who will operate it. A public portfolio, a subscription product, and a payment platform have different failure costs.

My starting checklist is deliberately short:

- What data would be painful or impossible to recreate?
- How much downtime can users tolerate?
- Who gets the alert, and can they act on it?
- What must remain private?
- Which parts can be managed instead of maintained by the team?

Treat architecture as a set of explicit trade-offs. The [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html) is a useful review lens, not a reason to add services before they solve a real problem.

## A practical starting architecture

A straightforward web application can begin with a load balancer, a small application tier, a relational database, and object storage for files. Use a deployment pipeline that produces a reproducible artifact and checks the new instance before sending it traffic.

Keep the database off the public internet. Allow connections from the application security group rather than from broad IP ranges. Use roles and narrowly scoped permissions for service access; do not put cloud credentials into frontend bundles.

```text
Browser -> HTTPS entry point -> Application
                                  |-- Private database
                                  |-- Object storage
                                  `-- Logs and metrics
```

This is a conceptual baseline, not a complete network design. Availability zones, private-subnet egress, load-balancer costs, and database configuration still need a workload-specific decision.

## Backups and availability solve different problems

A standby database helps with certain infrastructure failures. A backup helps recover data after deletion, corruption, or a bad application change. Neither replaces the other.

RDS provides [automated backups and point-in-time recovery](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html). Choose retention intentionally and test a restore to a separate instance. A backup that nobody has restored is an untested assumption.

For workloads that justify it, [Multi-AZ DB instance deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html) add a standby for availability. Do not assume that standby is a read-scaling replica. Separate the availability decision from the reporting or read-throughput decision.

## Make failure visible

Start with signals that correspond to user pain: failed requests, latency, database connection pressure, and unsuccessful background jobs. Include a correlation ID in logs so a request can be followed across the application.

An alert should have an owner and a first action. "CPU is high" is less useful than "Requests are failing; check application saturation and database connections." Keep a short runbook beside each important alarm.

## Scale when the evidence asks for it

Avoid solving hypothetical scale with more moving parts. A queue may help absorb spikes; a cache may reduce expensive repeated reads; additional instances may improve availability. Add each with a measurable purpose and a clear failure behavior.

Before adding capacity, look for slow queries, oversized payloads, connection leaks, and deployments that temporarily double memory use. A bigger instance can hide a problem without resolving it.

## The operating checklist

Before calling the system production-ready, rehearse a failed deployment, a database restore, and a credential rotation. Record the steps another engineer would need to follow.

The best small-team architecture is not the simplest diagram. It is the smallest system that meets the product's requirements and can be operated with confidence.
