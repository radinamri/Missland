#!/bin/bash
set -e

# Check if MongoDB keyfile exists, if not create it
if [ ! -f /tmp/mongodb-keyfile ]; then
    echo "Creating MongoDB keyfile..."
    openssl rand -base64 756 > /tmp/mongodb-keyfile
    chmod 400 /tmp/mongodb-keyfile
    chown mongodb:mongodb /tmp/mongodb-keyfile
fi

# Initialize replica set if not already initialized
echo "Starting MongoDB with replica set configuration..."

# Start MongoDB in background
mongod --replSet rs0 --keyFile /tmp/mongodb-keyfile --bind_ip_all &

# Wait for MongoDB to start
until mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    echo "Waiting for MongoDB to start..."
    sleep 2
done

# Check if replica set is already initialized
RS_STATUS=$(mongosh --quiet --eval "rs.status().ok" 2>/dev/null || echo "0")

if [ "$RS_STATUS" = "0" ]; then
    echo "Initializing replica set..."
    mongosh --eval "rs.initiate({
        _id: 'rs0',
        members: [{ _id: 0, host: 'mongodb:27017' }]
    })"
    
    echo "Waiting for replica set to be ready..."
    until mongosh --quiet --eval "db.adminCommand('hello').isWritablePrimary" | grep -q "true"; do
        sleep 2
    done
    
    echo "Replica set initialized successfully!"
    
    # Create admin user
    echo "Creating admin user..."
    mongosh admin --eval "
    if (db.getUser('admin') == null) {
        db.createUser({
            user: 'admin',
            pwd: 'mongo_password_123',
            roles: [
                { role: 'root', db: 'admin' },
                { role: 'readWriteAnyDatabase', db: 'admin' }
            ]
        });
        print('Admin user created successfully!');
    } else {
        print('Admin user already exists');
    }
    "
else
    echo "Replica set already initialized"
fi

# Keep container running
wait
