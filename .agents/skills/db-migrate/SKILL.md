---
name: db-migrate
description: >
  Use me to create, review, or apply database migrations.
  I ensure migrations are safe, reversible, and match the DB schema spec.
tools: [Read, Write, Bash]
---

# Skill: Database Migration

Create and manage database migrations safely.

## Steps

1. Read `spec/DB_SCHEMA.md` for the target schema state
2. Compare with current database state (from migrations or DB inspection)
3. Generate migration file(s) for the delta
4. Verify:
   - Migration is reversible (includes rollback)
   - No data loss for existing records
   - Indexes are created for frequently queried columns
   - Foreign key constraints are correct
5. Test migration on a clean database
6. Test rollback
7. Update `spec/DB_SCHEMA.md` if it's out of date

## Safety Rules
- NEVER drop a column/table without explicit human confirmation
- Always provide a rollback migration
- Large data migrations should be batched
- Add new columns as nullable or with defaults first
- Test with realistic data volumes

## Constraints
- Follow the project's migration framework conventions
- Name migrations descriptively: `NNNN-add-user-email-index`
- One logical change per migration file
