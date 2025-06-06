const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

// Configure axios defaults to handle connection issues
const axiosInstance = axios.create({
    timeout: 25000,
    maxRedirects: 5,
    httpsAgent: false,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    }
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNRESET') {
            console.log('Connection was reset by server, will retry...');
        }
        return Promise.reject(error);
    }
);

/**
 * Get the correct innings ID by trying different innings numbers
 */
async function getInningsId(matchId) {
    const innings = [4, 3, 2, 1];
    let inningsId = "";
    
    for (const inning of innings) {
        const url = `https://m.cricbuzz.com/api/mcenter/${matchId}/full-commentary/${inning}`;
        console.log(`Trying innings ${inning}: ${url}`);
        
        try {
            const response = await axiosInstance.get(url, {
                headers: {
                    'Referer': 'https://m.cricbuzz.com/'
                }
            });
            
            if (response.status === 200) {
                const data = response.data;
                const commentary = data.commentary || [];
                
                if (commentary.length === 0) {
                    console.log(`No commentary found for innings ${inning}`);
                } else {
                    inningsId = commentary[0]?.inningsId;
                    if (inningsId) {
                        console.log(`Found innings_id: ${inningsId}`);
                        return String(inningsId);
                    }
                }
            } else {
                console.log(`Status code ${response.status} for innings ${inning}`);
            }
        } catch (error) {
            console.log(`Error trying innings ${inning}: ${error.message}`);
            continue;
        }
    }
    
    console.log("No valid innings found, using default '1'");
    return "1";
}

/**
 * Get commentary data from API with retries and enhanced error handling
 */
async function getCommentaryData(matchId, inningsId) {
    const maxRetries = 5; // Increased retries
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const url = `https://m.cricbuzz.com/api/mcenter/${matchId}/full-commentary/${inningsId}`;
            console.log(`Attempting API call (attempt ${attempt + 1}): ${url}`);
            
            const response = await axiosInstance.get(url, {
                headers: {
                    'Referer': 'https://m.cricbuzz.com/'
                },
                validateStatus: function (status) {
                    return status < 500; // Resolve only if status is less than 500
                }
            });
            
            if (response.status === 200) {
                console.log(`Successfully got commentary data for match ${matchId}`);
                return response.data;
            } else {
                console.log(`API request failed with status ${response.status}`);
                if (attempt < maxRetries - 1) {
                    const delay = Math.min(2000 * Math.pow(2, attempt), 10000); // Exponential backoff
                    await sleep(delay);
                    continue;
                }
            }
        } catch (error) {
            console.log(`Error on attempt ${attempt + 1}: ${error.code || error.message}`);
            
            // Handle different types of errors
            if (error.code === 'ECONNABORTED') {
                console.log(`Request timeout on attempt ${attempt + 1}`);
            } else if (error.code === 'ECONNRESET') {
                console.log(`Connection reset on attempt ${attempt + 1}`);
            } else if (error.code === 'ENOTFOUND') {
                console.log(`DNS lookup failed on attempt ${attempt + 1}`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`Connection refused on attempt ${attempt + 1}`);
            } else {
                console.log(`Network error on attempt ${attempt + 1}: ${error.message}`);
            }
            
            if (attempt < maxRetries - 1) {
                // Longer delays for connection issues
                const delay = error.code === 'ECONNRESET' 
                    ? Math.min(5000 * Math.pow(2, attempt), 30000) // Exponential backoff for ECONNRESET
                    : Math.min(3000 * Math.pow(2, attempt), 15000); // Regular exponential backoff
                
                console.log(`Waiting ${delay / 1000} seconds before retry...`);
                await sleep(delay);
                continue;
            }
        }
    }
    
    console.log(`All ${maxRetries} attempts failed for match ${matchId}`);
    return null;
}

/**
 * Process commentary data to extract events
 */
function processCommentaryEvents(data) {
    try {
        if (!data || !data.commentary) {
            console.log("No commentary data found");
            return { latestOver: null, events: [] };
        }
        
        const commentaryList = data.commentary[0].commentaryList;
        
        // Reverse sort by ballNbr to get latest deliveries first
        const balls = commentaryList
            .filter(ball => (ball.ballNbr || 0) > 0)
            .sort((a, b) => b.ballNbr - a.ballNbr);

        const events = [];
        let latestOver = null;

        for (const ball of balls) {
            // Capture the latest overNumber
            if (latestOver === null && ball.overNumber) {
                latestOver = ball.overNumber;
            }

            // Get commentary text and clean it up
            const commText = (ball.commText || "").trim();
            
            const event = ball.event || "";
            let ballInfo;
            
            if (event === "WICKET") {
                ballInfo = commText ? `W, ${commText}` : "W";
                events.push(ballInfo);
            } else if (event === "SIX") {
                ballInfo = commText ? `6, ${commText}` : "6";
                events.push(ballInfo);
            } else if (event === "FOUR") {
                ballInfo = commText ? `4, ${commText}` : "4";
                events.push(ballInfo);
            } else {
                // Use totalRuns instead of legalRuns to include extras
                const totalRuns = ball.totalRuns || 0;
                ballInfo = commText ? `${totalRuns}, ${commText}` : String(totalRuns);
                events.push(ballInfo);
            }

            if (events.length === 12) {
                break;
            }
        }

        // Reverse to chronological order
        events.reverse();
        
        return { latestOver, events };
        
    } catch (error) {
        console.log(`Error processing commentary events: ${error.message}`);
        return { latestOver: null, events: [] };
    }
}

/**
 * Sleep utility function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to scrape full commentary data
 */
async function scrapeFullCommentary() {
    let matchesData;
    
    try {
        // Load matches data
        matchesData = JSON.parse(await fs.readFile("data/matches.json", "utf8"));
        console.log(`Loaded ${matchesData.length} matches from matches.json`);
    } catch (error) {
        console.log(`Error loading matches.json: ${error.message}`);
        return [];
    }

    const fullCommentary = [];
    
    for (let i = 0; i < matchesData.length; i++) {
        const match = matchesData[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Processing match ${i + 1}/${matchesData.length}: ${match.match || 'Unknown'}`);
        console.log(`${'='.repeat(60)}`);
        
        try {
            const scorecardLink = match.scorecard_links || "";
            if (!scorecardLink) {
                console.log(`No scorecard link for match: ${match.match || 'Unknown'}`);
                fullCommentary.push({
                    match: match.match || "Unknown Match",
                    latest_over: "",
                    events: []
                });
                continue;
            }
            
            // Extract match ID from scorecard link
            const linkParts = scorecardLink.split("/");
            let matchId = null;
            
            // Try different positions where match ID might be
            for (const part of linkParts) {
                if (/^\d+$/.test(part) && part.length > 4) { // Match IDs are typically long numbers
                    matchId = part;
                    break;
                }
            }
            
            if (!matchId) {
                console.log(`Could not extract match ID from: ${scorecardLink}`);
                fullCommentary.push({
                    match: match.match || "Unknown Match",
                    latest_over: "",
                    events: []
                });
                continue;
            }
            
            console.log(`Extracted Match ID: ${matchId}`);
            
            // Get the correct innings ID using the new logic
            const inningsId = await getInningsId(matchId);
            console.log(`Using innings ID: ${inningsId}`);
            
            // Get commentary data
            const commentaryData = await getCommentaryData(matchId, inningsId);
            
            let matchCommentary;
            if (commentaryData) {
                const { latestOver, events } = processCommentaryEvents(commentaryData);
                
                matchCommentary = {
                    match: match.match || "Unknown Match",
                    latest_over: latestOver !== null ? latestOver : "",
                    events: events || []
                };
                console.log(`✅ Success: Latest over: ${latestOver}, Events: ${events.length}`);
            } else {
                console.log("❌ No commentary data retrieved");
                matchCommentary = {
                    match: match.match || "Unknown Match",
                    latest_over: "",
                    events: []
                };
            }
            
            fullCommentary.push(matchCommentary);
            
            // Add progressive delay between requests with jitter
            const baseDelay = Math.min(5000 + (i * 1000), 15000); // Increased base delay, max 15 seconds
            const jitter = Math.random() * 2000; // Add random jitter up to 2 seconds
            const delay = baseDelay + jitter;
            
            console.log(`Waiting ${(delay / 1000).toFixed(1)} seconds before next request...`);
            await sleep(delay);
            
        } catch (error) {
            console.log(`❌ Error processing match ${match.match || 'Unknown'}: ${error.message}`);
            fullCommentary.push({
                match: match.match || "Unknown Match",
                latest_over: "",
                events: []
            });
            continue;
        }
    }

    return fullCommentary;
}

/**
 * Main function to scrape and save full commentary data
 */
async function main() {
    console.log("Starting full commentary scraping...");
    
    const fullCommentaryData = await scrapeFullCommentary();
    
    if (!fullCommentaryData || fullCommentaryData.length === 0) {
        console.log("No commentary data found");
        return;
    }
    
    // Save full commentary data
    try {
        await fs.writeFile("data/full_commentary.json", JSON.stringify(fullCommentaryData, null, 2), "utf8");
        console.log(`Saved ${fullCommentaryData.length} commentary records to full_commentary.json`);
    } catch (error) {
        console.log(`Error saving commentary data: ${error.message}`);
    }
    
    console.log("Full commentary scraping completed!");
}

// Export functions for Firebase Functions or run directly
module.exports = {
    main,
    scrapeFullCommentary,
    getCommentaryData,
    processCommentaryEvents
};

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}