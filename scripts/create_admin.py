#!/usr/bin/env python3
"""Create a default admin user for House Sharing Seniors"""

import os
import sys
from pymongo import MongoClient
from datetime import datetime, timezone
import uuid

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def create_admin():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    
    admin_email = "admin@housesharingseniors.com.au"
    
    # Check if admin already exists
    existing_admin = db.users.find_one({"email": admin_email})
    if existing_admin:
        print(f"Admin user already exists: {admin_email}")
        return
    
    # Create admin user
    admin_user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "email": admin_email,
        "name": "HSS Admin",
        "picture": None,
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.users.insert_one(admin_user)
    print(f"✓ Admin user created successfully!")
    print(f"  Email: {admin_email}")
    print(f"  To login: Use Google OAuth with this email")
    print(f"  (You'll need to configure this email in your Google OAuth settings)")
    
    client.close()

if __name__ == "__main__":
    create_admin()
