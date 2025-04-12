from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import the NBA API endpoint
from nba_api.stats.endpoints import leaguestandingsv3
from nba_api.stats.endpoints import scoreboardv2
from datetime import datetime, timedelta, timezone
import time # Added for cache timestamping

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",  # Allow Next.js default port
    "localhost:3000" # Sometimes needed without http
    # Add any other origins you might deploy your frontend to
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Simple In-Memory Cache --- 
cache_store = {}
CACHE_DURATION = timedelta(minutes=5) # Cache data for 5 minutes
# --- End Cache --- 

@app.get("/")
def read_root():
    return {"message": "NBA Today Dashboard API"}

# Endpoint to get league standings
@app.get("/api/standings")
def get_standings():
    cache_key = "standings"
    current_time = time.time()

    # Check cache
    if cache_key in cache_store:
        cached_data = cache_store[cache_key]
        if current_time - cached_data['timestamp'] < CACHE_DURATION.total_seconds():
            print(f"Returning cached data for {cache_key}")
            return cached_data['data']
        else:
            print(f"Cache expired for {cache_key}")
    else:
        print(f"No cache found for {cache_key}")

    # If cache miss or expired, fetch fresh data
    print(f"Fetching fresh data for {cache_key}")
    try:
        standings = leaguestandingsv3.LeagueStandingsV3()
        fresh_data = standings.get_dict()
        
        # Update cache
        cache_store[cache_key] = {
            'data': fresh_data,
            'timestamp': current_time
        }
        return fresh_data
    except Exception as e:
        print(f"Error fetching standings: {e}")
        # Return stale data if available, otherwise raise error
        if cache_key in cache_store:
            print("Returning stale cache data due to fetch error.")
            return cache_store[cache_key]['data']
        else:
            raise HTTPException(status_code=502, detail=f"Failed to fetch standings and no cache available: {e}")

# Endpoint to get recent games (+/- 3 days) using ScoreboardV2 with resilience and cache
@app.get("/api/games/recent")
def get_recent_games():
    cache_key = "recent_games"
    current_time = time.time()

    # Check cache
    if cache_key in cache_store:
        cached_data = cache_store[cache_key]
        if current_time - cached_data['timestamp'] < CACHE_DURATION.total_seconds():
            print(f"Returning cached data for {cache_key}")
            return cached_data['data']
        else:
            print(f"Cache expired for {cache_key}")
    else:
        print(f"No cache found for {cache_key}")

    # If cache miss or expired, fetch fresh data
    print(f"Fetching fresh data for {cache_key}")
    all_games = []
    today = datetime.now(timezone.utc).date() # Use timezone-aware date if needed
    dates_to_check = [(today + timedelta(days=i)) for i in range(-3, 4)]

    for check_date in dates_to_check:
        date_str = check_date.strftime('%m/%d/%Y')
        try:
            # Fetch scoreboard for the specific date
            print(f"Attempting to fetch scoreboard for date {date_str}...") # Log attempt
            scoreboard = scoreboardv2.ScoreboardV2(game_date=date_str)
            data = scoreboard.get_dict()
            print(f"Successfully fetched scoreboard for date {date_str}.") # Log success

            # Find required result sets
            game_header_set = next((rs for rs in data['resultSets'] if rs['name'] == 'GameHeader'), None)
            line_score_set = next((rs for rs in data['resultSets'] if rs['name'] == 'LineScore'), None)

            if not game_header_set or not line_score_set:
                print(f"Warning: Missing required data sets ('GameHeader' or 'LineScore') for date {date_str}. Skipping date.")
                continue # Skip this date if essential data is missing

            # --- Process GameHeader --- 
            gh_headers = game_header_set['headers']
            game_id_gh_idx = gh_headers.index('GAME_ID')
            date_gh_idx = gh_headers.index('GAME_DATE_EST')
            status_id_gh_idx = gh_headers.index('GAME_STATUS_ID')
            status_text_gh_idx = gh_headers.index('GAME_STATUS_TEXT')
            home_id_gh_idx = gh_headers.index('HOME_TEAM_ID')
            vis_id_gh_idx = gh_headers.index('VISITOR_TEAM_ID')
            
            # Create a mapping of game_id to game details
            game_details = {row[game_id_gh_idx]: {
                "GAME_ID": row[game_id_gh_idx],
                "GAME_DATE_EST": row[date_gh_idx][:10], # Get YYYY-MM-DD part
                "GAME_STATUS_ID": row[status_id_gh_idx],
                "GAME_STATUS_TEXT": row[status_text_gh_idx],
                "HOME_TEAM_ID": row[home_id_gh_idx],
                "VISITOR_TEAM_ID": row[vis_id_gh_idx],
                "home_team": None, # Placeholder
                "visitor_team": None # Placeholder
            } for row in game_header_set['rowSet']}

            # --- Process LineScore --- 
            ls_headers = line_score_set['headers']
            team_id_ls_idx = ls_headers.index('TEAM_ID')
            game_id_ls_idx = ls_headers.index('GAME_ID')
            abbr_ls_idx = ls_headers.index('TEAM_ABBREVIATION')
            pts_ls_idx = ls_headers.index('PTS')
            wl_ls_idx = ls_headers.index('TEAM_WINS_LOSSES') # e.g., '1-0'

            for row in line_score_set['rowSet']:
                game_id = row[game_id_ls_idx]
                if game_id in game_details:
                    team_info = {
                        "TEAM_ID": row[team_id_ls_idx],
                        "TEAM_ABBREVIATION": row[abbr_ls_idx],
                        "PTS": row[pts_ls_idx],
                        "WL": row[wl_ls_idx]
                    }
                    # Determine if home or visitor and assign
                    if team_info["TEAM_ID"] == game_details[game_id]["HOME_TEAM_ID"]:
                         game_details[game_id]["home_team"] = team_info
                    elif team_info["TEAM_ID"] == game_details[game_id]["VISITOR_TEAM_ID"]:
                         game_details[game_id]["visitor_team"] = team_info

            # Add processed games for this date to the main list
            all_games.extend(game_details.values())

        except Exception as e:
            # Log error for the specific date but continue processing other dates
            print(f"ERROR processing scoreboard for date {date_str}: {e}. Skipping date.")
            continue

    # Sort all collected games by date and status (e.g., Final games last)
    all_games.sort(key=lambda x: (x.get('GAME_DATE_EST',''), x.get('GAME_STATUS_ID', 0)))

    if not all_games and dates_to_check: # Check if any games were found at all
         print("Warning: No games were successfully processed for the requested date range.")

    # Prepare final data structure
    fresh_data = {"games": all_games}

    # Update cache only if we successfully processed some games
    if all_games:
        cache_store[cache_key] = {
            'data': fresh_data,
            'timestamp': current_time
        }
        return fresh_data
    elif cache_key in cache_store: # If fetch failed completely, return stale data if possible
        print("Returning stale cache data for recent_games due to fetch errors.")
        return cache_store[cache_key]['data']
    else: # If fetch failed and no cache, raise error
        raise HTTPException(status_code=502, detail="Failed to fetch recent games and no cache available.")

# Placeholder for future endpoints
# @app.get("/api/games/today")
# def get_todays_games():
#     # Add logic using nba_api here

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 