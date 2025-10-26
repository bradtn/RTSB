#!/bin/bash

# Real-Time WebSocket Testing Script
# Tests the complete real-time functionality end-to-end

echo "🔴 Real-Time WebSocket Testing Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test URLs
WS_HEALTH_URL="http://localhost:8001/health"
WS_EMIT_URL="http://localhost:8001/emit-update"
APP_URL="http://localhost:3000"
API_URL="http://localhost:3000/api"

echo -e "${BLUE}1. Testing WebSocket Server Health...${NC}"
health_response=$(curl -s $WS_HEALTH_URL)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ WebSocket server is running${NC}"
    echo "Response: $health_response"
    
    # Extract client count
    client_count=$(echo $health_response | grep -o '"connectedClients":[0-9]*' | cut -d':' -f2)
    echo -e "${YELLOW}Connected clients: $client_count${NC}"
else
    echo -e "${RED}❌ WebSocket server is not responding${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2. Testing Manual WebSocket Emission...${NC}"
test_data='{
    "event": "bidLineUpdate",
    "data": {
        "bidLineId": "test-realtime-123",
        "lineNumber": "999",
        "status": "TAKEN",
        "takenBy": "Test Script User",
        "takenAt": "'$(date -Iseconds)'"
    }
}'

emit_response=$(curl -s -X POST $WS_EMIT_URL \
    -H "Content-Type: application/json" \
    -d "$test_data")

if [[ $emit_response == *"success"* ]]; then
    echo -e "${GREEN}✅ WebSocket emission successful${NC}"
    echo "Response: $emit_response"
else
    echo -e "${RED}❌ WebSocket emission failed${NC}"
    echo "Response: $emit_response"
fi

echo ""
echo -e "${BLUE}3. Testing Next.js App Accessibility...${NC}"
app_response=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)
if [[ $app_response -eq 200 ]]; then
    echo -e "${GREEN}✅ Next.js app is accessible${NC}"
else
    echo -e "${RED}❌ Next.js app returned HTTP $app_response${NC}"
fi

echo ""
echo -e "${BLUE}4. Testing API Endpoints...${NC}"

# Test operations endpoint
operations_response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/operations)
if [[ $operations_response -eq 200 ]]; then
    echo -e "${GREEN}✅ Operations API is accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Operations API returned HTTP $operations_response (may require auth)${NC}"
fi

# Test bid lines endpoint
bidlines_response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/bid-lines)
if [[ $bidlines_response -eq 200 ]]; then
    echo -e "${GREEN}✅ Bid Lines API is accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Bid Lines API returned HTTP $bidlines_response (may require auth)${NC}"
fi

echo ""
echo -e "${BLUE}5. Performance Test - Multiple Emissions...${NC}"
echo "Sending 10 rapid WebSocket updates..."

for i in {1..10}; do
    test_data_loop='{
        "event": "bidLineUpdate",
        "data": {
            "bidLineId": "perf-test-'$i'",
            "lineNumber": "'$(printf "%03d" $i)'",
            "status": "AVAILABLE",
            "takenBy": null,
            "takenAt": "'$(date -Iseconds)'"
        }
    }'
    
    curl -s -X POST $WS_EMIT_URL \
        -H "Content-Type: application/json" \
        -d "$test_data_loop" > /dev/null
    
    echo -n "."
done

echo ""
echo -e "${GREEN}✅ Performance test completed${NC}"

echo ""
echo -e "${BLUE}6. Final Health Check...${NC}"
final_health=$(curl -s $WS_HEALTH_URL)
echo "Final server status: $final_health"

echo ""
echo -e "${GREEN}======================${NC}"
echo -e "${GREEN}🎉 TESTING COMPLETE!${NC}"
echo -e "${GREEN}======================${NC}"

echo ""
echo -e "${YELLOW}📋 MANUAL TESTING STEPS:${NC}"
echo "1. Open: http://localhost:3000/en/bid-lines in your browser"
echo "2. Open the browser console (F12) to see WebSocket connection logs"
echo "3. Open: file:///opt/RTB/shift-bidding-system/test-websocket.html in another tab"
echo "4. Test real-time updates by clicking buttons in the test page"
echo "5. Watch for toast notifications in the main app"
echo ""
echo -e "${YELLOW}📋 MULTI-CLIENT TESTING:${NC}"
echo "1. Open the bid lines page in multiple browser windows/tabs"
echo "2. Login as different users (or same user)"
echo "3. Make changes in one window"
echo "4. Watch for instant updates in other windows"
echo ""
echo -e "${YELLOW}📋 PRODUCTION SSL TESTING:${NC}"
echo "1. Deploy to HTTPS environment"
echo "2. Verify WSS (secure WebSocket) connections"
echo "3. Check browser console for SSL/TLS errors"
echo "4. Test cross-origin WebSocket connectivity"