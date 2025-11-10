#!/bin/bash

# MongoDB Replica Set Initialization Script
# This script generates a keyfile and initializes a single-node replica set

# Generate keyfile if it doesn't exist
if [ ! -f /data/mongodb-keyfile ]; then
    echo "Generating MongoDB keyfile..."
    openssl rand -base64 756 > /data/mongodb-keyfile
    chmod 400 /data/mongodb-keyfile
    chown 999:999 /data/mongodb-keyfile
    echo "Keyfile generated successfully"
fi

# Start MongoDB with replica set and keyfile
echo "Starting MongoDB with replica set rs0..."
mongod --replSet rs0 --bind_ip_all --port 27017 --keyFile /data/mongodb-keyfile &

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to start..."
sleep 10

# Initialize replica set
echo "Initializing replica set..."
mongosh --eval "
try {
    rs.initiate({
        _id: 'rs0',
        members: [{_id: 0, host: 'mongodb:27017'}]
    });
    print('Replica set initialized successfully');
} catch (error) {
    if (error.codeName === 'AlreadyInitialized') {
        print('Replica set already initialized');
    } else {
        print('Error initializing replica set: ' + error);
    }
}
"

# Keep MongoDB running
wait
