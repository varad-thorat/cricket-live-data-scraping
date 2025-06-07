
import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";


const stripAfterComma = (str: string): string => {
  const commaIndex = str.indexOf(',');
  return commaIndex !== -1 ? str.substring(0, commaIndex).trim() : str;
};

const firebaseConfig = {
  apiKey: process.env.PLASMO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PLASMO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PLASMO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PLASMO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PLASMO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PLASMO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Match {
  match: string;
  status: string;
  date_stadium: string;
  teams: {
    team1: string;
    team2: string;
    score1: string;
    score2: string;
    match_status: string;
  };
}

interface Scorecard {
  match: string;
  innings: {
    innings_name: string;
    batters: { name: string; status: string; runs: string; balls: string; "4s": string; "6s": string; strike_rate: string }[];
    extras: string;
    total: string;
    yet_to_bat: string[];
    fall_of_wickets: string[];
    bowlers: { bowler_name: string; overs: string; maiden: string; runs: string; wickets: string; no_balls: string; wide_balls: string; economy: string }[];
  }[];
}

interface Commentary {
  match: string;
  latest_over?: number;
  events: string[];
}

interface CommentaryEvent {
  runs: string;
  bowler: string;
  batsman: string;
  outcome: string;
}

const parseCommentaryEvent = (event: string): CommentaryEvent => {
  const parts = event.split(", ");
  if (parts.length < 3) {
    return { runs: "", bowler: "", batsman: "", outcome: event };
  }
  const [runs, bowlerToBatsman, ...outcomeParts] = parts;
  const [bowler, batsman] = bowlerToBatsman.split(" to ");
  const outcome = outcomeParts.join(", ").replace(/B[0-1]\$/, "").trim();
  return { runs, bowler, batsman, outcome };
};

const Popup: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "cricket", "matches"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log("Fetched matches document:", data);
        console.log("Last updated:", data.lastupdated);
        const matchList = data.data || [];
        console.log("Processed matches list:", matchList);
        setMatches(matchList as Match[]);
        setLastUpdated(data.lastupdated ? new Date(data.lastupdated).toLocaleString() : null);
      } else {
        console.log("Matches document does not exist in Firestore.");
        setMatches([]);
        setLastUpdated(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle navigation to scorecard page
  const handleViewScorecard = (matchName: string) => {
    console.log("Navigating to scorecard for:", matchName);
    setSelectedMatch(matchName);
  };

  // Fixed pin functionality
  const togglePin = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.windows) {
        if (!isPinned) {
          // Create a new window with the extension popup
          await chrome.windows.create({
            url: chrome.runtime.getURL("popup.html"),
            type: "popup",
            width: 450,
            height: 650,
            focused: true
          });
          setIsPinned(true);
        } else {
          // For unpinning, we'll just update the state
          // The separate window will need to be closed manually
          setIsPinned(false);
        }
      } else {
        // Fallback for non-extension environments
        setIsPinned(!isPinned);
      }
    } catch (error) {
      console.error("Pin functionality error:", error);
      // Fallback toggle
      setIsPinned(!isPinned);
    }
  };

  if (selectedMatch) {
    return (
      <ScorecardPage 
        matchName={selectedMatch} 
        onBack={() => setSelectedMatch(null)} 
        isPinned={isPinned}
        onTogglePin={togglePin}
      />
    );
  }

  return (
    <div 
      style={{ 
        width: "400px", 
        padding: "15px", 
        fontFamily: "Arial, sans-serif",
        backgroundColor: "white",
        minHeight: "300px"
      }}
    >
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "15px",
        borderBottom: "2px solid #f0f0f0",
        paddingBottom: "10px"
      }}>
        <h2 style={{ margin: 0, color: "#333" }}>🏏 Live Cricket</h2>
        <button 
          onClick={togglePin}
          style={{
            background: isPinned ? "#28a745" : "#f8f9fa",
            color: isPinned ? "white" : "#333",
            border: "1px solid #ccc",
            padding: "6px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            if (!isPinned) {
              e.currentTarget.style.backgroundColor = "#e9ecef";
            }
          }}
          onMouseOut={(e) => {
            if (!isPinned) {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
            }
          }}
        >
          {isPinned ? "📌 Pinned" : "📌 Pin Window"}
        </button>
      </div>
      
      {lastUpdated && (
        <p style={{ 
          fontSize: "12px", 
          color: "#666", 
          margin: "0 0 15px 0",
          fontStyle: "italic"
        }}>
          Last Updated: {lastUpdated}
        </p>
      )}
      
      {matches.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "40px 20px",
          color: "#666"
        }}>
          <p style={{ fontSize: "16px", margin: 0 }}>⚠️ No matches available</p>
          <p style={{ fontSize: "12px", margin: "5px 0 0 0" }}>Check back later for live updates</p>
        </div>
      ) : (
        <div>
          {matches.map((match, index) => (
            <div 
              key={match.match} 
              style={{ 
                marginBottom: "15px", 
                border: "1px solid #e0e0e0", 
                padding: "15px", 
                borderRadius: "8px",
                backgroundColor: "#fafafa",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f8ff";
                e.currentTarget.style.borderColor = "#007bff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#fafafa";
                e.currentTarget.style.borderColor = "#e0e0e0";
              }}
            >
              <h3 style={{ 
                margin: "0 0 10px 0", 
                color: "#333",
                fontSize: "16px",
                fontWeight: "bold"
              }}>
                {match.match}
              </h3>
              
              <div style={{ marginBottom: "10px" }}>
                <span style={{ 
                  display: "inline-block",
                  background: match.status === "Live" ? "#28a745" : "#6c757d",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  marginRight: "10px"
                }}>
                  {match.status}
                </span>
                <span style={{ fontSize: "13px", color: "#666" }}>
                  {match.date_stadium}
                </span>
              </div>
              
              <div style={{ margin: "8px 0" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: "1px solid #eee"
                }}>
                  <span style={{ fontWeight: "bold", color: "#333" }}>
                    {match.teams.team1}
                  </span>
                  <span style={{ fontWeight: "bold", color: "#007bff" }}>
                    {match.teams.score1}
                  </span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  padding: "5px 0"
                }}>
                  <span style={{ fontWeight: "bold", color: "#333" }}>
                    {match.teams.team2}
                  </span>
                  <span style={{ fontWeight: "bold", color: "#007bff" }}>
                    {match.teams.score2}
                  </span>
                </div>
              </div>
              
              <p style={{ 
                margin: "10px 0", 
                fontSize: "13px", 
                color: "#666",
                fontStyle: "italic"
              }}>
                {match.teams.match_status}
              </p>
              
              <button 
                onClick={() => handleViewScorecard(match.match)}
                style={{
                  background: "linear-gradient(135deg, #007bff, #0056b3)",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                  width: "100%",
                  transition: "all 0.2s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #0056b3, #003d82)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                📊 View Scorecard & Commentary
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ScorecardPage: React.FC<{ 
  matchName: string; 
  onBack: () => void; 
  isPinned: boolean;
  onTogglePin: () => void;
}> = ({ matchName, onBack, isPinned, onTogglePin }) => {
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [commentary, setCommentary] = useState<Commentary | null>(null);

  useEffect(() => {
    const unsubscribeScorecard = onSnapshot(doc(db, "cricket", "scorecard"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log("Fetched scorecard document:", data);
        const scorecardList = data.data || [];
        
        const teamsMatch = (str1: string, str2: string): boolean => {
          const teams1 = str1.split(' vs ').map(team => team.trim().toLowerCase());
          const teams2 = str2.split(' vs ').map(team => team.trim().toLowerCase());
          
          return teams1.length === teams2.length && 
                 teams1.every(team => teams2.includes(team));
        };
        
        const matchScorecard = scorecardList.find((sc: Scorecard) => {
          const isMatch = teamsMatch(stripAfterComma(sc.match), stripAfterComma(matchName));
          
          console.log(`Checking: "${sc.match}" vs "${matchName}" - Match: ${isMatch}`);
          
          if (isMatch) {
            console.log("Found matching scorecard:", sc);
          }
          
          return isMatch;
        });
        
        console.log("Filtered scorecard for match:", matchName, matchScorecard);
        setScorecard(matchScorecard || null);
      } else {
        console.log("Scorecard document does not exist in Firestore.");
        setScorecard(null);
      }
    });

    const unsubscribeCommentary = onSnapshot(doc(db, "cricket", "full_commentary"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log("Fetched full_commentary document:", data);
        const commentaryList = data.data || [];
        const matchCommentary = commentaryList.find((c: Commentary) => c.match.includes(matchName));
        console.log("Filtered commentary for match:", matchName, matchCommentary);
        setCommentary(matchCommentary || null);
      } else {
        console.log("Full_commentary document does not exist in Firestore.");
        setCommentary(null);
      }
    });

    return () => {
      unsubscribeScorecard();
      unsubscribeCommentary();
    };
  }, [matchName]);

  return (
    <div style={{ 
      width: "400px", 
      padding: "15px", 
      fontFamily: "Arial, sans-serif",
      backgroundColor: "white",
      maxHeight: "600px",
      overflowY: "auto"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "15px",
        borderBottom: "2px solid #f0f0f0",
        paddingBottom: "10px"
      }}>
        <button 
          onClick={onBack}
          style={{
            background: "#6c757d",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold"
          }}
        >
          ← Back
        </button>
        <button 
          onClick={onTogglePin}
          style={{
            background: isPinned ? "#28a745" : "#f8f9fa",
            color: isPinned ? "white" : "#333",
            border: "1px solid #ccc",
            padding: "6px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold"
          }}
        >
          {isPinned ? "📌 Pinned" : "📌 Pin"}
        </button>
      </div>
      
      <h2 style={{ margin: "0 0 20px 0", color: "#333", fontSize: "18px" }}>
        {matchName}
      </h2>
      
      {scorecard ? (
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#007bff" }}>📊 Scorecard</h3>
          {scorecard.innings.map((inning, idx) => (
            <div key={idx} style={{ 
              marginBottom: "20px", 
              padding: "15px", 
              border: "1px solid #e0e0e0", 
              borderRadius: "8px",
              backgroundColor: "#fafafa"
            }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#333" }}>
                {inning.innings_name}
              </h4>
              <div style={{ display: "flex", gap: "20px", marginBottom: "10px" }}>
                <span style={{ fontWeight: "bold", color: "#007bff" }}>
                  Total: {inning.total}
                </span>
                <span style={{ color: "#666" }}>
                  Extras: {inning.extras}
                </span>
              </div>
              
              <h5 style={{ margin: "15px 0 8px 0", color: "#333" }}>🏏 Batters</h5>
              <div style={{ fontSize: "13px" }}>
                {inning.batters.map((batter, i) => (
                  <div key={i} style={{ 
                    padding: "4px 0", 
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span style={{ fontWeight: "bold" }}>{batter.name}</span>
                    <span>{batter.runs} ({batter.balls}, SR: {batter.strike_rate})</span>
                  </div>
                ))}
              </div>
              
              <h5 style={{ margin: "15px 0 8px 0", color: "#333" }}>⚾ Bowlers</h5>
              <div style={{ fontSize: "13px" }}>
                {inning.bowlers.map((bowler, i) => (
                  <div key={i} style={{ 
                    padding: "4px 0", 
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span style={{ fontWeight: "bold" }}>{bowler.bowler_name}</span>
                    <span>{bowler.overs} overs, {bowler.runs}-{bowler.wickets}, Econ: {bowler.economy}</span>
                  </div>
                ))}
              </div>
              
              {inning.yet_to_bat.length > 0 && (
                <p style={{ margin: "10px 0 0 0", fontSize: "12px", color: "#666" }}>
                  <strong>Yet to Bat:</strong> {inning.yet_to_bat.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
          📊 No scorecard available
        </p>
      )}
      
      <div>
        <h3 style={{ margin: "0 0 15px 0", color: "#007bff" }}>💬 Commentary</h3>
        
        {commentary ? (
          <div>
            <div style={{ 
              padding: "10px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              marginBottom: "15px"
            }}>
              <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                Latest Over: {commentary.latest_over ?? "N/A"}
              </span>
            </div>
            
            <div style={{ 
              maxHeight: "300px", 
              overflowY: "auto", 
              border: "1px solid #e0e0e0", 
              borderRadius: "6px"
            }}>
              {commentary.events.slice(-15).reverse().map((event, i) => {
                const parsed = parseCommentaryEvent(event);
                return (
                  <div key={i} style={{ 
                    padding: "10px", 
                    borderBottom: i < commentary.events.slice(-15).length - 1 ? "1px solid #f0f0f0" : "none",
                    backgroundColor: i < 5 ? "#f8f9fa" : "white",
                    fontSize: "13px"
                  }}>
                    {parsed.runs && parsed.bowler && parsed.batsman ? (
                      <div>
                        <span style={{ 
                          color: "#007bff", 
                          fontWeight: "bold",
                          marginRight: "10px"
                        }}>
                          {parsed.runs}
                        </span>
                        <span style={{ color: "#666" }}>
                          {parsed.bowler} to {parsed.batsman}
                        </span>
                        <div style={{ marginTop: "3px", color: "#333" }}>
                          {parsed.outcome}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "#333" }}>{event}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
            💬 No commentary available
          </p>
        )}
      </div>
    </div>
  );
};

export default Popup;
