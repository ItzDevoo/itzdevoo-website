# GitHub Workflow Documentation

## Branch Strategy

This repository uses a **three-branch workflow** for managing different environments:

### Branches

- **`main`** - Stable release branch
  - Contains tested, production-ready code
  - Protected branch (should require pull requests)
  - Source of truth for releases

- **`development`** - Active development branch  
  - All feature development happens here
  - Integration testing branch
  - Merged to `main` when ready for release

- **`live`** - Production deployment branch
  - Mirrors `main` but used for actual deployment
  - Connected to Cloudflare tunnel and itzdevoo.com
  - Only updated from `main` branch

## Workflow Process

### 1. Development Phase
```bash
# Switch to development branch
git checkout development

# Create feature branch (optional for solo development)
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to development
git checkout development
git merge feature/new-feature  # if using feature branches
git push origin development
```

### 2. Testing Phase
```bash
# Test locally with Docker
.\build.ps1

# Verify all functionality works
# Run accessibility tests
# Check responsive design
# Validate performance
```

### 3. Release Phase
```bash
# Merge to main when ready
git checkout main
git merge development
git push origin main

# Tag release (optional)
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. Deployment Phase
```bash
# Deploy to live environment
git checkout live
git merge main
git push origin live

# Build and deploy Docker container
.\build.ps1
```

## Environment Configuration

### Development Environment
- Local development server
- Hot reloading (if implemented)
- Debug mode enabled
- Development dependencies included

### Staging/Main Environment  
- Production build
- Optimized assets
- Security headers enabled
- Performance monitoring

### Live/Production Environment
- Docker container deployment
- Cloudflare tunnel integration
- HTTPS enforcement
- Production monitoring

## Deployment Commands

### Local Development
```powershell
# Quick development setup
git checkout development
.\build.ps1
```

### Production Deployment
```powershell
# Full production deployment
git checkout live
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Branch Protection Rules (Recommended)

### Main Branch
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to admins only

### Live Branch  
- Require pull request reviews
- Only allow merges from `main`
- Require administrator review
- Restrict force pushes

## Hotfix Process

For urgent production fixes:

```bash
# Create hotfix from live
git checkout live
git checkout -b hotfix/urgent-fix

# Make minimal fix
git add .
git commit -m "Hotfix: urgent production issue"

# Merge to live
git checkout live
git merge hotfix/urgent-fix
git push origin live

# Backport to main and development
git checkout main
git merge hotfix/urgent-fix
git push origin main

git checkout development  
git merge main
git push origin development
```

## Continuous Integration (Future)

When ready to implement CI/CD:

- **Development**: Automated testing, linting, accessibility checks
- **Main**: Full test suite, security scanning, performance audits  
- **Live**: Deployment automation, health checks, rollback capability

## Monitoring and Maintenance

- Monitor Docker container health
- Check Cloudflare tunnel status
- Review performance metrics
- Update dependencies regularly
- Security vulnerability scanning