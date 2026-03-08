
# Fix M-Pesa STK Push -- Switch to Sandbox API

## Problem
The edge function is calling the **production** Safaricom API (`api.safaricom.co.ke`), but your Daraja credentials were created for the **sandbox** environment (`sandbox.safaricom.co.ke`). This causes a `400 Bad Request` on authentication every time.

## Solution
Update the `mpesa-stk-push` edge function to use the sandbox API endpoints and add an environment toggle so you can easily switch to production later when you go live.

## Changes

### 1. Update `supabase/functions/mpesa-stk-push/index.ts`
- Change the API URLs from production to sandbox:
  - Auth URL: `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`
  - STK URL: `https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest`
- Read an optional `MPESA_ENVIRONMENT` secret (defaults to `sandbox`) so you can switch to `production` later by just changing one value
- Add enhanced error logging that captures the full response body when auth fails, making future debugging easier
- Update the CallbackURL placeholder to use the project's actual domain

### 2. Clean up unused secrets
- Remove the old Equity Bank secrets that are no longer needed: `JENGA_API_KEY`, `JENGA_API_SECRET`, `JENGA_MERCHANT_CODE`, `EQUITY_PAYBILL_NUMBER`, `EQUITY_ACCOUNT_NUMBER`

## How it works after the fix

```text
User clicks "Pay Now"
       |
       v
Edge function reads MPESA_ENVIRONMENT (default: "sandbox")
       |
       v
Calls sandbox.safaricom.co.ke/oauth  (instead of api.safaricom.co.ke)
       |
       v
Gets access token successfully
       |
       v
Sends STK Push to sandbox API
       |
       v
User receives M-Pesa prompt on phone (sandbox simulated)
```

## Going Live Later
When you're ready for real payments, you just need to:
1. Complete the "Go Live" process on the Daraja portal
2. Update your secrets with the production consumer key/secret
3. Add an `MPESA_ENVIRONMENT` secret with value `production`

No code changes needed -- it will automatically switch to the production URLs.
