# Contributing to Matrix Green

## Table of Contents

1. [Branch Naming](#branch-naming)
2. [Commit Messages](#commit-messages)
3. [Pull Request Process](#pull-request-process)
4. [Linking Issues in Commits](#linking-issues-in-commits)

---

## Branch Naming

Every branch must follow this format:

```
<type>/<short-description>
```

| Type        | When to use                           |
| ----------- | ------------------------------------- |
| `feature/`  | New feature or user story             |
| `fix/`      | Bug fix                               |
| `chore/`    | Maintenance, config, tooling, deps    |
| `docs/`     | Documentation only                    |
| `refactor/` | Code refactor without behavior change |

**Examples:**

```
feature/venue-listing-page
feature/user-authentication
fix/login-redirect-loop
chore/update-eslint-config
docs/update-contributing
refactor/prisma-client-singleton
```

**Rules:**

- Lowercase only
- Hyphens to separate words, no underscores or spaces
- Keep it short and descriptive (3-5 words max)
- Always branch off from `main`

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `chore`    | Tooling, config, dependency updates                     |
| `docs`     | Documentation changes                                   |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style`    | Formatting, missing semicolons, etc. (no logic change)  |
| `test`     | Adding or updating tests                                |
| `ci`       | CI/CD configuration changes                             |

### Scope (optional)

The scope is the area of the codebase affected:
`auth`, `venue`, `event`, `review`, `rating`, `admin`, `db`, `ui`, `api`

### Examples

```
feat(venue): add venue listing page with pagination
fix(auth): redirect to login when session expires
chore(deps): update prisma to v6.2
docs: update setup instructions in README
refactor(db): extract prisma client to singleton
ci: add type-check step to GitHub Actions workflow
feat(rating): implement accessibility score upsert
```

**Rules:**

- Use the imperative mood: "add feature" not "added feature"
- Lowercase type and scope
- No period at the end of the description
- Keep the description under 72 characters

---

## Pull Request Process

1. **Create a branch** from `main` following the branch naming convention above
2. **Make your changes** with clear, atomic commits
3. **Open a Pull Request** against `main` with:
   - A clear title following the commit message format
   - A description of what changed and why
   - Reference to the related issue(s)
4. **Wait for CI to pass** — all checks (lint, type-check, Prisma validate) must be green
5. **Request a review** from at least one other team member
6. **Do not merge your own PR** — another team member must approve and merge

### PR Title Format

Same as commit messages:

```
feat(venue): add venue detail page
fix(auth): handle banned user login attempt
```

---

## Linking Issues in Commits

Reference issues in your commit messages or PR description to automatically link them on GitHub.

### In a commit message

```
feat(venue): add venue creation form

Closes #23
```

### In a PR description

```
Closes #23
Part of #13
```

### Keywords that close issues automatically on merge

`Closes`, `Fixes`, `Resolves` followed by `#<issue-number>`

### Keywords that reference without closing

`Part of`, `Related to`, `See` followed by `#<issue-number>`

**Example full commit:**

```
feat(auth): implement registration API endpoint

- Validate input fields (name, email, password)
- Check for duplicate email
- Hash password with bcrypt
- Create user with default role USER

Closes #20
Part of #18
```
