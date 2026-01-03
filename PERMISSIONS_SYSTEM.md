# Permission System Implementation

## Overview
This document describes the permission system implemented for the ACSTI Booking Management System.

## Key Features Implemented

###  1. **Two Administrator Limit**
   - Maximum of 2 administrators allowed in the system
   - Backend enforces this limit during user creation
   - Error message shown when trying to exceed limit

### 2. **Page-Level Access Control**
   - Users can be granted/denied access to specific pages
   - Available pages:
     - Dashboard
     - Bookings
     - Programs
     - Booking Links
     - Reports
     - Settings
     - User Management

### 3. **Public Signup Restrictions**
   - Public signups (from Auth page) always create "user" role
   - New users get dashboard access only by default
   - Success message instructs users to contact admin for more features

### 4. **Admin-Created Users**
   - Admins can create users with specific roles through Settings
   - Admin creation respects the 2-admin limit
   - Admins can grant page permissions after user creation

## Database Schema

### `user_permissions` Table
```sql
CREATE TABLE user_permissions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  page VARCHAR(100) NOT NULL,
  can_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_page (user_id, page),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

### Permission Management
- `GET /api/users/:userId/permissions` - Get user's page permissions
- `PUT /api/users/:userId/permissions` - Update user's page permissions (admin only)
- `GET /api/users-with-permissions` - Get all users with their permissions (admin only)

## Backend Changes

### `server/db.js`
- Added `user_permissions` table to schema

### `server/auth.js`
- Modified `signup()` to:
  - Count existing admins
  - Block admin creation if 2 admins exist
  - Force 'user' role for public signups
  - Create default dashboard permission for new users
  - Return helpful message to new users

### `server/permissions.js` (NEW)
- Exports available pages list
- `getUserPermissions()` - Fetch user permissions
- `updateUserPermissions()` - Update user permissions
- `getAllUsersWithPermissions()` - Get all users with permissions

### `server/index.js`
- Added permission routes

## Frontend Changes Needed

### Auth Page (Signup)
Update to show success message with contact admin notice:
```tsx
toast.success('Account created! You have access to the dashboard. Contact an administrator to request access to other features.')
```

### Settings Page - User Management Tab
Add permission management UI:
1. Show current permissions for each user
2. Allow admins to toggle page access for regular users
3. Show admin count (X/2 administrators)
4. Disable admin role selection if 2 admins exist

### Route Guards
Implement permission checks before rendering protected routes:
```tsx
// Pseudo code
if (user.role !== 'admin') {
  const hasAccess = await checkPermission(user.id, currentPage);
  if (!hasAccess) {
    // Redirect to dashboard or show access denied
  }
}
```

## Usage Flow

### For New Users (Public Signup):
1. User signs up from Auth page
2. System creates user with 'user' role
3. System creates dashboard-only permission
4. User sees message: "Contact administrator for more features"
5. User can only access Dashboard until admin grants more permissions

### For Administrators:
1. Admin logs in
2. Goes to Settings → User Management
3. Can create new users (up to 2 admins total)
4. Can manage page permissions for regular users
5. Can view permission matrix for all users

## Security Notes
- Admins cannot modify their own permissions (always have full access)
- Admin role change is blocked if it would exceed 2 admins
- Public signups cannot create admin accounts
- Foreign key cascade deletes permissions when user is deleted

## Next Steps (Frontend Implementation)
1. Update Auth.tsx to show permission message
2. Add permission management UI to Settings.tsx
3. Implement route guards in App.tsx or routing component
4. Add permission check utility function
5. Show access denied page for unauthorized access
6. Display current access level in user profile

## Testing Checklist
- [ ] Create first admin account
- [ ] Create second admin account
- [ ] Try to create third admin (should fail)
- [ ] Public signup creates user role only
- [ ] New user has only dashboard access
- [ ] Admin can grant permissions to users
- [ ] Admin can revoke permissions from users
- [ ] Route guards prevent unauthorized access
- [ ] Permission changes reflect immediately

