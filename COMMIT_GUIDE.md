# 📝 Commit Guide

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to maintain a clean and consistent change history.

## 🎯 Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

| Type         | Description                        | Example                                   |
| ------------ | ---------------------------------- | ----------------------------------------- |
| **feat**     | New feature                        | `feat(auth): add JWT login`               |
| **fix**      | Bug fix                            | `fix(api): fix error in users endpoint`   |
| **docs**     | Documentation changes              | `docs(readme): update installation guide` |
| **style**    | Format changes (don't affect code) | `style: format code with prettier`        |
| **refactor** | Code refactoring                   | `refactor(db): improve TypeORM queries`   |
| **perf**     | Performance improvements           | `perf(api): optimize DB queries`          |
| **test**     | Add or fix tests                   | `test(auth): add unit tests`              |
| **chore**    | Maintenance tasks                  | `chore: update dependencies`              |
| **ci**       | CI/CD changes                      | `ci: setup GitHub Actions`                |
| **build**    | Build system changes               | `build: update Dockerfile`                |

## ✅ Valid Examples

```bash
feat(backend): implement users API
fix(docker): fix healthcheck configuration
docs: add API documentation
style(backend): format code with prettier
refactor: improve folder structure
chore: update dependency versions
```

## ❌ Invalid Examples

```bash
# No type
"Add new feature"

# Wrong type
update(backend): change configuration

# No description
feat:

# Description too long (>100 characters)
feat(backend): implement complete authentication system with JWT including refresh tokens and email verification
```

## 🚀 Workflow

1. **Make changes to code**

   ```bash
   # Edit your files...
   ```

2. **Add files to staging**

   ```bash
   git add .
   ```

3. **Commit (hooks will run automatically)**

   ```bash
   git commit -m "feat(backend): add login endpoint"
   ```

4. **If commit is valid:**

   - ✅ lint-staged will run (automatic formatting)
   - ✅ Commit message will be validated
   - ✅ Commit will complete successfully

5. **If commit is invalid:**
   - ❌ Will show error explaining the issue
   - ❌ Commit will be rejected
   - ℹ️ Fix the message and try again

## 🔧 Configured Hooks

### Pre-commit

- Runs Prettier on JSON and MD files
- Runs ESLint on backend TypeScript files
- Automatically formats code

### Commit-msg

- Validates message follows Conventional Commits format
- Verifies commit type
- Verifies message length

## 💡 Tips

- **Be descriptive but concise**: Maximum 100 characters
- **Use imperative present tense**: "add" not "added" or "adding"
- **Start with lowercase**: `feat: add` not `feat: Add`
- **No period at end**: `feat: add login` not `feat: add login.`

## 🆘 Troubleshooting

### "commit-msg hook failed"

- Your message doesn't follow Conventional Commits format
- Check the type and message format

### "lint-staged failed"

- There are linting errors in your code
- Review error messages and fix the code

### Bypass hooks (NOT RECOMMENDED)

```bash
# Only in emergencies
git commit -m "message" --no-verify
```

## 📚 More Information

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)
