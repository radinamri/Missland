#!/bin/bash
# Import nail annotations data to MongoDB

echo "Importing nail annotations to MongoDB..."
echo "This will import 3883 nail image annotations"
echo ""

docker compose exec backend python /app/import_to_mongodb.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Data import completed successfully!"
    echo "Visit https://localhost to see your annotations"
else
    echo ""
    echo "✗ Data import failed. Check logs with: docker compose logs backend"
fi
