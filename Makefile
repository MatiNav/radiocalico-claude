# Radio Calico Makefile
# Provides convenient commands for development, testing, and deployment

.PHONY: help install dev prod security-test security-audit clean docker-dev docker-prod docker-clean

# Default target
help:
	@echo "Radio Calico - Available Make Targets"
	@echo "======================================"
	@echo ""
	@echo "Development:"
	@echo "  make install          Install all dependencies (Python + Node.js)"
	@echo "  make dev              Start development servers (manual mode)"
	@echo "  make docker-dev       Start Docker development containers"
	@echo ""
	@echo "Production:"
	@echo "  make prod             Build and run production Docker container"
	@echo "  make docker-prod      Alias for 'make prod'"
	@echo ""
	@echo "Security:"
	@echo "  make security-test    Run all security tests (npm audit + Python safety check)"
	@echo "  make security-audit   Detailed security audit with fix suggestions"
	@echo "  make npm-audit        Run npm security audit"
	@echo "  make python-audit     Run Python dependency security check"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean            Remove generated files and caches"
	@echo "  make docker-clean     Stop and remove all Docker containers"
	@echo ""

# Install dependencies
install:
	@echo "Installing Python dependencies..."
	pip install -r requirements.txt
	@echo "Installing Node.js dependencies..."
	npm install
	@echo "✓ All dependencies installed"

# Development mode (manual servers)
dev:
	@echo "Starting development servers..."
	@echo "Make sure to run Flask and Express in separate terminals:"
	@echo ""
	@echo "Terminal 1: source venv/bin/activate && python app.py"
	@echo "Terminal 2: npm start"

# Docker development
docker-dev:
	@echo "Starting Docker development containers..."
	docker-compose -f docker-compose.dev.yml up

docker-dev-build:
	@echo "Building Docker development images..."
	docker-compose -f docker-compose.dev.yml build

docker-dev-logs:
	@echo "Showing Docker development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

# Docker production
prod: docker-prod

docker-prod:
	@echo "Building and starting production Docker container..."
	docker-compose up --build -d
	@echo "✓ Production container running on http://localhost"

docker-prod-logs:
	@echo "Showing production container logs..."
	docker-compose logs -f

# Security testing
security-test: npm-audit python-audit
	@echo ""
	@echo "✓ Security scan complete"

security-audit: npm-audit-fix python-audit-detailed
	@echo ""
	@echo "✓ Security audit complete with fix suggestions"

npm-audit:
	@echo "Running npm security audit..."
	@echo "=============================="
	npm audit --audit-level=moderate || true
	@echo ""

npm-audit-fix:
	@echo "Running npm audit with fix suggestions..."
	@echo "========================================="
	npm audit fix --dry-run || true
	@echo ""
	@echo "To apply fixes, run: npm audit fix"
	@echo ""

python-audit:
	@echo "Running Python dependency security check..."
	@echo "==========================================="
	@pip show pip-audit > /dev/null 2>&1 || pip install pip-audit
	@pip-audit || true
	@echo ""

python-audit-detailed:
	@echo "Running detailed Python security audit..."
	@echo "========================================="
	@pip show pip-audit > /dev/null 2>&1 || pip install pip-audit
	@pip-audit --format json || true
	@echo ""

# Cleanup
clean:
	@echo "Cleaning up generated files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf node_modules/.cache 2>/dev/null || true
	@echo "✓ Cleanup complete"

docker-clean:
	@echo "Stopping and removing Docker containers..."
	docker-compose down 2>/dev/null || true
	docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
	@echo "✓ Docker cleanup complete"

docker-clean-all: docker-clean
	@echo "Removing Docker images..."
	docker rmi radiocalico_radiocalico 2>/dev/null || true
	docker rmi radiocalico-flask-dev 2>/dev/null || true
	docker rmi radiocalico-express-dev 2>/dev/null || true
	@echo "✓ All Docker resources removed"

# Testing
test:
	@echo "Running tests..."
	@echo "Note: Add your test commands here"
	npm test || true

# Linting
lint:
	@echo "Running linters..."
	@echo "JavaScript linting..."
	npx eslint public/app.js server.js || true
	@echo ""
	@echo "Python linting..."
	pip show flake8 > /dev/null 2>&1 || pip install flake8
	flake8 app.py || true

# Database management
db-reset:
	@echo "Resetting database..."
	rm -f data/users.db
	@echo "✓ Database reset (will be recreated on next server start)"

# View logs
logs-dev:
	@echo "Viewing development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

logs-prod:
	@echo "Viewing production logs..."
	docker-compose logs -f

# Status
status:
	@echo "Docker Container Status:"
	@echo "========================"
	docker-compose ps 2>/dev/null || echo "Production containers not running"
	@echo ""
	docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "Development containers not running"
