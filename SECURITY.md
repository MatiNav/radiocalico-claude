# Security Guide

## Security Scanning

Radio Calico includes automated security scanning for both Node.js and Python dependencies.

### Running Security Scans

```bash
# Run all security tests
make security-test

# Run detailed security audit with fix suggestions
make security-audit

# Run only npm audit
make npm-audit

# Run only Python audit
make python-audit
```

## Current Security Status

### Node.js Dependencies
✅ **No vulnerabilities found** (as of last scan)

### Python Dependencies
⚠️ **4 known vulnerabilities in 2 packages:**

| Package    | Version | Vulnerability ID    | Fix Version |
|------------|---------|---------------------|-------------|
| pip        | 22.3.1  | PYSEC-2023-228      | 23.3        |
| pip        | 22.3.1  | GHSA-4xh5-x5gv-qwph | 23.3        |
| setuptools | 65.5.0  | PYSEC-2022-43012    | 65.5.1      |
| setuptools | 65.5.0  | PYSEC-2025-49       | 78.1.1      |

## Remediation Steps

### Updating pip
```bash
# Activate virtual environment
source venv/bin/activate

# Update pip
pip install --upgrade pip

# Verify update
pip --version
```

### Updating setuptools
```bash
# Activate virtual environment
source venv/bin/activate

# Update setuptools
pip install --upgrade setuptools

# Verify update
pip show setuptools
```

### Automated Fixes
```bash
# For npm vulnerabilities (when present)
npm audit fix

# For Python vulnerabilities
source venv/bin/activate
pip install --upgrade pip setuptools
```

## Security Best Practices

### Development
1. Run `make security-test` before committing code
2. Keep dependencies up to date
3. Review security advisories regularly
4. Never commit secrets or API keys (use `.env` files)

### Production Deployment
1. Use the production Docker image (`docker-compose.yml`)
2. Keep Docker images updated
3. Use HTTPS in production
4. Set strong CORS policies
5. Regularly scan for vulnerabilities

### Docker Security
- Production image runs Flask and Express as non-root user (`appuser`)
- Limited logging to prevent disk space issues (10MB max per file, 3 files)
- Health checks configured for all services
- CORS headers restricted (remove wildcard in production)

## Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do not** open a public GitHub issue
2. Email the maintainer directly
3. Provide details about the vulnerability
4. Allow time for a fix before public disclosure

## Dependency Updates

### Automated Dependency Updates
Consider using:
- **Dependabot** (GitHub) - Automated pull requests for dependency updates
- **Renovate** - Automated dependency updates
- **Snyk** - Continuous security monitoring

### Manual Checks
```bash
# Check for outdated npm packages
npm outdated

# Check for outdated Python packages
pip list --outdated
```

## Security Tools

This project uses:
- **npm audit**: Built-in Node.js security scanner
- **pip-audit**: Python dependency vulnerability scanner
- **Docker security scanning**: Run `docker scan <image>` to scan images

## Security Checklist

- [ ] Run security tests before deployment
- [ ] Update vulnerable dependencies
- [ ] Review and update `.env` files
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Keep Docker images updated
- [ ] Review and restrict CORS policies
- [ ] Implement rate limiting (consider nginx rate limiting)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/security-and-access-control)
- [Python Security Best Practices](https://python.readthedocs.io/en/latest/library/security_warnings.html)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
