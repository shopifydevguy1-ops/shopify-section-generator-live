# Testing Multiple Accounts on Same Device

## How to Test Trial Abuse Prevention

### Method 1: Test with Different Emails (Same Device)

1. **Create First Account:**
   - Sign up with email: `test1@example.com`
   - Use the free trial (20 copies)
   - Check that trial is active

2. **Create Second Account (Same Device):**
   - Sign out
   - Sign up with different email: `test2@example.com`
   - Try to use the free trial
   - **Expected Result:** Should be blocked or warned that device already used trial

3. **Check Database:**
   - Go to Supabase SQL Editor
   - Run: `SELECT * FROM device_fingerprints ORDER BY created_at DESC LIMIT 10;`
   - You should see both accounts linked to the same fingerprint

### Method 2: Check Device Fingerprint

1. **View Your Device Fingerprint:**
   - Open browser console (F12)
   - Go to `/support` page
   - The fingerprint is generated automatically
   - Check network tab to see if it's being sent

2. **Compare Fingerprints:**
   - Create account 1, note the fingerprint
   - Create account 2 on same device, check if fingerprint matches
   - If they match, the system should detect it

### Method 3: Check Admin Panel

1. **View Device Tracking:**
   - Go to admin panel
   - Check if you can see device/IP associations
   - Look for multiple users from same device

### Method 4: Database Queries

Run these in Supabase SQL Editor:

```sql
-- Check for multiple accounts from same device
SELECT 
  df.fingerprint_hash,
  COUNT(DISTINCT u.id) as account_count,
  STRING_AGG(u.email, ', ') as emails,
  STRING_AGG(u.id::text, ', ') as user_ids
FROM device_fingerprints df
JOIN users u ON df.user_id = u.id
GROUP BY df.fingerprint_hash
HAVING COUNT(DISTINCT u.id) > 1
ORDER BY account_count DESC;

-- Check for multiple accounts from same IP
SELECT 
  ll.ip_address,
  COUNT(DISTINCT u.id) as account_count,
  STRING_AGG(DISTINCT u.email, ', ') as emails
FROM login_logs ll
JOIN users u ON ll.user_id = u.id
WHERE ll.ip_address IS NOT NULL
GROUP BY ll.ip_address
HAVING COUNT(DISTINCT u.id) > 1
ORDER BY account_count DESC;

-- Check trial usage by device
SELECT 
  u.email,
  u.created_at,
  u.plan,
  df.fingerprint_hash,
  df.ip_address,
  s.status as subscription_status
FROM users u
LEFT JOIN device_fingerprints df ON u.id = df.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.plan = 'pro'
  AND u.created_at > NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;
```

## What to Look For

### ✅ System Working Correctly:
- Second account on same device gets blocked/warned
- Device fingerprint is the same for both accounts
- Database shows both accounts linked to same fingerprint
- Trial check returns `hasUsedTrial: true`

### ❌ System Not Working:
- Second account gets full trial without warning
- Different fingerprints for same device
- No device fingerprint records in database
- Trial check always returns `hasUsedTrial: false`

## Troubleshooting

1. **Fingerprint not being generated:**
   - Check browser console for errors
   - Ensure JavaScript is enabled
   - Check if device-fingerprint.ts is loaded

2. **Fingerprint not being saved:**
   - Check network tab for `/api/track-login` request
   - Verify request includes `fingerprintHash` in body
   - Check server logs for `[saveDeviceFingerprint]` messages

3. **Trial check not working:**
   - Verify `hasDeviceUsedTrial()` function is being called
   - Check database for existing device fingerprints
   - Ensure IP address is being captured correctly


