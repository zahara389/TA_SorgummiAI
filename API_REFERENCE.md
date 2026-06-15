# API Endpoints Quick Reference

## Base URL
```
http://localhost:3000/api/ai-monitoring
```

---

## Endpoints

### 1. Get Metrics
```
GET /metrics

Response:
{
  "status": "success",
  "data": {
    "avgLatency": "245ms",
    "tokenMin": "1250",
    "successRate": "95%",
    "totalInteractions": "42"
  }
}
```

### 2. Get Interactions
```
GET /interactions
  ?page=1
  &limit=10
  &search=query
  &status=SUCCESS

Query Parameters:
- page (default: 1)
- limit (default: 10)
- search (string, searches user/question/answer)
- status (SUCCESS|FAILED|TIMEOUT|RETRY or empty for all)

Response:
{
  "status": "success",
  "data": [
    {
      "id": "chat_123",
      "user": "John Doe",
      "userId": 1,
      "message": "Bagaimana cara menanam sorgum?",
      "aiResponse": "Pertama...",
      "status": "SUCCESS",
      "timestamp": "2024-05-31T10:30:00",
      "time": "5m ago",
      "latency": 245,
      "tokens": 150,
      "confidence": 0.95
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### 3. Get Knowledge Gaps
```
GET /knowledge-gaps

Response:
{
  "status": "success",
  "data": [
    {
      "id": "gap_123",
      "question": "Harga pasar sorgum terkini?",
      "text": "Harga pasar sorgum terkini?",
      "occurrences": 5,
      "status": "OPEN",
      "user": "Unknown",
      "userId": null,
      "confidence": 0.3,
      "errorType": "NOT_FOUND",
      "createdAt": "2024-05-31T10:30:00",
      "updatedAt": "2024-05-31T10:35:00"
    }
  ],
  "total": 3
}
```

### 4. Retrain AI
```
POST /retrain

Body:
{
  "gapId": "gap_123"  // optional - marks this gap as resolved
}

Response:
{
  "status": "success",
  "message": "AI berhasil dilatih ulang",
  "data": {
    "success": true,
    "data": {
      "total_faqs": 45,
      "total_articles": 23,
      "total_products": 12,
      "faqs": [...],
      "articles": [...],
      "products": [...],
      "trained_at": "2024-05-31T10:30:00"
    }
  }
}
```

### 5. Get Status
```
GET /status

Response:
{
  "status": "success",
  "data": {
    "gemini": {
      "status": "ONLINE",
      "latency": 432
    },
    "metrics": {
      "avgLatency": "245ms",
      "tokenMin": "1250",
      "successRate": "95%",
      "totalInteractions": "42"
    }
  }
}
```

### 6. Export Data
```
GET /export?format=CSV

Query Parameters:
- format: CSV (default) or EXCEL

Response:
- Content-Type: text/csv or application/vnd.ms-excel
- Downloads file: ai_monitoring_2024-05-31.csv

Content:
User,Question,Answer,Time,Status,Latency (ms),Tokens
"John Doe","How to grow?","First...","2024-05-31T10:30:00","SUCCESS","245","150"
```

### 7. Log Interaction (Internal)
```
POST /log-interaction

Body:
{
  "userId": "1",
  "question": "Bagaimana cara menanam sorgum?",
  "answer": "Pertama lakukan persiapan lahan...",
  "status": "SUCCESS",
  "latency": 245,
  "tokens": 150,
  "confidence": 0.95,
  "errorMessage": null
}

Response:
{
  "status": "success",
  "data": {
    "id": "chat_123",
    "user_id": 1,
    "user_name": "John Doe",
    "question": "Bagaimana cara menanam sorgum?",
    "answer": "Pertama lakukan persiapan lahan...",
    "status": "SUCCESS",
    "latency": 245,
    "tokens": 150,
    "confidence": 0.95,
    "error_message": null,
    "created_at": "2024-05-31T10:30:00"
  },
  "message": "Interaksi berhasil dicatat"
}
```

---

## Status Values

### Interaction Status
- **SUCCESS** - AI answered successfully
- **FAILED** - AI couldn't answer
- **TIMEOUT** - Response took too long
- **RETRY** - Had to retry the request

### Knowledge Gap Status
- **OPEN** - Gap detected, not handled
- **IN_PROGRESS** - Being worked on
- **RESOLVED** - Fixed, marked as handled
- **ARCHIVED** - Old/irrelevant

### AI Status
- **ONLINE** - Gemini API is working
- **OFFLINE** - Gemini API unreachable

### Error Types
- **NOT_FOUND** - AI said "tidak tahu"
- **LOW_CONFIDENCE** - Confidence < 0.5
- **API_ERROR** - Gemini API error
- **FAQ_NOT_MATCHED** - Question doesn't match FAQ

---

## Usage Examples

### JavaScript/Fetch

```javascript
// Get metrics
const metrics = await fetch('/api/ai-monitoring/metrics').then(r => r.json());

// Search interactions
const interactions = await fetch(
  '/api/ai-monitoring/interactions?search=sorgum&status=SUCCESS'
).then(r => r.json());

// Get knowledge gaps
const gaps = await fetch('/api/ai-monitoring/knowledge-gaps').then(r => r.json());

// Retrain AI
const result = await fetch('/api/ai-monitoring/retrain', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ gapId: 'gap_123' })
}).then(r => r.json());

// Export CSV
window.location.href = '/api/ai-monitoring/export?format=CSV';
```

### cURL

```bash
# Get metrics
curl http://localhost:3000/api/ai-monitoring/metrics

# Get interactions
curl 'http://localhost:3000/api/ai-monitoring/interactions?page=1&limit=10'

# Get knowledge gaps
curl http://localhost:3000/api/ai-monitoring/knowledge-gaps

# Retrain AI
curl -X POST http://localhost:3000/api/ai-monitoring/retrain \
  -H 'Content-Type: application/json' \
  -d '{"gapId": "gap_123"}'

# Get status
curl http://localhost:3000/api/ai-monitoring/status

# Export CSV
curl http://localhost:3000/api/ai-monitoring/export?format=CSV > interactions.csv
```

### Python

```python
import requests

# Get metrics
response = requests.get('http://localhost:3000/api/ai-monitoring/metrics')
metrics = response.json()

# Search interactions
response = requests.get(
    'http://localhost:3000/api/ai-monitoring/interactions',
    params={'search': 'sorgum', 'status': 'SUCCESS'}
)
interactions = response.json()

# Retrain AI
response = requests.post(
    'http://localhost:3000/api/ai-monitoring/retrain',
    json={'gapId': 'gap_123'}
)
result = response.json()
```

---

## Error Responses

```json
{
  "status": "error",
  "message": "Descriptive error message"
}
```

### Common Errors

- **400 Bad Request**: Invalid parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server issue

---

## Rate Limits

- No explicit rate limits implemented
- Respect Gemini API rate limits
- Recommended: Max 1 request/second per client

---

## Performance Tips

1. **Use pagination** for large datasets
2. **Set appropriate limit** (10-50 items per page)
3. **Use search/filter** to reduce data transfer
4. **Cache results** on client side when possible
5. **Export data** periodically for backup

---

## Troubleshooting

### Empty data?
- Ensure user has sent at least one message to chatbot
- Check if GEMINI_API_KEY is set in .env
- Verify database tables exist
- Check server logs

### API returns error?
- Check request body format
- Verify all required fields are present
- Check Content-Type header is application/json
- Look at error message for details

### Export not working?
- Ensure browser allows downloads
- Check if any data exists
- Try different format (CSV vs Excel)
- Check browser console for errors

---

## Related Documentation

- [Setup Guide](./AI_MONITORING_SETUP.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Frontend Component](./src/components/dashboard/ChatbotMonitor.tsx)

