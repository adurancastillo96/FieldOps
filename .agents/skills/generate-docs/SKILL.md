---
name: generate-docs
description: >
  Use me to generate or update project documentation.
  I create docs from code, specs, and existing documentation.
  Outputs go to docs/ directory.
tools: [Read, Write, Glob, Grep]
---

# Skill: Generate Documentation

Create or update project documentation from source code and specs.

## Steps

1. Identify what needs documentation (specified module, API, or full project)
2. Read relevant source code and spec files
3. Generate documentation following `.agents/rules/style.md`
4. Include:
   - Purpose and overview
   - API reference (if applicable)
   - Usage examples
   - Configuration options
   - Common pitfalls
5. Place output in appropriate location under `docs/`
6. Update cross-references in other docs if needed

## Documentation Standards
- Use clear, concise language
- Include runnable code examples
- Document all public APIs
- Keep headings hierarchical (h1 > h2 > h3)
- Link to related specs and code files

## Constraints
- Don't duplicate content that exists in spec/ — reference it instead
- Keep docs in sync with code: if code changed, update docs
- Use consistent terminology throughout
