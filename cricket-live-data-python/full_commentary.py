import re
import requests
import json
import time
import os

def get_innings_id(match_id):
    """Get the correct innings ID by trying different innings numbers"""
    innings = [4, 3, 2, 1]
    innings_id = ""
    
    for inning in innings:
        url = f"https://m.cricbuzz.com/api/mcenter/{match_id}/full-commentary/{inning}"
        print(f"Trying innings {inning}: {url}")
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://m.cricbuzz.com/'
            }
            
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                data = r.json()
                commentary = data.get("commentary", [])
                if len(commentary) == 0:
                    print(f"No commentary found for innings {inning}")
                else:
                    innings_id = commentary[0].get("inningsId")
                    if innings_id:
                        print(f"Found innings_id: {innings_id}")
                        return str(innings_id)
            else:
                print(f"Status code {r.status_code} for innings {inning}")
                
        except Exception as e:
            print(f"Error trying innings {inning}: {e}")
            continue
    
    print("No valid innings found, using default '1'")
    return "1"

def get_commentary_data(match_id, innings_id):
    """Get commentary data from API with retries"""
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            url = f"https://m.cricbuzz.com/api/mcenter/{match_id}/full-commentary/{innings_id}"
            print(f"Attempting API call (attempt {attempt + 1}): {url}")
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://m.cricbuzz.com/'
            }
            
            response = requests.get(url, timeout=15, headers=headers)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"Successfully got commentary data for match {match_id}")
                    return data
                except json.JSONDecodeError as e:
                    print(f"JSON decode error: {e}")
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
            else:
                print(f"API request failed with status {response.status_code}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                    
        except requests.exceptions.Timeout:
            print(f"Request timeout on attempt {attempt + 1}")
            if attempt < max_retries - 1:
                time.sleep(3)
                continue
        except Exception as e:
            print(f"Error fetching commentary data (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
    
    print(f"All {max_retries} attempts failed for match {match_id}")
    return None

def process_commentary_events(data):
    """Process commentary data to extract events"""
    try:
        if not data or 'commentary' not in data:
            print("No commentary data found")
            return None, []
            
        commentary_list = data['commentary'][0]['commentaryList']
        
        # Reverse sort by ballNbr to get latest deliveries first
        balls = sorted(
            [ball for ball in commentary_list if ball.get('ballNbr', 0) > 0],
            key=lambda x: x['ballNbr'],
            reverse=True
        )

        events = []
        latest_over = None

        for ball in balls:
            # Capture the latest overNumber
            if latest_over is None and 'overNumber' in ball:
                latest_over = ball['overNumber']

            # Get commentary text and clean it up
            comm_text = ball.get("commText", "").strip()
            
            event = ball.get("event", "")
            if event == "WICKET":
                ball_info = f"W, {comm_text}" if comm_text else "W"
                events.append(ball_info)
            elif event == "SIX":
                ball_info = f"6, {comm_text}" if comm_text else "6"
                events.append(ball_info)
            elif event == "FOUR":
                ball_info = f"4, {comm_text}" if comm_text else "4"
                events.append(ball_info)
            else:
                # Use totalRuns instead of legalRuns to include extras
                total_runs = ball.get("totalRuns", 0)
                ball_info = f"{total_runs}, {comm_text}" if comm_text else str(total_runs)
                events.append(ball_info)

            if len(events) == 12:
                break

        # Reverse to chronological order
        events.reverse()
        
        return latest_over, events
        
    except Exception as e:
        print(f"Error processing commentary events: {e}")
        return None, []

def scrape_full_commentary():
    """Main function to scrape full commentary data"""
    try:
        # Load matches data
        with open("matches.json", "r", encoding='utf-8') as f:
            matches_data = json.load(f)
        print(f"Loaded {len(matches_data)} matches from matches.json")
    except Exception as e:
        print(f"Error loading matches.json: {e}")
        return []

    full_commentary = []
    
    for i, match in enumerate(matches_data):
        print(f"\n{'='*60}")
        print(f"Processing match {i+1}/{len(matches_data)}: {match.get('match', 'Unknown')}")
        print(f"{'='*60}")
        
        try:
            scorecard_link = match.get("scorecard_links", "")
            if not scorecard_link:
                print(f"No scorecard link for match: {match.get('match', 'Unknown')}")
                full_commentary.append({
                    "match": match.get("match", "Unknown Match"),
                    "latest_over": "",
                    "events": []
                })
                continue
            
            # Extract match ID from scorecard link
            link_parts = scorecard_link.split("/")
            match_id = None
            
            # Try different positions where match ID might be
            for part in link_parts:
                if part.isdigit() and len(part) > 4:  # Match IDs are typically long numbers
                    match_id = part
                    break
            
            if not match_id:
                print(f"Could not extract match ID from: {scorecard_link}")
                full_commentary.append({
                    "match": match.get("match", "Unknown Match"),
                    "latest_over": "",
                    "events": []
                })
                continue
            
            print(f"Extracted Match ID: {match_id}")
            
            # Get the correct innings ID using the new logic
            innings_id = get_innings_id(match_id)
            print(f"Using innings ID: {innings_id}")
            
            # Get commentary data
            commentary_data = get_commentary_data(match_id, innings_id)
            
            if commentary_data:
                latest_over, events = process_commentary_events(commentary_data)
                
                match_commentary = {
                    "match": match.get("match", "Unknown Match"),
                    "latest_over": latest_over if latest_over is not None else "",
                    "events": events if events else []
                }
                print(f"✅ Success: Latest over: {latest_over}, Events: {len(events)}")
            else:
                print("❌ No commentary data retrieved")
                match_commentary = {
                    "match": match.get("match", "Unknown Match"),
                    "latest_over": "",
                    "events": []
                }
            
            full_commentary.append(match_commentary)
            
            # Add progressive delay between requests
            delay = min(3 + (i * 0.5), 10)  # Increase delay progressively, max 10 seconds
            print(f"Waiting {delay} seconds before next request...")
            time.sleep(delay)
            
        except Exception as e:
            print(f"❌ Error processing match {match.get('match', 'Unknown')}: {e}")
            full_commentary.append({
                "match": match.get("match", "Unknown Match"),
                "latest_over": "",
                "events": []
            })
            continue

    return full_commentary

def main():
    """Main function to scrape and save full commentary data"""
    print("Starting full commentary scraping...")
    
    full_commentary_data = scrape_full_commentary()
    
    if not full_commentary_data:
        print("No commentary data found")
        return
    
    # Save full commentary data
    try:
        with open("full_commentary.json", "w", encoding='utf-8') as f:
            json.dump(full_commentary_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(full_commentary_data)} commentary records to full_commentary.json")
    except Exception as e:
        print(f"Error saving commentary data: {e}")
    
    print("Full commentary scraping completed!")

if __name__ == "__main__":
    main()