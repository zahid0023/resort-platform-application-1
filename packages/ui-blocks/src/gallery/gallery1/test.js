1. User registers
        │
        ▼
      users

2. User creates a resort
        │
        ▼
      resorts

3. Create membership
        │
        ▼
     resort_users
        │
        ├── resort_id
        ├── user_id
        └── access_type = OWNER