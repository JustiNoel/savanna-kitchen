

# Fix Plan: Order Status & Logo Update

## Problem Summary

### Issue 1: Order Status Updates Failing
**Root Cause**: Database check constraint mismatch

The `orders` table has a constraint that only allows these status values:
- `pending`, `confirmed`, `preparing`, `ready`, `completed`, `cancelled`

But the Admin panel is trying to set:
- `delivering` and `delivered`

This causes the PostgreSQL error: `new row for relation "orders" violates check constraint "orders_status_check"`

### Issue 2: Header Logo Still Shows Old Import
The Header component imports `savanna-kitchen-logo.png` instead of the new Grabbys logo.

---

## Solution

### Part 1: Fix Database Constraint (Migration)

Run a database migration to update the check constraint to include the new status values:

```sql
-- Drop the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with all needed status values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status = ANY (ARRAY['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'completed', 'cancelled']));
```

This adds `delivering` and `delivered` as valid status options.

### Part 2: Update Header Logo

**File**: `src/components/Header.tsx`

Change the import from:
```typescript
import logo from '@/assets/savanna-kitchen-logo.png';
```

To:
```typescript
// Use the Grabbys logo from public folder (same as favicon)
```

And update the img src to use `/grabbys-logo.png` directly.

---

## Technical Details

### Database Change
- Migration updates the `orders_status_check` constraint
- No data changes needed - existing orders remain valid
- New statuses become available immediately after migration

### Files Modified
1. `src/components/Header.tsx` - Update logo import to use Grabbys logo

### Expected Outcome
- Order status changes from "ready" to "delivering" to "delivered" will work
- Header logo matches the favicon (Grabbys branding)
- No more "failed to update status" errors

