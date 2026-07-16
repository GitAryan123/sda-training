# Database Architecture Guide

## Overview
This project uses a hybrid database approach:

- MongoDB for flexible, document-oriented data.
- PostgreSQL for relational data with strong consistency and transactional safety.

This architecture allows each workload to use the storage model that fits it best instead of forcing one database to solve every problem.

## Design Goals
- Keep core business transactions consistent and auditable.
- Support fast iteration for features with evolving data shape.
- Maintain predictable performance under read and write growth.
- Reduce operational risk by applying clear ownership boundaries per datastore.

## Hybrid Database Strategy

### When To Use MongoDB
Use MongoDB when:

- Data structure changes frequently.
- You need nested or semi-structured documents.
- Reads benefit from denormalized data in a single document.
- You are storing event payloads, logs, or user-generated metadata.

Typical examples:

- Activity feeds
- Product catalog metadata
- User preferences and settings

### When To Use PostgreSQL
Use PostgreSQL when:

- Data has strong relationships and constraints.
- You need ACID transactions across multiple tables.
- Reporting requires joins, aggregation, and strong integrity.
- You need strict validation and referential consistency.

Typical examples:

- Users and authentication records
- Orders, payments, and inventory transactions
- Permission and role mappings

### Decision Matrix
| Requirement | MongoDB | PostgreSQL |
|---|---|---|
| Flexible schema | Excellent | Moderate |
| Complex joins | Limited | Excellent |
| Transaction-heavy workflows | Good (limited scope) | Excellent |
| Horizontal write scaling | Strong | Good |
| Strict relational integrity | Limited | Excellent |

## Data Consistency Model

### Strong Consistency
Use PostgreSQL for workflows where correctness must be immediate:

- Payment captured and order confirmed
- Stock decrement after checkout
- User role or permission changes

### Eventual Consistency
Use asynchronous synchronization between databases for derived or non-critical views.

Recommended pattern:

1. Write source-of-truth records to PostgreSQL.
2. Publish an event describing the change.
3. Update MongoDB read models asynchronously.
4. Make handlers idempotent to tolerate retries.

## MongoDB Best Practices

### Schema Design
- Embed child objects when they are small and always read together.
- Use references when child data grows independently or is reused.
- Add explicit version fields for documents with evolving schema.

### Indexing
- Start with single-field indexes for high-selectivity filters.
- Use compound indexes that match query filter order.
- Add text indexes only for search-focused fields.
- Review index usage regularly and remove unused indexes.

### Query Optimization
- Use projection to return only required fields.
- Prefer bounded queries and pagination over full scans.
- Use aggregation pipelines carefully; keep stages selective early.

### Connection Management
- Use a shared connection pool per service instance.
- Configure pool size based on service concurrency.
- Track connection errors, latency, and slow queries.

## PostgreSQL Best Practices

### Schema Design
- Normalize transactional data to reduce anomalies.
- Use explicit foreign keys for referential integrity.
- Keep naming consistent and migration-driven.

### Indexing
- Use B-tree indexes for most equality and range queries.
- Use GIN for JSONB and full-text search cases.
- Add partial indexes for frequently filtered subsets.

### Query Optimization
- Use `EXPLAIN ANALYZE` for expensive queries.
- Avoid `SELECT *` in high-traffic paths.
- Verify index usage and watch for sequential scans on large tables.

### Connection Management
- Use a pooler strategy suitable for your runtime (application pool or PgBouncer).
- Set statement and idle timeouts.
- Monitor lock contention and long-running transactions.

### Data Integrity
- Enforce `NOT NULL`, `UNIQUE`, `CHECK`, and foreign key constraints.
- Use transactions for multi-step state changes.
- Reserve triggers for cross-cutting enforcement that cannot be handled in application code.

## Cross-Database Operational Practices
- Define one source of truth per entity.
- Use consistent ID strategy across MongoDB and PostgreSQL.
- Add tracing metadata to sync events for debugging.
- Create backup and restore procedures for both datastores.
- Document retention and archival policies by data type.

## Security And Compliance
- Encrypt data in transit and at rest.
- Use least-privilege database users for each service.
- Rotate credentials and store secrets outside source control.
- Log access to sensitive records where required.

## Suggested Next Improvements
- Add an ER diagram for PostgreSQL entities.
- Add a MongoDB collection relationship map.
- Define concrete SLOs for query latency and error rate.
