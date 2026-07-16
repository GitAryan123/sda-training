# Day 10 Learnings: Database Architecture

## Key Concepts Learned
- A hybrid database strategy is practical when different workloads need different storage models.
- MongoDB is strong for flexible document data and fast iteration.
- PostgreSQL is strong for relational integrity, transactions, and structured reporting.
- Clear source-of-truth boundaries are essential when using multiple databases.

## Decision-Making Framework
- Choose MongoDB for evolving schemas, nested data, and denormalized read models.
- Choose PostgreSQL for transactional workflows, strict constraints, and relational queries.
- Avoid using one database for every problem when requirements clearly differ.

## Consistency Insights
- Strong consistency should protect critical workflows like orders, payments, and permissions.
- Eventual consistency is acceptable for derived views and non-critical read models.
- Event-driven synchronization requires idempotent consumers to handle retries safely.

## Performance And Optimization
- Indexes must reflect real query patterns, not assumptions.
- In MongoDB, compound indexes and selective projections reduce query cost.
- In PostgreSQL, `EXPLAIN ANALYZE` is essential for diagnosing slow queries.
- Connection pooling and timeout configuration are part of architecture, not just operations.

## Data Integrity And Reliability
- PostgreSQL constraints (`NOT NULL`, `UNIQUE`, foreign keys) prevent invalid states.
- Cross-database systems need consistent identifiers and traceable synchronization events.
- Backup and restore plans should be defined for each datastore independently.

## Security Learnings
- Use least-privilege credentials per service and database.
- Keep credentials out of source control and rotate them regularly.
- Encrypt data in transit and at rest as a baseline control.

## Practical Takeaway
The most important lesson is architectural fit: data storage choices should follow business and technical requirements, with consistency and operational safeguards designed from the start.
