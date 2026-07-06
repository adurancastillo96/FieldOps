# Database Schema

## Database Engine
<!-- PostgreSQL / MySQL / MongoDB / SQLite / etc. -->

## Schema Diagram
```
<!-- ASCII or mermaid ER diagram -->
```

## Tables

### table_name
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Primary key |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_table_name_column` on (`column`)

**Relations:**
- `column_id` → `other_table.id` (FK, ON DELETE CASCADE)

---

<!-- Add more tables as they are specified -->

## Migrations
Migrations are managed in `src/migrations/` (or project-specific path).
See `.agents/skills/db-migrate.md` for migration workflow.

## Conventions
- Table names: `snake_case`, plural
- Column names: `snake_case`
- All tables have: `id`, `created_at`, `updated_at`
- Soft deletes: use `deleted_at` column when applicable
- Use UUIDs for primary keys (not auto-increment integers)
