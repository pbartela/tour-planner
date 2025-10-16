#!/bin/bash

# ==============================================================================
# API Test Script for Tour Planner
# ==============================================================================
#
# This script provides curl commands to test the API endpoints.
#
# Prerequisites:
# 1. The Astro development server must be running (usually on http://localhost:4321).
# 2. You need `jq` installed to parse JSON responses (e.g., `sudo apt-get install jq` or `brew install jq`).
#
# How to use:
# 1. Make this script executable: `chmod +x test-api.sh`
# 2. Run the sign-in command (Step 1).
# 3. Check your email for a magic link from Supabase and click it to sign in.
# 4. Obtain the JWT access token from your browser's cookies (Step 2).
# 5. Export the token as an environment variable: `export ACCESS_TOKEN="your_token_here"`
# 6. Run the subsequent commands to test the endpoints.
#

BASE_URL="http://localhost:4321/api"

# ==============================================================================
# Step 1: Authentication - Sign In
# ==============================================================================
echo "### Step 1: Requesting a magic link for sign-in... ###"
# Replace with your email address. You will receive a magic link from Supabase.
curl -X POST "$BASE_URL/auth/signin" \
-H "Content-Type: application/json" \
-d '{"email": "your-email@example.com"}'
echo -e "\n--> Check your email for the magic link to continue.\n"

# ==============================================================================
# Step 2: Obtain JWT Access Token
# ==============================================================================
echo "### Step 2: Manually obtain the JWT Access Token ###"
echo "After signing in via the magic link in your browser, you need to get the access token."
echo "1. Open your browser's developer tools."
echo "2. Go to the Application (or Storage) tab."
echo "3. Find the cookies for localhost:4321."
echo "4. Copy the value of the cookie named 'sb-access-token' (the name might vary)."
echo "5. Paste it below and run the export command in your terminal."
echo "------------------------------------------------------------------"
# Replace the placeholder with your actual token.
export ACCESS_TOKEN="your_jwt_access_token_here"
echo "--> Run this in your terminal: export ACCESS_TOKEN=\"your_jwt_access_token_here\""
echo "------------------------------------------------------------------\n"


# ==============================================================================
# Step 3: Profiles
# ==============================================================================
echo "### Step 3.1: Get your user profile... ###"
curl -X GET "$BASE_URL/profiles/me" \
-H "Cookie: sb-access-token=$ACCESS_TOKEN"
echo -e "\n"

echo "### Step 3.2: Update your user profile... ###"
curl -X PATCH "$BASE_URL/profiles/me" \
-H "Content-Type: application/json" \
-H "Cookie: sb-access-token=$ACCESS_TOKEN" \
-d '{
  "display_name": "Alex The Tour Master",
  "theme": "dark"
}'
echo -e "\n"


# ==============================================================================
# Step 4: Tours - Create and List
# ==============================================================================
echo "### Step 4.1: Create a new tour... ###"
# We'll capture the tour ID from the response for later use.
NEW_TOUR_RESPONSE=$(curl -s -X POST "$BASE_URL/tours" \
-H "Content-Type: application/json" \
-H "Cookie: sb-access-token=$ACCESS_TOKEN" \
-d '{
  "title": "Mountain Hike Adventure",
  "destination": "The Alps",
  "description": "An epic journey through the mountains.",
  "start_date": "2026-07-10T08:00:00Z",
  "end_date": "2026-07-15T18:00:00Z"
}')

echo "Create tour response: $NEW_TOUR_RESPONSE"
export TOUR_ID=$(echo $NEW_TOUR_RESPONSE | jq -r '.id')

if [ "$TOUR_ID" = "null" ]; then
    echo "--> Failed to create tour or parse ID. Please check your access token and server status."
    exit 1
fi
echo "--> New Tour ID captured: $TOUR_ID\n"

echo "### Step 4.2: Get a list of your active tours... ###"
curl -X GET "$BASE_URL/tours?status=active" \
-H "Cookie: sb-access-token=$ACCESS_TOKEN"
echo -e "\n"


# ==============================================================================
# Step 5: Tours - Get, Update, and Delete a specific tour
# ==============================================================================
if [ -z "$TOUR_ID" ] || [ "$TOUR_ID" = "null" ]; then
  echo "TOUR_ID is not set. Cannot proceed with tour-specific tests."
else
    echo "### Step 5.1: Get details of the newly created tour ($TOUR_ID)... ###"
    curl -X GET "$BASE_URL/tours/$TOUR_ID" \
    -H "Cookie: sb-access-token=$ACCESS_TOKEN"
    echo -e "\n"

    echo "### Step 5.2: Update the newly created tour ($TOUR_ID)... ###"
    curl -X PATCH "$BASE_URL/tours/$TOUR_ID" \
    -H "Content-Type: application/json" \
    -H "Cookie: sb-access-token=$ACCESS_TOKEN" \
    -d '{
      "description": "An updated, even more epic journey through the mountains.",
      "are_votes_hidden": true
    }'
    echo -e "\n"

    echo "### Step 5.3: Delete the newly created tour ($TOUR_ID)... ###"
    curl -i -X DELETE "$BASE_URL/tours/$TOUR_ID" \
    -H "Cookie: sb-access-token=$ACCESS_TOKEN"
    echo -e "\n--> Test finished. The tour with ID $TOUR_ID has been deleted."
fi
