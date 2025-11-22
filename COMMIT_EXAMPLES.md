# 🎯 Quick Commit Examples

## ✅ Valid Commits

```bash
# New feature
git commit -m "feat(backend): implement JWT authentication"
git commit -m "feat(api): add users endpoint"
git commit -m "feat: configure Docker for production"

# Bug fixes
git commit -m "fix(db): fix PostgreSQL connection"
git commit -m "fix(auth): resolve refresh token issue"
git commit -m "fix: correct healthcheck error"

# Documentation
git commit -m "docs: update README with instructions"
git commit -m "docs(api): document endpoints with Swagger"
git commit -m "docs: add contribution guide"

# Style and formatting
git commit -m "style: format code with prettier"
git commit -m "style(backend): apply ESLint conventions"

# Refactoring
git commit -m "refactor(services): improve service structure"
git commit -m "refactor: optimize database queries"

# Tests
git commit -m "test(auth): add unit tests for login"
git commit -m "test: implement e2e tests"

# Maintenance tasks
git commit -m "chore: update NestJS dependencies"
git commit -m "chore(deps): upgrade TypeScript to 5.9"
git commit -m "chore: configure Husky and Commitlint"

# CI/CD
git commit -m "ci: setup GitHub Actions"
git commit -m "ci: add testing workflow"

# Build
git commit -m "build: update Dockerfile"
git commit -m "build(docker): optimize production image"
```

## ❌ Commits Inválidos

````bash
## ❌ Invalid Commits

```bash
# No type
git commit -m "Add new feature"
# ❌ Error: Missing type (feat, fix, etc.)

# Wrong type
git commit -m "update: change configuration"
# ❌ Error: "update" is not a valid type

# No description
git commit -m "feat:"
# ❌ Error: Missing description

# First letter uppercase
git commit -m "feat: Add login"
# ❌ Error: Description must start with lowercase

# Period at end
git commit -m "feat: add login."
# ❌ Error: Should not end with period

# Too long (>100 characters)
git commit -m "feat(backend): implement complete authentication system with JWT including refresh tokens, email verification, password reset and roles"
# ❌ Error: Maximum 100 characters
````

## 🚀 Useful Commands

```bash
# View last commits
git log --oneline -10

# View commits with full format
git log --pretty=format:"%h - %an, %ar : %s"

# Check if a message is valid (without committing)
echo "feat: new feature" | npx commitlint

# Interactive commit
npm run commit
# Then: git commit

# Bypass hooks (ONLY IN EMERGENCIES)
git commit -m "message" --no-verify
```

## 💡 Tips

1. **Use imperative present tense**: "add" not "added" or "adding"
2. **Be specific but concise**: Describe what it does, not how it does it
3. **Use scope when applicable**: `feat(backend):` is clearer than just `feat:`
4. **One commit = one logical change**: Don't mix multiple unrelated changes
5. **If it's hard to describe in one line**: You probably should make several commits

## 🔍 Check Before Commit

```bash
# 1. See modified files
git status

# 2. See specific changes
git diff

# 3. Add files
git add .

# 4. Commit (hooks will run automatically)
git commit -m "feat(backend): add login endpoint"
```
