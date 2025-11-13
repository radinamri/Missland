# Contributing to Missland

## Quick Setup

```bash
git clone <repo>
cd Missland
cp .env.docker .env
docker-compose up -d
```

## Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test: `docker-compose exec django python manage.py test`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

## Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Code Style

**Python:** PEP 8
**JavaScript/TypeScript:** ESLint + Prettier

Run formatters:
```bash
# Python
docker-compose exec django black .

# Frontend
cd frontend && npm run lint
```

## Testing

```bash
# Backend
docker-compose exec django python manage.py test

# Frontend
cd frontend && npm test
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update README if needed
5. Request review from maintainers

## Questions?

Open an issue or contact maintainers.
