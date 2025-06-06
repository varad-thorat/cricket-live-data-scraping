
import re
import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_matches():
    """Scrape live cricket matches data"""
    try:
        link = "https://www.cricbuzz.com/cricket-match/live-scores"
        source = requests.get(link, timeout=10).text
        page = BeautifulSoup(source, "lxml")

        container = page.find("div", class_="cb-col cb-col-100 cb-bg-white")
        if not container:
            print("No container found for matches")
            return []
            
        matches = container.find_all("div", class_="cb-mtch-lst cb-col cb-col-100 cb-tms-itm")
        
        # Initialize lists
        match = []
        match_no = []
        date_stadium = []
        live = []
        scorecard = []
        FullCommentary = []
        teams = []

        # Extract match titles
        for card in matches:
            try:
                title = card.find("a", class_="text-hvr-underline text-bold")
                match.append(title.text.strip() if title else "")
            except Exception as e:
                print(f"Error extracting match title: {e}")
                match.append("")

        # Extract match numbers
        for card in matches:
            try:
                title = card.find("span", class_="text-gray")
                if title:
                    match_no.append(re.sub(r'\&nbsp;\S*', '', title.text.strip()))
                else:
                    match_no.append("")
            except Exception as e:
                print(f"Error extracting match number: {e}")
                match_no.append("")

        # Extract date and stadium
        for card in matches:
            try:
                title = card.find("div", class_="text-gray")
                if title:
                    date_stadium.append(re.sub(r'\xa0\S*', '', title.text.strip()))
                else:
                    date_stadium.append("")
            except Exception as e:
                print(f"Error extracting date/stadium: {e}")
                date_stadium.append("")

        # Extract live score links
        for card in matches:
            try:
                title = card.find("a", attrs={"title": "Live Score"})
                if title:
                    text = title.text.strip()
                    href = title.get("href", "")
                    live.append({"text": text, "url": href})
                else:
                    live.append({"text": "Live Score", "url": ""})
            except Exception as e:
                print(f"Error extracting live score link: {e}")
                live.append({"text": "Live Score", "url": ""})

        # Extract scorecard links
        for card in matches:
            try:
                title = card.find("a", attrs={"title": "Scorecard"})
                if title:
                    text = title.text.strip()
                    href = title.get("href", "")
                    scorecard.append({"text": text, "url": href})
                else:
                    scorecard.append({"text": "Scorecard", "url": ""})
            except Exception as e:
                print(f"Error extracting scorecard link: {e}")
                scorecard.append({"text": "Scorecard", "url": ""})

        # Extract full commentary links
        for card in matches:
            try:
                title = card.find("a", attrs={"title": "Full Commentary"})
                if title:
                    text = title.text.strip()
                    href = title.get("href", "")
                    FullCommentary.append({"text": text, "url": href})
                else:
                    FullCommentary.append({"text": "Full Commentary", "url": ""})
            except Exception as e:
                print(f"Error extracting commentary link: {e}")
                FullCommentary.append({"text": "Full Commentary", "url": ""})

        # Extract team information
        for card in matches:
            try:
                # Match status logic
                match_status = (card.find("div", class_="cb-text-live") or 
                              card.find("div", class_="cb-text-complete") or 
                              card.find("span", class_="cb-text-preview"))
                match_status = match_status.text.strip() if match_status else ""

                all_cb_ovr_flo = card.find_all("div", class_="cb-ovr-flo")

                team1 = all_cb_ovr_flo[1].text.strip() if len(all_cb_ovr_flo) > 1 else ""
                team2 = all_cb_ovr_flo[3].text.strip() if len(all_cb_ovr_flo) > 3 else ""
                score1 = all_cb_ovr_flo[2].text.strip() if len(all_cb_ovr_flo) > 2 else ""
                score2 = all_cb_ovr_flo[4].text.strip() if len(all_cb_ovr_flo) > 4 else ""

                team = {
                    "team1": team1,
                    "team2": team2,
                    "score1": score1,
                    "score2": score2,
                    "match_status": match_status
                }
                teams.append(team)
                
            except Exception as e:
                print(f"Error extracting team info: {e}")
                teams.append({
                    "team1": "",
                    "team2": "",
                    "score1": "",
                    "score2": "",
                    "match_status": ""
                })

        # Combine all data
        result = []
        max_length = max(len(match), len(match_no), len(date_stadium), len(live), len(scorecard), len(FullCommentary), len(teams))
        
        for i in range(max_length):
            result.append({
                "match": match[i] if i < len(match) else "",
                "status": match_no[i] if i < len(match_no) else "",
                "date_stadium": date_stadium[i] if i < len(date_stadium) else "",
                "live_score": live[i]['url'] if i < len(live) else "",
                "scorecard_links": scorecard[i]['url'] if i < len(scorecard) else "",
                "commentary": FullCommentary[i]['url'] if i < len(FullCommentary) else "",
                "teams": teams[i] if i < len(teams) else {
                    "team1": "",
                    "team2": "",
                    "score1": "",
                    "score2": "",
                    "match_status": ""
                }
            })

        return result
        
    except Exception as e:
        print(f"Error in scrape_matches: {e}")
        return []

def scrape_scorecard(matches_data):
    """Scrape scorecard data for all matches"""
    scorecard = []
    
    for match in matches_data:
        if not match.get("scorecard_links"):
            print(f"No scorecard link for match: {match.get('match', 'Unknown')}")
            continue
            
        try:
            scorecard_link = "https://www.cricbuzz.com" + match.get("scorecard_links")
            print(f"Processing scorecard for: {scorecard_link}")
            
            source = requests.get(scorecard_link, timeout=10).text
            page = BeautifulSoup(source, "lxml")

            # Create a new match object for each match
            match_data = {
                "match": "",
                "innings": []
            }

            # Get match name from page title or header
            match_title = page.select_one('.cb-nav-hdr.cb-font-18.line-ht24')
            if match_title:
                match_data["match"] = match_title.text.strip().split('-')[0]
                print(f"Processing match: {match_data['match']}")
            else:
                match_data["match"] = match.get("match", "Unknown Match")
       
            # Get all innings divs
            innings_divs = page.select('[id^="innings_"]')

            for innings_div in innings_divs:
                try:
                    # Get team header
                    team_header = innings_div.select_one('.cb-scrd-hdr-rw span')
                    innings_name = team_header.text.strip() if team_header else "Unknown Team"

                    innings_data = {
                        "innings_name": innings_name,
                        "batters": [],
                        "extras": "",
                        "total": "",
                        "yet_to_bat": [],
                        "fall_of_wickets": [],
                        "bowlers": []
                    }
                    
                    # Get all items in this innings
                    all_items = innings_div.select('.cb-scrd-itms')
                    
                    # Process batters data
                    for item in all_items:
                        try:
                            name_div = item.select_one('.cb-col-25')
                            if name_div and name_div.a:
                                batter_name = name_div.a.text.strip()
                                
                                # Skip if it's an extras or total row
                                if batter_name in ["Extras", "Total"]:
                                    continue
                                    
                                status_div = item.select_one('.cb-col-33')
                                runs_div = item.select_one('.cb-col-8.text-right.text-bold')
                                
                                # Get all text-right columns for balls, 4s, 6s, SR
                                text_right_cols = item.select('.cb-col-8.text-right')
                                balls_div = text_right_cols[1] if len(text_right_cols) > 1 else None
                                fours_div = text_right_cols[2] if len(text_right_cols) > 2 else None
                                sixes_div = text_right_cols[3] if len(text_right_cols) > 3 else None
                                strike_rate_div = text_right_cols[4] if len(text_right_cols) > 4 else None
                                
                                # Clean batter name (remove parentheses content)
                                clean_name = re.sub(r'\s*\([^)]*\)', '', batter_name).strip()

                                batter_data = {
                                    "name": clean_name,
                                    "status": status_div.text.strip() if status_div else "",
                                    "runs": runs_div.text.strip() if runs_div else "",
                                    "balls": balls_div.text.strip() if balls_div else "",
                                    "4s": fours_div.text.strip() if fours_div else "",
                                    "6s": sixes_div.text.strip() if sixes_div else "",
                                    "strike_rate": strike_rate_div.text.strip() if strike_rate_div else ""
                                }
                                innings_data["batters"].append(batter_data)
                        except Exception as e:
                            print(f"Error processing batter: {e}")
                            continue
                    
                    # Process extras
                    for item in all_items:
                        try:
                            if item.select_one('.cb-col.cb-col-8.text-bold.cb-text-black.text-right'):
                                extra_runs = item.select_one('.cb-col.cb-col-8.text-bold.cb-text-black.text-right').text.strip()
                                extras_division = item.select_one('.cb-col-32.cb-col')
                                extras_division_text = extras_division.text.strip() if extras_division else ""
                                innings_data["extras"] = extra_runs + extras_division_text
                                break
                        except Exception as e:
                            print(f"Error processing extras: {e}")
                            continue
                    
                    # Process total
                    for item in all_items:
                        try:
                            if item.select_one('.cb-col.cb-col-8.text-bold.text-black.text-right'):
                                total_runs = item.select_one('.cb-col.cb-col-8.text-bold.text-black.text-right').text.strip()
                                total_division = item.select_one('.cb-col-32.cb-col')
                                total_division_text = total_division.text.strip() if total_division else ""
                                innings_data["total"] = total_runs + total_division_text
                                break
                        except Exception as e:
                            print(f"Error processing total: {e}")
                            continue
                    
                    # Process yet to bat players
                    for item in all_items:
                        try:
                            yet_to_bat_section = item.select('.cb-col-73.cb-col')
                            for player in yet_to_bat_section:
                                player_text = player.text.strip()
                                if player_text and player_text != "Yet to Bat":
                                    innings_data["yet_to_bat"].append(player_text)
                        except Exception as e:
                            print(f"Error processing yet to bat: {e}")
                            continue
                    
                    # Process fall of wickets
                    try:
                        fall_of_wickets = innings_div.select(".cb-col.cb-col-100.cb-col-rt.cb-font-13")
                        for wicket in fall_of_wickets:
                            wicket_text = wicket.text.strip()
                            if wicket_text:
                                innings_data["fall_of_wickets"].append(wicket_text)
                    except Exception as e:
                        print(f"Error processing fall of wickets: {e}")
                    
                    # Process bowlers data
                    for item in all_items:
                        try:
                            bowler_div = item.select_one('.cb-col-38')
                            if bowler_div and bowler_div.a:
                                bowler_name = bowler_div.a.text.strip()
                                
                                # Skip if it's an extras or total row
                                if bowler_name in ["Extras", "Total"]:
                                    continue
                                
                                # Get bowler statistics with more specific selectors
                                text_right_cols = item.select('.cb-col-8.text-right')
                                text_right_10_cols = item.select('.cb-col-10.text-right')
                                
                                bowler_data = {
                                    "bowler_name": bowler_name,
                                    "overs": text_right_cols[0].text.strip() if len(text_right_cols) > 0 else "",
                                    "maiden": text_right_cols[1].text.strip() if len(text_right_cols) > 1 else "",
                                    "runs": text_right_10_cols[0].text.strip() if len(text_right_10_cols) > 0 else "",
                                    "wickets": text_right_cols[2].text.strip() if len(text_right_cols) > 2 else "",
                                    "no_balls": text_right_cols[3].text.strip() if len(text_right_cols) > 3 else "",
                                    "wide_balls": text_right_cols[4].text.strip() if len(text_right_cols) > 4 else "",
                                    "economy": text_right_10_cols[1].text.strip() if len(text_right_10_cols) > 1 else ""
                                }
                                innings_data["bowlers"].append(bowler_data)
                        except Exception as e:
                            print(f"Error processing bowler: {e}")
                            continue

                    # Add this innings to the current match
                    match_data["innings"].append(innings_data)
                    
                except Exception as e:
                    print(f"Error processing innings: {e}")
                    continue

            # Add the completed match to the scorecard list
            scorecard.append(match_data)
            
            # Add small delay between requests
            time.sleep(1)
            
        except Exception as e:
            print(f"Error processing scorecard for match {match.get('match', 'Unknown')}: {e}")
            # Add empty match data to maintain consistency
            scorecard.append({
                "match": match.get("match", "Unknown Match"),
                "innings": []
            })
            continue

    return scorecard

def main():
    """Main function to scrape matches and scorecard data"""
    print("Starting cricket data scraping...")
    
    # Scrape matches data
    print("Scraping matches data...")
    matches_data = scrape_matches()
    
    if not matches_data:
        print("No matches data found")
        return
    
    # Save matches data
    try:
        with open("matches.json", "w", encoding='utf-8') as f:
            json.dump(matches_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(matches_data)} matches to matches.json")
    except Exception as e:
        print(f"Error saving matches data: {e}")
        return
    
    # Scrape scorecard data
    print("Scraping scorecard data...")
    scorecard_data = scrape_scorecard(matches_data)
    
    # Save scorecard data
    try:
        with open("scorecard.json", "w", encoding='utf-8') as f:
            json.dump(scorecard_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(scorecard_data)} scorecards to scorecard.json")
    except Exception as e:
        print(f"Error saving scorecard data: {e}")
    
    print("Cricket data scraping completed!")

if __name__ == "__main__":
    main()