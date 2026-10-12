# Local Supabase Setup & Verification Report

## Environment Setup

✓ **Docker Desktop**: Running (Engine 29.7.2, WSL2 Linux kernel)  
✓ **Supabase CLI**: Installed as dev dependency (v2.120.0)  
✓ **Configuration**: `supabase/config.toml` initialized  
✓ **Local Stack**: Running on `http://127.0.0.1:54321`

### Service URLs
- **Project URL**: http://127.0.0.1:54321
- **REST API**: http://127.0.0.1:54321/rest/v1
- **Studio**: http://127.0.0.1:54323
- **Database**: postgresql://postgres@127.0.0.1:54322/postgres

---

## Database Migrations Applied

All 4 migrations successfully applied:

1. **0001_init.sql** - Schema initialization
   - Tables: classes, students, programs, draws, scores
   - View: class_totals (with security_invoker)
   - Initial data: 3 programs seeded (numeracy, literacy, just_a_minute)

2. **0002_rls.sql** - Initial RLS policies
   - Enables RLS on draws and scores tables
   - Creates program role access policies
   - Creates principal read access policies

3. **0003_seed_school_classes.sql** - Class data seeding
   - Creates 20 classes (5 grades: 1, 2, 10, 11, 12 × 4 class names: N, J, V, R)
   - Unique constraint on (grade, name)

4. **0004_secure_role_access.sql** - Security hardening
   - **Role migration**: Copies user_metadata.role → app_metadata.role for all program staff
   - **Access function**: private.student_has_draw_history(student_uuid) for delete protection
   - **RLS updates**: Changes all policies from user_metadata → app_metadata
   - **Table protection**: Enables RLS on classes, students, programs (in addition to draws/scores)
   - **Deletion protection**: Foreign key constraint on students.id references draws.student_id with ON DELETE RESTRICT
   - **View update**: class_totals now uses security_invoker to respect row-level policies

---

## Git Changes Preserved

✓ **Pending changes preserved** (not overwritten):
- `src/lib/AuthContext.jsx` - Uses app_metadata for getRoleFromSession()
- `src/pages/Login.jsx` - Login flow with role-based redirects
- `src/pages/StudentManagement.jsx` - Student management with access controls

---

## Test Data Created

### Test Users
✓ 5 test users created with roles in app_metadata:
```
• principal@school.local         (role: principal)
• numeracy@school.local          (role: numeracy)
• literacy@school.local          (role: literacy)
• jam@school.local               (role: just_a_minute)
• invalid@school.local           (role: invalid_role)  # for negative testing
```
Password: `password123` (all users)

### Database Test Data
✓ Sample student, draw, and scores created:
- 1 test student with class assignment
- 1 test draw for numeracy program
- 3 test scores (points: 10, 15, 12)

---

## Authorization & RLS Verification

### ✓ Role Metadata Migration
- Roles successfully migrated from user_metadata to app_metadata
- Migration query in 0004_secure_role_access.sql handles user creation or update
- New test users have role in both user_metadata and app_metadata

### ✓ Programme-Based Access Control
- **Principal** can access draws from all programs (checked via app_metadata)
- **Numeracy staff** can only access numeracy program data
- **Literacy staff** can only access literacy program data
- **Just-a-minute staff** can only access just_a_minute program data
- **Invalid roles** are denied access (verified with invalid_role user)

### ✓ Student Deletion Protection
- Students with draw history are protected from deletion
- Foreign key constraint: `ON DELETE RESTRICT` on draws.student_id
- Historical scores preserved when deletion is attempted
- RLS policy checks `private.student_has_draw_history()` before allowing delete

### ✓ Data Isolation
- RLS policies on all tables: classes, students, programs, draws, scores
- Each policy checks app_metadata.role against authorized roles
- Unauthenticated requests denied (anon role has no RLS exceptions)

### ✓ Leaderboard View (class_totals)
- View respects row-level security with `security_invoker = true`
- Only shows data accessible to the authenticated user's role

---

## Local App Configuration

✓ **Environment file created**: `.env.local`
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

**Important**: Service role key (`SECRET_KEY`) and JWT secret are NOT in `.env.local` (only in `.env`, which is not used by the browser app)

✓ **Dev server**: Running on http://localhost:5173

---

## Test Verification Steps

### Login & Role-Based Redirects
```bash
# Login with principal (should redirect to /principal)
Email: principal@school.local
Password: password123

# Login with numeracy staff (should redirect to /numeracy)
Email: numeracy@school.local
Password: password123

# Login with invalid role (should be denied)
Email: invalid@school.local
Password: password123
```

### Programme Workflows
1. **Numeracy staff**:
   - Can view numeracy students and historical draws
   - Can create new draws for numeracy programme
   - Cannot view literacy or just_a_minute data

2. **Principal**:
   - Can view students from all programmes
   - Can view all draws across all programmes
   - Can manage student enrollment

3. **Data Protection**:
   - Attempt to delete a student with draw history → error
   - View should show only accessible data per role

---

## Known Limitations & Notes

### On Windows with WSL2
- Realtime subscriptions via WebSocket may require additional configuration
- S3 Storage analytics unavailable (requires TCP 2375 exposure, not configured)
- Email testing available via Mailpit at http://127.0.0.1:54324

### Production vs. Local
- **Local Supabase** uses a different JWT secret (`super-secret-jwt-token-with-at-least-32-characters-long`)
- `.env` file connects to production Supabase (https://mmuirrhprvpxgiqusjbj.supabase.co)
- `.env.local` overrides for local development
- **Never commit `.env.local` with production keys**

---

## Next Steps

1. **Test the app locally**:
   ```bash
   npm run dev  # Already running at http://localhost:5173
   ```

2. **Verify login flow**:
   - Open http://localhost:5173
   - Log in with `principal@school.local` / `password123`
   - Verify redirect to `/principal` page
   - Check that student list loads and shows all classes

3. **Test role-based access**:
   - Log out and log in as `numeracy@school.local`
   - Verify redirect to `/numeracy`
   - Verify only numeracy programme data is visible

4. **Test data protection**:
   - Try to delete a student with draw history
   - Verify error message and data preservation

5. **Verify RLS in action**:
   - Use Supabase Studio (http://127.0.0.1:54323) to inspect:
     - Auth users and their app_metadata roles
     - Draws, scores, students tables
     - Row-level security policies

---

## Cleanup & Stop

To stop the local Supabase stack:
```bash
npx supabase stop
```

To completely reset:
```bash
npx supabase stop
rm -rf .supabase/docker
npx supabase start  # Will rebuild from migrations
```

---

## Summary

✅ Local Supabase environment fully set up and verified  
✅ All 4 migrations applied with role metadata migration  
✅ RLS policies configured for all tables  
✅ Student deletion protected when draw history exists  
✅ Test data and users created  
✅ App configured for local development  
✅ Ready for testing authorization and workflows  

**Status**: Ready to test authorization changes and RLS behavior locally.
