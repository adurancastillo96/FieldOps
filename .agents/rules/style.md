# Style Guide

Formatting, naming, and documentation standards.

## Code Formatting
- Use the project's formatter (Prettier, Black, gofmt, etc.)
- Indent: 2 spaces (JS/TS/YAML) or 4 spaces (Python) or language default
- Max line length: 100 characters
- Trailing newline at end of file
- No trailing whitespace
- Use consistent quote style (single or double — pick one)

## Documentation in Code
- Every public function/method: JSDoc/docstring with description
- Complex logic: inline comment explaining *why*
- TODO format: `// TODO(author): description — refs TXXX`
- FIXME format: `// FIXME(author): description — refs TXXX`
- Don't comment obvious code
- Keep comments up to date when code changes

## Markdown Files
- One sentence per line (for better diffs)
- Use ATX headers (`#` not underline style)
- Use fenced code blocks with language identifier
- Tables: use consistent alignment
- Links: prefer relative paths within the project
- Keep line length readable (< 120 characters)

## File Organization
- Group related files in directories
- Use `index` files sparingly — prefer explicit imports
- Test files: mirror source file structure in `tests/`
- Name test files: `<module>.test.<ext>` or `test_<module>.<ext>`

## API Design (if applicable)
- Use RESTful conventions
- Resource naming: plural nouns (`/users`, not `/user`)
- Use proper HTTP methods and status codes
- Version APIs: `/api/v1/`
- Consistent error response format
- Pagination: cursor-based or offset-based (document choice)
