# AI Chatbot Monitoring - Setup & Implementation Guide

## 📋 Overview

The AI Chatbot Monitoring dashboard is now fully integrated with:
- ✅ Real-time performance metrics from actual chat logs
- ✅ Gemini API error tracking and logging
- ✅ Knowledge gaps detection and management
- ✅ Real-time AI online/offline status checking
- ✅ Export functionality (CSV/Excel)
- ✅ Auto-refresh every 30 seconds
- ✅ Search and filter capabilities
- ✅ Training/retraining functionality

---

## 🗄️ Database Changes

### New Tables Created

#### 1. **chat_logs** - Stores all chatbot interactions
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- user_name (VARCHAR)
- question (TEXT)
- answer (TEXT)
- status (ENUM: SUCCESS, FAILED, TIMEOUT, RETRY)
- latency (INT, milliseconds)
- tokens (INT, usage count)
- confidence (DECIMAL 0-1)
- error_message (TEXT, if failed)
- created_at (TIMESTAMP)
```

#### 2. **ai_metrics** - Tracks aggregate performance
```sql
- id (INT, PRIMARY KEY)
- avg_latency (INT)
- token_usage (INT, per minute)
- success_rate (DECIMAL 0-100)
- total_interactions (INT)
- total_success (INT)
- total_failed (INT)
- total_timeout (INT)
- total_retry (INT)
- api_errors (INT)
- updated_at (TIMESTAMP)
```

#### 3. **knowledge_gaps** - Detected gaps in AI knowledge
```sql
- id (INT, PRIMARY KEY)
- question (TEXT)
- user_id (INT, FOREIGN KEY)
- status (ENUM: OPEN, IN_PROGRESS, RESOLVED, ARCHIVED)
- occurrences (INT)
- confidence (DECIMAL)
- error_type (VARCHAR: NOT_FOUND, LOW_CONFIDENCE, API_ERROR, FAQ_NOT_MATCHED)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 4. **ai_errors** - API error tracking
```sql
- id (INT, PRIMARY KEY)
- error_type (VARCHAR: GEMINI_API_ERROR, TIMEOUT, RATE_LIMIT, etc)
- error_message (TEXT)
- error_code (VARCHAR)
- details (JSON)
- created_at (TIMESTAMP)
```

#### 5. **ai_training_metadata** - Training history
```sql
- id (INT, PRIMARY KEY)
- total_faqs (INT)
- total_articles (INT)
- total_products (INT)
- training_status (ENUM)
- trained_at (TIMESTAMP)
- next_training_at (TIMESTAMP)
- notes (TEXT)
```

---

## 🔧 Backend Implementation

### 1. **AIMonitoringService** (`services/aiMonitoringService.ts`)

**Enhanced Methods:**

```typescript
// Get real-time metrics
getMetrics() 
  -> Returns: { avgLatency, tokenMin, successRate, totalInteractions }

// Get paginated interactions with search/filter
getInteractions(page, limit)
  -> Query params: page, limit, search, status

// Detect knowledge gaps from AI responses
detectKnowledgeGap(question, answer, userId, confidence)
  -> Automatically creates gap if:
     - AI says "tidak tahu"
     - Confidence < 0.5
     - API error occurred
     - FAQ not matched

// Log interactions to database
logInteraction(userId, question, answer, status, latency, tokens, confidence)
  -> Automatically updates metrics
  -> Automatically detects gaps if needed

// Check Gemini API status
checkGeminiStatus()
  -> Returns: { status: "ONLINE" | "OFFLINE", latency: number }

// Retrain AI with all knowledge sources
retrainAI(gapId?)
  -> Gets all FAQs, articles, products
  -> Updates knowledge base
  -> Marks gap as RESOLVED if provided

// Export interactions
exportInteractions(format: "CSV" | "EXCEL")
  -> Returns formatted data for download
```

### 2. **AIMonitoringController** (`controllers/aiMonitoringController.ts`)

**Endpoints:**

```
GET  /api/ai-monitoring/metrics
     Returns real-time performance metrics

GET  /api/ai-monitoring/interactions?page=1&limit=10&search=&status=
     Returns paginated interactions with filtering

GET  /api/ai-monitoring/knowledge-gaps
     Returns all detected knowledge gaps

POST /api/ai-monitoring/retrain
     Body: { gapId?: string }
     Retrains AI with all knowledge sources

GET  /api/ai-monitoring/status
     Returns Gemini API status and metrics

GET  /api/ai-monitoring/export?format=CSV
     Returns CSV/Excel download of interactions

POST /api/ai-monitoring/log-interaction (internal)
     Body: { userId, question, answer, status, latency, tokens, confidence }
     Logs a new interaction (called by chat endpoint)
```

### 3. **Chat Messages Endpoint Integration**

Added automatic logging to `POST /api/chat/messages.php`:

```typescript
// After bot responds, logs:
- User ID and name
- Question and answer
- Response time (latency)
- Status (SUCCESS, FAILED, FALLBACK)
- Confidence level
- Error message if failed

// Automatically:
- Creates chat_log entry
- Updates ai_metrics
- Detects knowledge gaps
- Logs API errors
```

---

## 💻 Frontend Implementation

### ChatbotMonitor Component

**Features:**

1. **Real-time Performance Card**
   - Avg Latency (ms)
   - Token/min usage
   - Success Rate (%)
   - Total Interactions count
   - Live AI status (ONLINE/OFFLINE)

2. **Recent Interactions**
   - Search by user name or question
   - Filter by status (All, SUCCESS, FAILED)
   - Filter by time (All, Today, This Week)
   - Paginated display (10 per page)
   - Detail view modal
   - Export to CSV/Excel

3. **Knowledge Gaps**
   - Display detected gaps
   - Show occurrence count
   - "Update Brain" actions
   - Mark as handled button
   - "Train AI Again" button

4. **Auto-refresh**
   - Every 30 seconds
   - Real-time data updates
   - Live status checking

5. **Status Indicators**
   - SUCCESS (green, checkmark)
   - FAILED (red, X mark)
   - TIMEOUT (orange)
   - RETRY (blue)

---

## 🚀 How It Works

### Flow Diagram

```
User asks question
       ↓
Chat API receives message
       ↓
Checks if topic is sorgum
       ↓
Calls Gemini API
       ↓
Gets response or fallback
       ↓
Logs to chat_logs table:
  - question, answer
  - latency, tokens
  - status (success/failed)
  - confidence level
       ↓
Checks for knowledge gap:
  - AI said "tidak tahu"?
  - Confidence < 0.5?
  - API error?
       ↓
If gap detected → Add to knowledge_gaps
       ↓
Updates ai_metrics aggregate
       ↓
Sends response to frontend
       ↓
Frontend displays in monitoring dashboard
```

### Knowledge Gap Detection

Gaps are detected when:

1. **NOT_FOUND**: AI explicitly says "tidak tahu"
2. **LOW_CONFIDENCE**: Confidence score < 0.5
3. **API_ERROR**: Gemini API failed
4. **FAQ_NOT_MATCHED**: Question doesn't match any FAQ

---

## 📊 Real-time Status Checking

The frontend checks AI status every 30 seconds:

```typescript
// In ChatbotMonitor component
useEffect(() => {
  const interval = setInterval(() => {
    loadData(); // Fetches metrics, interactions, gaps
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

**Status Determination:**
- **ONLINE**: Gemini API responds within timeout
- **OFFLINE**: API unreachable or times out

---

## 📥 Export Functionality

### CSV Export

Headers:
```
User | Question | Answer | Time | Status | Latency (ms) | Tokens
```

Example row:
```
"John Doe","How to grow sorghum?","Sorghum requires...","2024-05-31T10:30:00","SUCCESS","245","150"
```

### Excel Export

- Same data as CSV
- Can open with Excel/Sheets
- Proper cell formatting

---

## 🔄 Training & Retraining

### Auto-Training Flow

When user clicks "LATIH AI LAGI":

1. Collects all FAQs (count)
2. Collects all Articles (count)
3. Collects all Products (count)
4. Updates ai_training_metadata
5. Marks any selected gap as RESOLVED
6. Shows success toast

```typescript
POST /api/ai-monitoring/retrain
{
  "gapId": "gap_1234567890" // optional
}
```

Response:
```json
{
  "status": "success",
  "message": "AI berhasil dilatih ulang",
  "data": {
    "total_faqs": 45,
    "total_articles": 23,
    "total_products": 12,
    "trained_at": "2024-05-31T10:30:00"
  }
}
```

---

## ⚠️ Error Handling

### Logged Error Types

1. **GEMINI_API_ERROR**
   - API key invalid
   - API unreachable
   - Rate limit exceeded

2. **TIMEOUT**
   - Response took > 30s

3. **RATE_LIMIT**
   - API quota exceeded

4. **RETRAIN_ERROR**
   - Failed to update knowledge base

---

## 🔍 Search & Filter Logic

### Search Query
Searches across:
- User name
- Question text
- Answer text (in detail view)

### Status Filter
- Semua (All)
- SUCCESS
- FAILED
- TIMEOUT
- RETRY

### Time Filter
- Semua (All time)
- Hari ini (Today)
- Minggu ini (This week)

---

## 📈 Metrics Calculation

### Average Latency
```
Total latency of all interactions / Total interactions
```

### Token/Min
```
Total tokens used / Duration in minutes
```

### Success Rate
```
(Successful interactions / Total interactions) * 100
```

---

## 🐛 Troubleshooting

### No data showing?

1. Check if user has chatted with AI at least once
2. Verify Gemini API key is set in `.env`
3. Check browser console for errors
4. Refresh page

### Status shows OFFLINE?

1. Check internet connection
2. Verify GEMINI_API_KEY is valid
3. Check if API quota is exceeded
4. Check Gemini API status page

### Export not working?

1. Check if any interactions exist
2. Check browser download permissions
3. Try different format (CSV vs Excel)

---

## 📝 Environment Variables Required

```env
GEMINI_API_KEY=your_api_key_here
```

---

## 🎯 Next Steps

1. **Test the implementation:**
   - Start chatting with the AI bot
   - Open dashboard to see metrics update in real-time
   - Try exporting data

2. **Monitor performance:**
   - Check for knowledge gaps regularly
   - Train AI when gaps detected
   - Review metrics trends

3. **Optimize:**
   - Add more FAQs/Articles to knowledge base
   - Train AI after adding new content
   - Monitor success rate and adjust if needed

---

## 📚 API Reference

See the full API documentation in the routes/controllers for detailed parameter specifications.

