# Local Supabase Setup - Final Report

## Setup Complete ✓

A fully functional local Supabase environment has been set up for your Windows project to safely test authorization and RLS changes.

---

## What Was Done

### 1. Docker & Supabase CLI
✓ Verified Docker Desktop is installed and running (Engine 29.7.2, WSL2)  
✓ Installed Supabase CLI as a project dev dependency (`npm install --save-dev supabase`)  
✓ Initialized Supabase local configuration (`npx supabase init`)  

### 2. Database Migrations
✓ All 4 migrations applied automatically:
- `0001_init.sql` - Schema, tables, views, initial programs
- `0002_rls.sql` - Initial RLS policies
- `0003_seed_school_classes.sql` - 20 test classes (5 grades × 4 names)
- `0004_secure_role_access.sql` - **Role migration** (user_metadata → app_metadata) + RLS hardening

### 3. Local Supabase Stack
✓ Started and verified healthy:
- **Project URL**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323
- **Database**: postgresql://postgres@127.0.0.1:54322/postgres
- **All services running** (Kong, Auth, PostgREST, Realtime, Storage, etc.)

### 4. Authorization & Data
✓ 5 test users created with proper roles in app_metadata:
```
principal@school.local      role: principal
numeracy@school.local       role: numeracy
literacy@school.local       role: literacy
jam@school.local            role: just_a_minute
invalid@school.local        role: invalid_role (for negative testing)
```
All users: password `password123`

✓ Test data created:
- Sample student with class assignment
- Test draw for numeracy program
- 3 test scores for verification

### 5. App Configuration
✓ Created `.env.local` for local development:
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

✓ Dev server running on http://localhost:5173

### 6. Git Changes Preserved
✓ All pending changes protected (not overwritten):
- `src/lib/AuthContext.jsx` - Uses app_metadata for role extraction
- `src/pages/Login.jsx` - Role-based redirects
- `src/pages/StudentManagement.jsx` - Student access controls

---

## Verification

### Current Status
```
✓ Docker Desktop:       Running (WSL2)
✓ Supabase Stack:       Healthy (all services)
✓ Database:             Connected & migrated
✓ Test Users:           5 users created
✓ Test Data:            Sample records inserted
✓ Dev Server:           Running (http://localhost:5173)
✓ Environment:          .env.local configured
✓ Git Changes:          Preserved
```

### Running Services
- **Supabase Local**: http://127.0.0.1:54321 (REST, GraphQL, Auth, Storage)
- **Studio**: http://127.0.0.1:54323 (Web UI for database management)
- **Dev Server**: http://localhost:5173 (React Vite app)

---

## How to Use

### 1. Test Login & Role-Based Redirects
```bash
# Open http://localhost:5173
# Login with principal@school.local / password123
# Verify redirect to /principal page
```

### 2. Test Programme Workflows
```bash
# Logout and login as numeracy@school.local / password123
# Verify redirect to /numeracy
# Verify only numeracy data is visible (RLS)
```

### 3. Verify Data Protection
```bash
# On StudentManagement page:
# Try to delete a student who has been selected in a draw
# Verify error message: "This student has draw history and cannot be removed"
```

### 4. Inspect Database & RLS
```bash
# Visit Supabase Studio: http://127.0.0.1:54323
# Browse auth.users → See app_metadata roles
# Browse public.draws → See RLS policies
# Browse public.students → See deletion protection rules
```

---

## Commands Reference

### Start Services
```bash
# Start local Supabase stack (if stopped)
npx supabase start

# Start dev server
npm run dev
```

### Stop Services
```bash
# Stop local Supabase stack
npx supabase stop

# Dev server: Ctrl+C in terminal
```

### Database Access
```bash
# View migration status
npx supabase migration list

# Create new migration
npx supabase migration new <name>

# Reset local database (WARNING: deletes all data)
npx supabase db reset

# View logs
npx supabase logs --follow
```

### Create More Test Users
```bash
node create-test-users.js  # Already populated with test users
```

### View Database
```bash
# Studio UI: http://127.0.0.1:54323
# Browse tables, policies, users
```

---

## Key Features Implemented

### 1. Role-Based Authorization (app_metadata)
✓ Roles stored in Supabase auth.users.raw_app_meta_data  
✓ Migration automatically copies existing user_metadata.role → app_metadata.role  
✓ AuthContext.jsx extracts role from app_metadata  
✓ JWT claims include app_metadata.role for RLS policies  

### 2. Row-Level Security (RLS)
✓ All tables have RLS enabled: classes, students, programs, draws, scores  
✓ Policies check app_metadata.role:
  - Principal: can access all data
  - Programme staff (numeracy, literacy, just_a_minute): can only access their programme
  - Invalid roles: denied
✓ Unauthenticated users: denied access

### 3. Data Protection
✓ Students with draw history cannot be deleted (ON DELETE RESTRICT)  
✓ Historical scores are preserved  
✓ private.student_has_draw_history() function checks draw count  
✓ RLS policy prevents deletion of protected students  

### 4. Leaderboard Security
✓ class_totals view uses security_invoker = true  
✓ Only shows data accessible to authenticated user's role  
✓ Principal sees all classes/programmes; staff sees only their own  

---

## Important Notes

### Local vs. Production
- `.env` still contains production URLs (DO NOT MODIFY)
- `.env.local` overrides for local development only
- Local uses different JWT secret (`super-secret-jwt-token-with-at-least-32-characters-long`)
- Never commit `.env.local` with production keys

### Windows with WSL2
- Supabase CLI runs within Docker/WSL2 context
- Database accessible at `127.0.0.1:54322` from host
- Realtime WebSocket may need additional config (not required for this setup)
- S3 Storage analytics requires TCP 2375 (not configured)

### Testing Notes
- Test data is persistent until you run `npx supabase db reset`
- To clear and reseed: `npx supabase db reset`
- Production migrations are not affected (local runs separately)

---

## Troubleshooting

### Supabase stack not responding
```bash
# Check status
npx supabase status

# Check logs
npx supabase logs

# Restart
npx supabase stop
npx supabase start
```

### Port conflicts (if 54321, 54322, etc. already in use)
```bash
# Check what's using port 54321
netstat -ano | findstr :54321

# Stop services and retry
npx supabase stop
npx supabase start
```

### Database reset (clears all test data)
```bash
npx supabase db reset
# Then recreate test users:
node create-test-users.js
```

### App can't connect to local Supabase
```bash
# Verify .env.local exists and has correct URL
cat .env.local

# Verify Supabase is running
npx supabase status

# Clear browser cache and reload http://localhost:5173
```

---

## Next Steps

1. **Test Login Flow**
   - Open http://localhost:5173
   - Log in with each test user
   - Verify role-based page redirects

2. **Test RLS & Isolation**
   - Verify numeracy staff only sees numeracy data
   - Verify principal sees all data
   - Try to access other programmes' data (should be denied)

3. **Test Data Protection**
   - Verify students with draw history can't be deleted
   - Verify error messages are appropriate
   - Verify scores remain intact

4. **Verify Leaderboard**
   - Check class_totals view respects role-based access
   - Verify principal sees all classes; staff sees only their own

5. **Before Pushing to Production**
   - Run comprehensive tests on this local setup
   - Verify all RLS policies work as expected
   - Ensure no auth issues or data leaks
   - Then apply same migrations to production Supabase

---

## Files Created for Local Testing

- `.env.local` - Local environment configuration
- `supabase/config.toml` - CLI configuration
- `create-test-users.js` - Test user creation script
- `test-db.js` - Database test runner (Node)
- `verify-setup.sh` - Verification script (Bash)
- `LOCAL_SETUP_REPORT.md` - Detailed setup report

All original app files and migrations are preserved. Ready to test!

---

## Summary

✅ Local Supabase environment fully operational  
✅ 4 migrations applied with RLS hardening  
✅ Role metadata migrated to app_metadata  
✅ 5 test users created with proper roles  
✅ Test data inserted for verification  
✅ App configured for local development  
✅ All pending changes preserved  
✅ Ready for authorization & RLS testing  

**Status**: READY FOR TESTING

Visit http://localhost:5173 to begin testing the authorization and RLS changes.
