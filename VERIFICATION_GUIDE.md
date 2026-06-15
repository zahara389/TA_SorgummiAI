# Verification & Testing Guide

## Pre-Deployment Checks

### ✅ File Changes Completed

- [x] `database.sql` - Added 5 new tables
- [x] `server.ts` - Added interaction logging and error tracking
- [x] `services/aiMonitoringService.ts` - Complete rewrite
- [x] `controllers/aiMonitoringController.ts` - Enhanced with real data
- [x] `routes/aiMonitoring.ts` - Properly integrated
- [x] `src/components/dashboard/ChatbotMonitor.tsx` - Ready for use

### ✅ Dependencies Installed

```bash
npm list @google/generative-ai
npm list sonner
npm list recharts
npm list motion
```

Should all show versions without errors.

### ✅ Environment Variables

```bash
# Check .env file exists
cat .env

# Should contain:
GEMINI_API_KEY=your_key_here
```

---

## Step-by-Step Testing

### Step 1: Start Server
```bash
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3000
Connected to database
```

**Troubleshooting:**
- If port 3000 in use: change PORT in server.ts
- If database error: check db.json is writable
- If package error: run `npm install` again

---

### Step 2: Verify API is Responding
```bash
# Test basic endpoint
curl http://localhost:3000/api/ai-monitoring/metrics

# Should return:
# {
#   "status": "success",
#   "data": {
#     "avgLatency": "0ms",
#     "tokenMin": "0",
#     "successRate": "0%",
#     "totalInteractions": "0"
#   }
# }
```

**If fails:**
- Check server is running
- Check port number
- Check firewall isn't blocking
- Check URL is correct

---

### Step 3: Test Frontend Loads
```bash
# Open in browser:
http://localhost:3000
```

**Expected:**
- Dashboard loads without errors
- Console shows no 404s
- All components render

**Common Issues:**
- Blank page? Check browser console for errors
- 404? Check vite.config.ts server settings
- Slow load? Check network tab in devtools

---

### Step 4: Send Test Chat

1. Navigate to Chat AI page
2. Click chatbot icon
3. Send message: "Bagaimana cara menanam sorgum?"

**Expected Response:**
- Bot responds with sorghum information
- Response takes 2-5 seconds

**If fails:**
- Check GEMINI_API_KEY is set
- Check internet connection
- Check API quota not exceeded
- Check browser console for errors

---

### Step 5: Check Dashboard Updates

1. Go back to Dashboard
2. Open "AI Chatbot Monitoring" tab

**Expected Data:**
- Avg Latency: ~500-2000ms
- Token/Min: > 0
- Success Rate: 100% (if first message)
- Total Interactions: 1
- AI Status: ONLINE ✓
- Recent Interactions: Should show your message
- Knowledge Gaps: Empty (good response)

**Debugging:**
```bash
# Check db.json for data:
cat db.json | jq '.chat_logs'

# Check if metrics updated:
curl http://localhost:3000/api/ai-monitoring/metrics | jq
```

---

### Step 6: Test Search & Filter

**In Recent Interactions:**

1. Try search for username
   - Type in search box
   - Should filter results

2. Try status filter
   - Select "SUCCESS"
   - Should show only successful interactions

3. Try pagination
   - Check page numbers work
   - Navigate between pages

**Expected:**
- Filters work instantly
- No UI lag
- Results update correctly

---

### Step 7: Test Export

**CSV Export:**
```bash
# Click CSV button in dashboard
# File should download: ai_monitoring_2024-05-31.csv

# Verify contents:
cat ~/Downloads/ai_monitoring_*.csv

# Should show:
# User,Question,Answer,Time,Status,Latency (ms),Tokens
# "John Doe","Bagaimana...","Pertama...","2024-05-31...","SUCCESS","245","150"
```

**Excel Export:**
```bash
# Click Excel button
# File should download with .csv extension
# Can open in Excel/Sheets
```

---

### Step 8: Test Knowledge Gap Detection

**Scenario 1: Low Confidence Response**

1. Send question that might have low confidence
2. Check dashboard
3. Should appear in Knowledge Gaps or be high confidence

**Scenario 2: API Error**

1. Temporarily disable API key
2. Send chat message
3. Should fail gracefully
4. Error should be logged
5. Re-enable API key and retry

---

### Step 9: Test Real-time Refresh

1. Open Dashboard with monitoring
2. Keep browser open
3. Send new chat message from another tab
4. Wait up to 30 seconds
5. Dashboard should auto-update with new interaction

**Verification:**
- New message appears in Recent Interactions
- Metrics update automatically
- No manual refresh needed

---

### Step 10: Test AI Status Check

**In Dashboard:**
- Look for "AI Status" badge
- Should show "ONLINE ✓" if API is working
- Shows latency in ms

**Offline Test:**
1. Disable internet or block API
2. Refresh dashboard
3. Should show "OFFLINE ✗"
4. Restore connection
5. Should return to ONLINE after 30s

---

## Load Testing

### Send Multiple Messages

```bash
# Send 10 test messages quickly
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/chat/messages.php \
    -H "Content-Type: application/json" \
    -d "{\"user_id\": \"1\", \"message\": \"Test $i\"}" \
    -w "\n"
  sleep 1
done
```

**Check Dashboard:**
- Total interactions should show 10+
- Avg latency should calculate correctly
- Success rate should be accurate
- No errors in console

---

## Performance Testing

### Monitor Metrics

1. Send 50 messages over time
2. Check database size: `ls -lh db.json`
3. Check metrics calculation time
4. Monitor memory usage

**Expected:**
- db.json < 10MB for 1000 interactions
- Metrics API responds < 500ms
- Dashboard doesn't lag
- Memory stable

---

## Error Scenario Testing

### Test 1: API Timeout
```bash
# Simulate slow API
# Dashboard should show "Retrying" or "Timeout" status
# After 3 retries, mark as FAILED
```

### Test 2: Missing API Key
```bash
# Remove GEMINI_API_KEY from .env
# Restart server
# Try sending chat
# Should use fallback response
# Error logged to database
```

### Test 3: Rate Limit
```bash
# Send 100 requests in 1 second
# API should return rate limit error
# Should be logged in ai_errors
# Dashboard should show error count
```

### Test 4: Database Full
```bash
# Manually edit db.json to simulate issues
# Dashboard should handle gracefully
# Show error message to user
```

---

## Mobile Testing

### Responsive Design

1. Open dashboard on mobile
2. Check layout adjusts
3. Buttons are clickable
4. Text is readable
5. Charts display properly

**Screen Sizes to Test:**
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1920px (Full HD)

---

## Browser Compatibility

### Test on Different Browsers

- [x] Chrome/Chromium (latest)
- [x] Firefox (latest)
- [x] Safari (latest)
- [x] Edge (latest)

**Expected:**
- All features work
- No console errors
- Responsive layout
- Smooth animations

---

## Data Integrity Tests

### Test 1: Data Persistence
```bash
# 1. Add interactions
# 2. Restart server
# 3. Data should still exist in db.json
# 4. Metrics should be recalculated correctly
```

### Test 2: User Resolution
```bash
# Check that user names appear correctly
# Not just user IDs
# Query:
curl http://localhost:3000/api/ai-monitoring/interactions | jq '.data[0].user'
# Should show: "John Doe" not "1"
```

### Test 3: Timestamp Accuracy
```bash
# Check all timestamps are ISO 8601
# Check relative time display ("5m ago")
# Check sorting by newest first
```

---

## Security Tests

### Test 1: Input Validation
```bash
# Try SQL injection in search:
curl 'http://localhost:3000/api/ai-monitoring/interactions?search="; DROP TABLE--'
# Should safely handle and return no results

# Try XSS in user name:
# Add user with name: <script>alert('xss')</script>
# Should display escaped, not execute
```

### Test 2: Authentication
```bash
# All endpoints should be accessible (for this monitoring system)
# Check if there are intended auth requirements
# Verify error handling for invalid inputs
```

---

## Logging Verification

### Check Server Logs
```bash
# Terminal should show:
# - Every request logged
# - Database saves logged
# - Error messages logged

# Example log:
# [2024-05-31 10:30:00] POST /api/chat/messages.php - User 1
# [2024-05-31 10:30:05] Interaction logged: chat_123
# [2024-05-31 10:30:05] Metrics updated
```

---

## Final Verification Checklist

Before declaring "READY FOR PRODUCTION":

- [ ] All API endpoints respond without errors
- [ ] Dashboard shows real data (not mock data)
- [ ] Metrics calculate correctly
- [ ] Knowledge gaps detect properly
- [ ] Export produces valid files
- [ ] AI status checks work
- [ ] Auto-refresh updates data every 30s
- [ ] Search and filters work
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Database persists data
- [ ] Error handling works
- [ ] Performance is acceptable
- [ ] All 3 documentation files present
- [ ] Environment variables configured

---

## Success Criteria

✅ **All tests pass?**

The implementation is complete and ready!

**Performance Baseline:**
- API response time: < 500ms
- Dashboard load time: < 3s
- Memory usage: < 200MB
- CPU usage: < 20%

**Data Accuracy:**
- Metrics match calculations
- User names resolve correctly
- Timestamps are accurate
- Export data complete

**User Experience:**
- Interface responsive
- No lag or freezing
- Smooth animations
- Clear error messages

---

## Troubleshooting Matrix

| Issue | Check | Solution |
|-------|-------|----------|
| No data in dashboard | Send chat message | Wait for auto-refresh |
| API error 500 | Server logs | Check error details |
| Slow response | Network tab | Check for slow queries |
| Empty metrics | db.json exists | Check database init |
| Mobile layout broken | Responsive size | Check viewport settings |
| Export fails | Data exists | Check browser permissions |
| AI OFFLINE | API key set | Verify GEMINI_API_KEY |
| Can't search | Interactions exist | Check search implementation |
| Knowledge gaps missing | Response quality | Check gap detection logic |

---

## Getting Help

If issues persist:

1. **Check logs first** - Server console and browser console
2. **Verify environment** - All .env variables set
3. **Check dependencies** - npm list all packages
4. **Review documentation** - Read setup guide
5. **Test API directly** - Use curl to bypass frontend
6. **Check database** - cat db.json and verify structure

---

## Next Steps After Verification

1. ✅ Monitor dashboard daily
2. ✅ Review knowledge gaps weekly
3. ✅ Export data monthly for backup
4. ✅ Train AI when gaps detected
5. ✅ Scale database if needed
6. ✅ Add more FAQs based on gaps

**Happy testing!** 🎉

