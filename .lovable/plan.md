# 🔍 Grabbys Internal Audit — Full Report

I went through your database, RLS policies, edge functions, hooks, routes, and frontend wiring. The platform is broadly healthy — Paystack lock-down is in place, audit logging is solid, RLS is enabled everywhere. But I found **12 real issues**, 5 of them important. Here's the full breakdown, grouped by severity.

---

## 🔴 CRITICAL — fix first

### 1. Finance totals are inflated by cancelled orders
**Evidence (live data):**
- Paid orders (not cancelled): **115 orders, KSh 31,117**
- `financial_transactions` income rows: **138 rows, KSh 34,917**
- **23 cancelled orders still have income rows in finance** = ~KSh 3,800 of phantom revenue

**Root cause:** `paystack-webhook` inserts a financial_transaction on `charge.success`, but if the order is later cancelled, the income row is never reversed. Also, `CartSheet.tsx` likely inserts client-side too (double source of truth).

**Fix:**
- Add a Postgres trigger on `orders`: when status flips to `cancelled` AND a matching income row exists, insert a `refund` row of `-amount` (preserves audit trail).
- Update `useFinancialSummary` to compute revenue as `SUM(income) - SUM(refund)` AND exclude rows whose `order_id` belongs to a cancelled order, so the dashboard matches reality immediately.
- Remove client-side financial_transactions inserts from `CartSheet.tsx` — let the webhook be the single source of truth.

### 2. Branch managers can't actually see their branch data
**Evidence:** The only assigned manager (`griffinsorwa6@gmail.com`) has `profile.branch_id = NULL` even though `branch_managers.branch_id` is set.

**Root cause:** `useAssignBranchManager` runs `UPDATE profiles SET branch_id = ...` on someone else's profile, but the RLS policy on `profiles` is `auth.uid() = user_id` for UPDATE — so the admin's update is silently blocked. The manager's role-based queries (RLS uses `profile.branch_id` indirectly via `is_branch_manager_of`) still work, BUT any UI that reads `profile.branch_id` for the manager will show "no branch".

**Fix:**
- Add an `Admins can update profiles` RLS policy: `USING (has_role(auth.uid(),'admin'))`.
- Backfill: copy `branch_managers.branch_id` → `profiles.branch_id` for the existing active manager.

### 3. 154 orders have `branch_id = NULL`
**Evidence:** ALL existing orders are unscoped to a branch (`orders_no_branch: 154`). This means once branch managers come online, they'll see **zero orders** in their dashboard.

**Root cause:** `CartSheet.placeOrder` doesn't set `branch_id`. The customer's `profile.branch_id` is available via `useUserBranch` but not piped into the insert.

**Fix:**
- In `CartSheet.tsx`, read `useUserBranch()` and include `branch_id: branchId` in the order insert.
- Backfill SQL: `UPDATE orders o SET branch_id = p.branch_id FROM profiles p WHERE p.user_id = o.user_id AND o.branch_id IS NULL AND p.branch_id IS NOT NULL;` (only fills where customer is now linked to a branch — old orders from pre-branch users stay NULL, which is fine).

### 4. 92 of 92 user profiles have NO branch assigned
Every single existing user signed up before the branch dropdown existed, so they're stranded. They can browse but their orders won't route to any manager.

**Fix:**
- Add a one-time **"Select your university"** modal that fires on `/` for any logged-in customer where `profile.branch_id IS NULL`.
- Save selection, refresh — they're now part of a branch and future orders will be branch-scoped.

### 5. Branch Manager Dashboard route doesn't exist
The earlier Phase 1 plan promised `/branch-dashboard` but it was never built. The one assigned manager has nowhere to log in to. The Admin page also has no branch-scoped order view for them.

**Fix:** Build `src/pages/BranchDashboard.tsx` with:
- Today's order count, pending count, revenue (filtered by their branch).
- Live orders table with status updates (Pending → Confirmed → Preparing → Ready → Delivered).
- Out-of-stock toggle for menu items in their branch (uses `branch_menu_overrides`).
- Customer list (RLS already permits this).
Add route `/branch-dashboard` + redirect logic in `Auth.tsx`/`Index.tsx` based on role.

---

## 🟡 HIGH — fix soon

### 6. `/category/:slug` skips branch filtering
`CategoryPage.tsx` fetches all `menu_items` with `category_id = X` regardless of `branch_id` or `branch_visibility`. A Maseno student will see items meant for another campus.

**Fix:** Filter `menu_items` by `branch_id IS NULL OR branch_id = userBranchId`, and consult `menu_item_branch_visibility` when `branch_visibility = 'specific'`.

### 7. `branch_managers` SELECT policy is too narrow
Current policy only allows the manager to see **their own** assignment. The admin policy is `ALL` so admins are fine, but the manager themselves can't see who else manages other branches (probably desired) AND, more importantly, **the existing UI never shows the manager their own assigned branch name** because it joins through `branches` and that join may return NULL under the manager's RLS context. Confirm and adjust `useUserBranch` to read from `branch_managers + branches` directly with the right policy.

### 8. Wines category is set to inactive but still used
`Wines` (slug `wines`) is `is_active = false` in DB, yet `Spirits.tsx` page still exists and the Header may still link to it. Either delete the orphan page/links or flip the category active.

### 9. Leaked Password Protection is OFF
Supabase linter flagged it. Customer accounts can be created with passwords from known breach lists. **One toggle in Cloud → Auth Settings → Email → Password HIBP Check.** No code change.

### 10. `MAINTENANCE_MODE` is hardcoded to `true`
You have to ship a code edit to flip it. Move the flag into a `app_settings` table (single row, admin-only update) and read it via a hook with realtime subscription. Then you can toggle from the admin dashboard without a deploy.

---

## 🟢 MEDIUM — polish

### 11. Finance hooks fetch ALL rows with no `.limit()`
`useFinancialTransactions`, `useExpenses`, `useInvoices` will hit Supabase's 1000-row default cap once you grow. Add pagination or `.limit(500)` with a "Load more" button.

### 12. No foreign keys defined anywhere
The schema dump shows `No foreign keys for the table …` for every table. Orphan rows are possible (e.g., `order_items` pointing at a deleted order). Real FKs would protect integrity AND speed up Supabase auto-generated TypeScript joins (`orders!inner(...)`).

**Fix:** Add FKs with `ON DELETE CASCADE` for child tables (order_items → orders, branch_managers → branches, etc.) and `ON DELETE SET NULL` where appropriate (orders.branch_id → branches).

---

## ✅ What's working well
- RLS enabled on every table; no unprotected PII.
- `has_role()` security-definer pattern is correct (no recursion).
- `add_loyalty_points` is properly hardened (bounds, source whitelist, dup-prevention).
- Audit log + admin-only SELECT policy are correct.
- Paystack maintenance lock works for non-admins.
- Edge functions (`paystack-verify`, `paystack-initialize`, `mascot-chat`, `admin-*`) all verify auth.
- Categories system is fully dynamic and rendering correctly.

---

## 📋 Proposed implementation order

If you approve, I'll switch to default mode and tackle them in this order — each is a discrete commit you can review:

1. **Migration 1** — Fix `profiles` admin-update RLS + backfill manager branch_id (#2).
2. **Migration 2** — Trigger to refund cancelled orders in finance + recompute summary (#1) + backfill cancelled refund rows.
3. **Code** — `CartSheet.placeOrder` writes `branch_id`; backfill orders.branch_id from profiles (#3).
4. **Code** — One-time branch-selection modal for users with NULL branch (#4).
5. **Code** — `/branch-dashboard` page + role-based redirects (#5).
6. **Code** — Branch-aware `CategoryPage.tsx` (#6).
7. **Migration 3** — Foreign keys with proper cascade rules (#12).
8. **Code** — `app_settings` table + admin maintenance toggle (#10).
9. **Code** — Pagination on finance hooks (#11).
10. **Cleanup** — Remove orphan Spirits page or re-activate Wines (#8).
11. **Manual** — You enable Password HIBP Check in Cloud (#9). I can't toggle that.

Should I proceed with all 11, or do you want me to start with just the **5 critical** ones (#1–#5) first?
