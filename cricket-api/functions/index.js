const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Set global options for all functions
setGlobalOptions({ maxInstances: 10 });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Optional: Prevent overlapping executions
let isRunning = false;

exports.fetchCricketData = onSchedule({
  schedule: "every 2 minutes",
  timeoutSeconds: 540,
  memory: "1GiB"
}, async () => {
  if (isRunning) {
    console.warn("Previous execution still running. Skipping.");
    return;
  }

  isRunning = true;
  console.log("Cricket function triggered at:", new Date().toISOString());

  const dir = __dirname;
  console.log("Working directory:", dir);

  return new Promise((resolve, reject) => {
    const command = "node matches_scorecard.js && node full_commentary.js";
    const execOptions = {
      cwd: dir,
      timeout: 480000,
      maxBuffer: 1024 * 1024 * 10
    };

    console.log("Executing JS scripts...");

    exec(command, execOptions, async (error, stdout, stderr) => {
      try {
        if (error) {
          console.error("JS execution error:", error);
          return reject(new Error(`JS script failed: ${error.message}`));
        }

        if (stderr) console.warn("JS stderr:", stderr);
        if (stdout) console.log("JS stdout:", stdout);

        // Updated paths to point to data/ folder
        const matchesPath = path.join(dir, "data", "matches.json");
        const scorecardPath = path.join(dir, "data", "scorecard.json");
        const commentaryPath = path.join(dir, "data", "full_commentary.json");

        console.log("Checking file paths:");
        console.log("Matches:", matchesPath);
        console.log("Scorecard:", scorecardPath);
        console.log("Commentary:", commentaryPath);

        if (!fs.existsSync(matchesPath) || !fs.existsSync(scorecardPath) || !fs.existsSync(commentaryPath)) {
          throw new Error("One or more JSON files not found in data/");
        }

        console.log("Reading JSON files...");
        const matches = JSON.parse(fs.readFileSync(matchesPath, "utf-8"));
        const scorecard = JSON.parse(fs.readFileSync(scorecardPath, "utf-8"));
        const commentary = JSON.parse(fs.readFileSync(commentaryPath, "utf-8"));

        console.log(`Loaded: matches=${matches.length}, scorecard=${scorecard.length}, commentary=${commentary.length}`);

        console.log("Writing data to Firestore...");
        const batch = db.batch();

        batch.set(db.collection("cricket").doc("matches"), {
          data: matches,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batch.set(db.collection("cricket").doc("scorecard"), {
          data: scorecard,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        batch.set(db.collection("cricket").doc("full_commentary"), {
          data: commentary,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        console.log("Data successfully written to Firestore");
        resolve("Success");

      } catch (err) {
        console.error("Processing error:", err.message);
        reject(err);
      } finally {
        isRunning = false;
      }
    });
  });
});
