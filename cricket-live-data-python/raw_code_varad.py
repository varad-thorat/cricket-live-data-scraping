
# import re
# import requests
# from bs4 import BeautifulSoup
# import re
# import json
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.webdriver.support.ui import WebDriverWait
# from selenium.webdriver.support import expected_conditions as EC


# link = "https://www.cricbuzz.com/cricket-match/live-scores"
# source = requests.get(link).text
# page = BeautifulSoup(source, "lxml")

# container = page.find("div", class_="cb-col cb-col-100 cb-bg-white")
# matches = container.find_all("div", class_="cb-mtch-lst cb-col cb-col-100 cb-tms-itm")
# # Match = match_details.find_all("a", class_="text-hvr-underline text-bold")
# match = []

# for card in matches:
#     title = card.find("a",class_="text-hvr-underline text-bold")
#     # print(title)
#     if title:
#         match.append(title.text.strip())
#     else:
#         match.append("")

# match_no = []
# for card in matches:
#     title = card.find("span",class_="text-gray")
#     # print(title)
#     if title:
#         match_no.append(re.sub(r'\&nbsp;\S*', '', title.text.strip()))
#     else:
#         match_no.append("")

# date_stadium = []
# for card in matches:
#     title = card.find("div",class_="text-gray")
#     # clean_title = re.sub()
#     if title:
#         date_stadium.append(re.sub(r'\xa0\S*', '', title.text.strip()))
#     else:
#         date_stadium.append("")

# live = []
# for card in matches:
#     title = card.find("a", attrs={"title": "Live Score"})
#     if title:
#         text = title.text.strip()
#         href = title["href"]
#         live.append({"text": text, "url":href})
#     else:
#         live.append({"text": "Live Score", "url":""})
# # print(live)

# scorecard=[]
# for card in matches:
#     title = card.find("a", attrs={"title": "Scorecard"})
#     if title:
#         text = title.text.strip()
#         href = title["href"]
#         scorecard.append({"text": text, "url":href})
#     else:
#         scorecard.append({"text": "Scorecard", "url":""})
# # print(scorecard)

# FullCommentary=[]
# for card in matches:
#     title = card.find("a", attrs={"title": "Full Commentary"})
#     if title:
#         text = title.text.strip()
#         href = title["href"]
#         FullCommentary.append({"text": text, "url":href})
#     else:
#         FullCommentary.append({"text": "Full Commentary", "url":""})
    
# # print(FullCommentary)
# # # print(match)
# # # print(match_no)
# # # print(date_stadium)


# teams = []

# for card in matches:
#     #match_status logic
#     match_status = card.find("div", class_="cb-text-live") or card.find("div", class_="cb-text-complete") or card.find("span",class_="cb-text-preview")
#     match_status = match_status.text.strip() if match_status else ""
#     # print(match_status)

#     all_cb_ovr_flo = card.find_all("div",class_="cb-ovr-flo")
#     # print(len(all_cb_ovr_flo))

#     try:
#         team1 = all_cb_ovr_flo[1].text.strip() 
#     except IndexError:
#         team1 = ""

#     try:
#         team2 = all_cb_ovr_flo[3].text.strip() 
#     except IndexError:
#         team2 = ""
    
#     try:
#         score1 = all_cb_ovr_flo[2].text.strip() 
#     except IndexError:
#         score1 = ""
    
#     try:
#         score2 = all_cb_ovr_flo[4].text.strip() 
#     except IndexError:
#         score2 = ""

#     team = {
#         "team1": team1,
#         "team2": team2,
#         "score1": score1,
#         "score2": score2,
#         "match_status": match_status
#     }

#     teams.append(team)

# # print(teams)

# result = []

# for i in range(len(match)):
#     result.append({
#         "match": match[i] if i < len(match) else "",
#         "status": match_no[i] if i < len(match_no) else "",
#         "date_stadium": date_stadium[i] if i < len(date_stadium) else "",
#         "live_score": live[i]['url'] if i < len(live) else "",
#         "scorecard_links": scorecard[i]['url'] if i < len(scorecard) else "",
#         "commentary": FullCommentary[i]['url'] if i < len(FullCommentary) else "",
#         "teams": teams[i]
#     })

# with open("matches.json", "w") as f:
#     json.dump(result, f, indent=2)

# # print(result)

# scorecard = []  # This will be a list of match objects

# for match in result:
#     scorecard_link = "https://www.cricbuzz.com" + match.get("scorecard_links")
    
    

#     link = scorecard_link
#     source = requests.get(link).text
#     page = BeautifulSoup(source, "lxml")

#     # Create a new match object for each match
#     match_data = {
#         "match": "",
#         "innings": []
#     }

#     # Get match name from page title or header
#     match_title = page.select_one('.cb-nav-hdr.cb-font-18.line-ht24')
#     if match_title:
#         match_data["match"] = match_title.text.strip().split('-')[0]
#         print(f"Processing match: {match_data['match']}")
   
#     # Get all innings divs
#     innings_divs = page.select('[id^="innings_"]')

#     for innings_div in innings_divs:
#         print("=" * 50)
        
#         # Get team header
#         team_header = innings_div.select_one('.cb-scrd-hdr-rw span')
#         if team_header:
#             print(f"TEAM: {team_header.text.strip()}")

#         innings_name = team_header.text.strip() if team_header else "Unknown Team"

#         innings_data = {
#             "innings_name": innings_name,
#             "batters": [],
#             "extras": "",
#             "total": "",
#             "yet_to_bat": [],
#             "fall_of_wickets": [],
#             "bowlers": []
#         }

#         print("=" * 50)
        
#         # Get all items in this innings
#         all_items = innings_div.select('.cb-scrd-itms')
        
#         print("\n--- BATTERS DATA ---")
#         # Process batters data
#         for item in all_items:
#             name_div = item.select_one('.cb-col-25')
#             if name_div and name_div.a:
#                 batter_name = name_div.a.text.strip()
                
#                 # Skip if it's an extras or total row
#                 if batter_name in ["Extras", "Total"]:
#                     continue
                    
#                 status_div = item.select_one('.cb-col-33')
#                 runs_div = item.select_one('.cb-col-8.text-right.text-bold')
                
#                 # Get all text-right columns for balls, 4s, 6s, SR
#                 text_right_cols = item.select('.cb-col-8.text-right')
#                 balls_div = text_right_cols[1] if len(text_right_cols) > 1 else None
#                 fours_div = text_right_cols[2] if len(text_right_cols) > 2 else None
#                 sixes_div = text_right_cols[3] if len(text_right_cols) > 3 else None
#                 strike_rate_div = text_right_cols[4] if len(text_right_cols) > 4 else None
                
#                 # Clean batter name (remove parentheses content)
#                 clean_name = re.sub(r'\s*\([^)]*\)', '', batter_name).strip()

#                 batter_data = {
#                     "name": clean_name,
#                     "status": status_div.text.strip() if status_div else "",
#                     "runs": runs_div.text.strip() if runs_div else "",
#                     "balls": balls_div.text.strip() if balls_div else "",
#                     "4s": fours_div.text.strip() if fours_div else "",
#                     "6s": sixes_div.text.strip() if sixes_div else "",
#                     "strike_rate": strike_rate_div.text.strip() if strike_rate_div else ""
#                 }
#                 innings_data["batters"].append(batter_data)
#                 print(batter_data)
        
#         print("\n--- EXTRAS ---")
#         # Process extras
#         for item in all_items:
#             if item.select_one('.cb-col.cb-col-8.text-bold.cb-text-black.text-right'):
#                 extra_runs = item.select_one('.cb-col.cb-col-8.text-bold.cb-text-black.text-right').text.strip()
#                 extras_division = item.select_one('.cb-col-32.cb-col').text.strip()
#                 extras = extra_runs + extras_division
#                 innings_data["extras"] = extras
#                 print(extras)
        
#         print("\n--- TOTAL ---")
#         # Process total
#         for item in all_items:
#             if item.select_one('.cb-col.cb-col-8.text-bold.text-black.text-right'):
#                 total_runs = item.select_one('.cb-col.cb-col-8.text-bold.text-black.text-right').text.strip()
#                 total_division = item.select_one('.cb-col-32.cb-col').text.strip()
#                 total = total_runs + total_division
#                 innings_data["total"] = total
#                 print(total)
        
#         print("\n--- YET TO BAT ---")
#         # Process yet to bat players
#         for item in all_items:
#             yet_to_bat_section = item.select('.cb-col-73.cb-col')
#             if yet_to_bat_section:
#                 print("Yet to bat players:")
#                 for player in yet_to_bat_section:
#                     player_text = player.text.strip()
#                     if player_text:
#                         innings_data["yet_to_bat"].append(player_text)
#                     else:
#                         innings_data["yet_to_bat"].append("")
#                     if player_text and player_text != "Yet to Bat":
#                         print(f"  - {player_text}")
        
#         print("\n--- FALL OF WICKETS ---")
#         # Process fall of wickets
#         fall_of_wickets = innings_div.select(".cb-col.cb-col-100.cb-col-rt.cb-font-13")
#         for wicket in fall_of_wickets:
#             wicket_text = wicket.text.strip()
#             innings_data["fall_of_wickets"].append(wicket_text)
#             if wicket_text:
#                 print(f"Fall of wicket: {wicket_text}")
        
#         print("\n--- BOWLERS DATA ---")
#         # Process bowlers data
#         for item in all_items:
#             bowler_div = item.select_one('.cb-col-38')
#             if bowler_div and bowler_div.a:
#                 bowler_name = bowler_div.a.text.strip()
                
#                 # Skip if it's an extras or total row
#                 if bowler_name in ["Extras", "Total"]:
#                     continue
                
#                 # Get bowler statistics with more specific selectors
#                 text_right_cols = item.select('.cb-col-8.text-right')
#                 text_right_10_cols = item.select('.cb-col-10.text-right')
                
#                 bowler_data = {
#                     "bowler_name": bowler_name,
#                     "overs": text_right_cols[0].text.strip() if len(text_right_cols) > 0 else "",
#                     "maiden": text_right_cols[1].text.strip() if len(text_right_cols) > 1 else "",
#                     "runs": text_right_10_cols[0].text.strip() if len(text_right_10_cols) > 0 else "",
#                     "wickets": text_right_cols[2].text.strip() if len(text_right_cols) > 2 else "",
#                     "no_balls": text_right_cols[3].text.strip() if len(text_right_cols) > 3 else "",
#                     "wide_balls": text_right_cols[4].text.strip() if len(text_right_cols) > 4 else "",
#                     "economy": text_right_10_cols[1].text.strip() if len(text_right_10_cols) > 1 else ""
#                 }
#                 innings_data["bowlers"].append(bowler_data)
#                 print(bowler_data)

#         # Add this innings to the current match
#         match_data["innings"].append(innings_data)
#         # print("\n" + "=" * 50)

        

#     # Add the completed match to the scorecard list
#     scorecard.append(match_data)

# print(scorecard)

# with open("scorecard.json", "w") as f:
#     json.dump(scorecard, f, indent=2)


# #fullcommentary - https://m.cricbuzz.com/api/mcenter/80166/full-commentary/1
# #just change the number [80166] with the one in scorecard and you get the result

# full_commentary = []

# for match in result:
#     full_commentary_link_temp = "https://m.cricbuzz.com" + match.get("scorecard_links")
#     full_commentary_link = full_commentary_link_temp.replace("scorecard", "full-commentary")
#     match_id = match.get("scorecard_links").split("/")[2]  # or url.split("/")[3] depending on base
#     # print(full_commentary_link)
#     # print(match_id)
#     driver = webdriver.Chrome()
#     driver.get(full_commentary_link)

#     innings_id = ""
#     # Wait until the div with all the class names is present
#     try:
#         WebDriverWait(driver, 5).until(
#             EC.presence_of_element_located((By.CSS_SELECTOR, "div.flex.bg-white.justify-between.p-4"))
#         )

#         soup = BeautifulSoup(driver.page_source, "lxml")

#         # Use CSS selector to get the exact container
#         container = soup.select_one("div.flex.bg-white.justify-between.p-4")

#         if container:
#             divs = container.find_all("div", recursive=False)
#             # print(len(divs)-1)
#             innings_id = str(len(divs)-1)
#         else:
#             print("Container not found.")
#     finally:
#         driver.quit()

#     match_id = "80166"

#     url = f"https://m.cricbuzz.com/api/mcenter/{match_id}/full-commentary/{innings_id}"

#     data = ""
#     response = requests.get(url)
#     if response.status_code == 200: 
#         data = response.json() 
#         # print(data)
#     else:
#         print(f"Failed to fetch data. Status code: {response.status_code}")
    
#     try:
#         commentary_list = data['commentary'][0]['commentaryList']
#     except IndexError:
#         print("commentary not found")

#     # Reverse sort by ballNbr to get latest deliveries first
#     balls = sorted(
#         [ball for ball in commentary_list if ball.get('ballNbr', 0) > 0],
#         key=lambda x: x['ballNbr'],
#         reverse=True
#     )

#     events = []
#     latest_over = None

#     for ball in balls:
#         # Capture the latest overNumber
#         if latest_over is None and 'overNumber' in ball:
#             latest_over = ball['overNumber']

#         event = ball.get("event", "")
#         if event == "WICKET":
#             events.append("W")
#         elif event == "SIX":
#             events.append("6")
#         elif event == "FOUR":
#             events.append("4")
#         else:
#             events.append(str(ball.get("legalRuns", 0)))

#         if len(events) == 12:
#             break

#     # Reverse to chronological order
#     events.reverse()

#     # Final Output
#     # print(f"Latest Over: {latest_over}")
#     # print("Events:", " ".join(events))
#     # print(events)
#     match = {"match": match.get("match"),
#              "latest_over": latest_over,
#              "events": events}
#     full_commentary.append(match)

# print(full_commentary)

# with open("full_commentary.json", "w") as f:
#     json.dump(full_commentary, f, indent=2)
