const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

// Add delay function to avoid overwhelming the server
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeMatches() {
    console.log("Scraping matches data...");
    
    try {
        const link = "https://www.cricbuzz.com/cricket-match/live-scores";
        const response = await axios.get(link, { timeout: 10000 });
        const $ = cheerio.load(response.data);

        const container = $(".cb-col.cb-col-100.cb-bg-white");
        if (container.length === 0) {
            console.log("No container found for matches");
            return [];
        }
            
        const matches = container.find(".cb-mtch-lst.cb-col.cb-col-100.cb-tms-itm");
        
        // Initialize arrays
        const match = [];
        const matchNo = [];
        const dateStadium = [];
        const live = [];
        const scorecard = [];
        const fullCommentary = [];
        const teams = [];

        // Extract match titles
        matches.each((index, card) => {
            try {
                const title = $(card).find("a.text-hvr-underline.text-bold");
                match.push(title.length ? title.text().trim() : "");
            } catch (e) {
                console.log(`Error extracting match title: ${e.message}`);
                match.push("");
            }
        });

        // Extract match numbers
        matches.each((index, card) => {
            try {
                const title = $(card).find("span.text-gray");
                if (title.length) {
                    const text = title.text().trim().replace(/&nbsp;\S*/g, '');
                    matchNo.push(text);
                } else {
                    matchNo.push("");
                }
            } catch (e) {
                console.log(`Error extracting match number: ${e.message}`);
                matchNo.push("");
            }
        });

        // Extract date and stadium
        matches.each((index, card) => {
            try {
                const title = $(card).find("div.text-gray");
                if (title.length) {
                    const text = title.text().trim().replace(/\xa0\S*/g, '');
                    dateStadium.push(text);
                } else {
                    dateStadium.push("");
                }
            } catch (e) {
                console.log(`Error extracting date/stadium: ${e.message}`);
                dateStadium.push("");
            }
        });

        // Extract live score links
        matches.each((index, card) => {
            try {
                const title = $(card).find('a[title="Live Score"]');
                if (title.length) {
                    const text = title.text().trim();
                    const href = title.attr("href") || "";
                    live.push({ text: text, url: href });
                } else {
                    live.push({ text: "Live Score", url: "" });
                }
            } catch (e) {
                console.log(`Error extracting live score link: ${e.message}`);
                live.push({ text: "Live Score", url: "" });
            }
        });

        // Extract scorecard links
        matches.each((index, card) => {
            try {
                const title = $(card).find('a[title="Scorecard"]');
                if (title.length) {
                    const text = title.text().trim();
                    const href = title.attr("href") || "";
                    scorecard.push({ text: text, url: href });
                } else {
                    scorecard.push({ text: "Scorecard", url: "" });
                }
            } catch (e) {
                console.log(`Error extracting scorecard link: ${e.message}`);
                scorecard.push({ text: "Scorecard", url: "" });
            }
        });

        // Extract full commentary links
        matches.each((index, card) => {
            try {
                const title = $(card).find('a[title="Full Commentary"]');
                if (title.length) {
                    const text = title.text().trim();
                    const href = title.attr("href") || "";
                    fullCommentary.push({ text: text, url: href });
                } else {
                    fullCommentary.push({ text: "Full Commentary", url: "" });
                }
            } catch (e) {
                console.log(`Error extracting commentary link: ${e.message}`);
                fullCommentary.push({ text: "Full Commentary", url: "" });
            }
        });

        // Extract team information
        matches.each((index, card) => {
            try {
                // Match status logic
                const liveStatus = $(card).find(".cb-text-live");
                const completeStatus = $(card).find(".cb-text-complete");
                const previewStatus = $(card).find("span.cb-text-preview");
                
                let matchStatus = "";
                if (liveStatus.length) {
                    matchStatus = liveStatus.text().trim();
                } else if (completeStatus.length) {
                    matchStatus = completeStatus.text().trim();
                } else if (previewStatus.length) {
                    matchStatus = previewStatus.text().trim();
                }

                const allCbOvrFlo = $(card).find(".cb-ovr-flo");

                const team1 = allCbOvrFlo.length > 1 ? $(allCbOvrFlo[1]).text().trim() : "";
                const team2 = allCbOvrFlo.length > 3 ? $(allCbOvrFlo[3]).text().trim() : "";
                const score1 = allCbOvrFlo.length > 2 ? $(allCbOvrFlo[2]).text().trim() : "";
                const score2 = allCbOvrFlo.length > 4 ? $(allCbOvrFlo[4]).text().trim() : "";

                const team = {
                    team1: team1,
                    team2: team2,
                    score1: score1,
                    score2: score2,
                    match_status: matchStatus
                };
                teams.push(team);
                
            } catch (e) {
                console.log(`Error extracting team info: ${e.message}`);
                teams.push({
                    team1: "",
                    team2: "",
                    score1: "",
                    score2: "",
                    match_status: ""
                });
            }
        });

        // Combine all data
        const result = [];
        const maxLength = Math.max(match.length, matchNo.length, dateStadium.length, live.length, scorecard.length, fullCommentary.length, teams.length);
        
        for (let i = 0; i < maxLength; i++) {
            result.push({
                match: i < match.length ? match[i] : "",
                status: i < matchNo.length ? matchNo[i] : "",
                date_stadium: i < dateStadium.length ? dateStadium[i] : "",
                live_score: i < live.length ? live[i].url : "",
                scorecard_links: i < scorecard.length ? scorecard[i].url : "",
                commentary: i < fullCommentary.length ? fullCommentary[i].url : "",
                teams: i < teams.length ? teams[i] : {
                    team1: "",
                    team2: "",
                    score1: "",
                    score2: "",
                    match_status: ""
                }
            });
        }

        return result;
        
    } catch (error) {
        console.log(`Error in scrapeMatches: ${error.message}`);
        return [];
    }
}

async function scrapeScorecard(matchesData) {
    console.log("Scraping scorecard data...");
    const scorecard = [];
    
    for (const match of matchesData) {
        if (!match.scorecard_links) {
            console.log(`No scorecard link for match: ${match.match || 'Unknown'}`);
            continue;
        }
            
        try {
            const scorecardLink = "https://www.cricbuzz.com" + match.scorecard_links;
            console.log(`Processing scorecard for: ${scorecardLink}`);
            
            const response = await axios.get(scorecardLink, { timeout: 10000 });
            const $ = cheerio.load(response.data);

            // Create a new match object for each match
            const matchData = {
                match: "",
                innings: []
            };

            // Get match name from page title or header
            const matchTitle = $(".cb-nav-hdr.cb-font-18.line-ht24");
            if (matchTitle.length) {
                matchData.match = matchTitle.text().trim().split('-')[0];
                console.log(`Processing match: ${matchData.match}`);
            } else {
                matchData.match = match.match || "Unknown Match";
            }
       
            // Get all innings divs
            const inningseDivs = $('[id^="innings_"]');

            inningseDivs.each((index, inningsDiv) => {
                try {
                    const $inningsDiv = $(inningsDiv);
                    
                    // Get team header
                    const teamHeader = $inningsDiv.find('.cb-scrd-hdr-rw span');
                    const inningsName = teamHeader.length ? teamHeader.text().trim() : "Unknown Team";

                    const inningsData = {
                        innings_name: inningsName,
                        batters: [],
                        extras: "",
                        total: "",
                        yet_to_bat: [],
                        fall_of_wickets: [],
                        bowlers: []
                    };
                    
                    // Get all items in this innings
                    const allItems = $inningsDiv.find('.cb-scrd-itms');
                    
                    // Process batters data
                    allItems.each((itemIndex, item) => {
                        try {
                            const $item = $(item);
                            const nameDiv = $item.find('.cb-col-25');
                            const nameLink = nameDiv.find('a');
                            
                            if (nameLink.length) {
                                const batterName = nameLink.text().trim();
                                
                                // Skip if it's an extras or total row
                                if (batterName === "Extras" || batterName === "Total") {
                                    return;
                                }
                                    
                                const statusDiv = $item.find('.cb-col-33');
                                const runsDiv = $item.find('.cb-col-8.text-right.text-bold');
                                
                                // Get all text-right columns for balls, 4s, 6s, SR
                                const textRightCols = $item.find('.cb-col-8.text-right');
                                const ballsDiv = textRightCols.length > 1 ? $(textRightCols[1]) : null;
                                const foursDiv = textRightCols.length > 2 ? $(textRightCols[2]) : null;
                                const sixesDiv = textRightCols.length > 3 ? $(textRightCols[3]) : null;
                                const strikeRateDiv = textRightCols.length > 4 ? $(textRightCols[4]) : null;
                                
                                // Clean batter name (remove parentheses content)
                                const cleanName = batterName.replace(/\s*\([^)]*\)/g, '').trim();

                                const batterData = {
                                    name: cleanName,
                                    status: statusDiv.length ? statusDiv.text().trim() : "",
                                    runs: runsDiv.length ? runsDiv.text().trim() : "",
                                    balls: ballsDiv ? ballsDiv.text().trim() : "",
                                    "4s": foursDiv ? foursDiv.text().trim() : "",
                                    "6s": sixesDiv ? sixesDiv.text().trim() : "",
                                    strike_rate: strikeRateDiv ? strikeRateDiv.text().trim() : ""
                                };
                                inningsData.batters.push(batterData);
                            }
                        } catch (e) {
                            console.log(`Error processing batter: ${e.message}`);
                        }
                    });
                    
                    // Process extras
                    allItems.each((itemIndex, item) => {
                        try {
                            const $item = $(item);
                            const extraRunsDiv = $item.find('.cb-col.cb-col-8.text-bold.cb-text-black.text-right');
                            if (extraRunsDiv.length) {
                                const extraRuns = extraRunsDiv.text().trim();
                                const extrasDivision = $item.find('.cb-col-32.cb-col');
                                const extrasDivisionText = extrasDivision.length ? extrasDivision.text().trim() : "";
                                inningsData.extras = extraRuns + extrasDivisionText;
                                return false; // Break out of loop
                            }
                        } catch (e) {
                            console.log(`Error processing extras: ${e.message}`);
                        }
                    });
                    
                    // Process total
                    allItems.each((itemIndex, item) => {
                        try {
                            const $item = $(item);
                            const totalRunsDiv = $item.find('.cb-col.cb-col-8.text-bold.text-black.text-right');
                            if (totalRunsDiv.length) {
                                const totalRuns = totalRunsDiv.text().trim();
                                const totalDivision = $item.find('.cb-col-32.cb-col');
                                const totalDivisionText = totalDivision.length ? totalDivision.text().trim() : "";
                                inningsData.total = totalRuns + totalDivisionText;
                                return false; // Break out of loop
                            }
                        } catch (e) {
                            console.log(`Error processing total: ${e.message}`);
                        }
                    });
                    
                    // Process yet to bat players
                    allItems.each((itemIndex, item) => {
                        try {
                            const $item = $(item);
                            const yetToBatSection = $item.find('.cb-col-73.cb-col');
                            yetToBatSection.each((playerIndex, player) => {
                                const playerText = $(player).text().trim();
                                if (playerText && playerText !== "Yet to Bat") {
                                    inningsData.yet_to_bat.push(playerText);
                                }
                            });
                        } catch (e) {
                            console.log(`Error processing yet to bat: ${e.message}`);
                        }
                    });
                    
                    // Process fall of wickets
                    try {
                        const fallOfWickets = $inningsDiv.find(".cb-col.cb-col-100.cb-col-rt.cb-font-13");
                        fallOfWickets.each((wicketIndex, wicket) => {
                            const wicketText = $(wicket).text().trim();
                            if (wicketText) {
                                inningsData.fall_of_wickets.push(wicketText);
                            }
                        });
                    } catch (e) {
                        console.log(`Error processing fall of wickets: ${e.message}`);
                    }
                    
                    // Process bowlers data
                    allItems.each((itemIndex, item) => {
                        try {
                            const $item = $(item);
                            const bowlerDiv = $item.find('.cb-col-38');
                            const bowlerLink = bowlerDiv.find('a');
                            
                            if (bowlerLink.length) {
                                const bowlerName = bowlerLink.text().trim();
                                
                                // Skip if it's an extras or total row
                                if (bowlerName === "Extras" || bowlerName === "Total") {
                                    return;
                                }
                                
                                // Get bowler statistics with more specific selectors
                                const textRightCols = $item.find('.cb-col-8.text-right');
                                const textRight10Cols = $item.find('.cb-col-10.text-right');
                                
                                const bowlerData = {
                                    bowler_name: bowlerName,
                                    overs: textRightCols.length > 0 ? $(textRightCols[0]).text().trim() : "",
                                    maiden: textRightCols.length > 1 ? $(textRightCols[1]).text().trim() : "",
                                    runs: textRight10Cols.length > 0 ? $(textRight10Cols[0]).text().trim() : "",
                                    wickets: textRightCols.length > 2 ? $(textRightCols[2]).text().trim() : "",
                                    no_balls: textRightCols.length > 3 ? $(textRightCols[3]).text().trim() : "",
                                    wide_balls: textRightCols.length > 4 ? $(textRightCols[4]).text().trim() : "",
                                    economy: textRight10Cols.length > 1 ? $(textRight10Cols[1]).text().trim() : ""
                                };
                                inningsData.bowlers.push(bowlerData);
                            }
                        } catch (e) {
                            console.log(`Error processing bowler: ${e.message}`);
                        }
                    });

                    // Add this innings to the current match
                    matchData.innings.push(inningsData);
                    
                } catch (e) {
                    console.log(`Error processing innings: ${e.message}`);
                }
            });

            // Add the completed match to the scorecard list
            scorecard.push(matchData);
            
            // Add small delay between requests
            await delay(1000);
            
        } catch (error) {
            console.log(`Error processing scorecard for match ${match.match || 'Unknown'}: ${error.message}`);
            // Add empty match data to maintain consistency
            scorecard.push({
                match: match.match || "Unknown Match",
                innings: []
            });
        }
    }

    return scorecard;
}

async function main() {
    console.log("Starting cricket data scraping...");
    
    try {
        // Scrape matches data
        console.log("Scraping matches data...");
        const matchesData = await scrapeMatches();
        
        if (!matchesData || matchesData.length === 0) {
            console.log("No matches data found");
            return;
        }
        
        // Save matches data
        try {
            await fs.writeFile("data/matches.json", JSON.stringify(matchesData, null, 2), 'utf8');
            console.log(`Saved ${matchesData.length} matches to matches.json`);
        } catch (e) {
            console.log(`Error saving matches data: ${e.message}`);
            return;
        }
        
        // Scrape scorecard data
        console.log("Scraping scorecard data...");
        const scorecardData = await scrapeScorecard(matchesData);
        
        // Save scorecard data
        try {
            await fs.writeFile("data/scorecard.json", JSON.stringify(scorecardData, null, 2), 'utf8');
            console.log(`Saved ${scorecardData.length} scorecards to scorecard.json`);
        } catch (e) {
            console.log(`Error saving scorecard data: ${e.message}`);
        }
        
        console.log("Cricket data scraping completed!");
        
    } catch (error) {
        console.log(`Error in main function: ${error.message}`);
    }
}

// Run the scraper
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    scrapeMatches,
    scrapeScorecard,
    main
};