# 📋 Cheat Sheet - Quick Commits

## Base Format

```
<type>(<scope>): <description>
```

## Common Types

```bash
feat:      # New feature
fix:       # Bug fix
docs:      # Documentation
style:     # Formatting (prettier, etc)
refactor:  # Refactoring
test:      # Tests
chore:     # Maintenance
```

## Copy-Paste Examples

### Backend

```bash
git commit -m "feat(backend): add endpoint X"
git commit -m "fix(api): fix error in endpoint Y"
git commit -m "refactor(services): improve Z logic"
```

### Database

```bash
git commit -m "feat(db): add users table"
git commit -m "fix(db): fix migration"
```

### Docker

```bash
git commit -m "fix(docker): fix configuration"
git commit -m "feat(docker): add healthcheck"
```

### Docs

```bash
git commit -m "docs: update README"
git commit -m "docs(api): document endpoints"
```

### General

```bash
git commit -m "chore: update dependencies"
git commit -m "style: format code"
git commit -m "test: add unit tests"
```

## Quick Rules

✅ Use lowercase
✅ Imperative present tense
✅ No period at end
✅ Max 100 characters

❌ NO uppercase initial
❌ NO period at end
❌ NO exceed 100 characters
