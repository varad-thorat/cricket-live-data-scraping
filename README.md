# Cricket Live Score Project

This repository contains a project for fetching and displaying live cricket scores, built with a combination of a backend API and a browser extension. The project is divided into two main folders: cricket-api and cricket-extension. Below is an overview of the project structure, purpose, and lessons learned during development.
Project Structure
1. cricket-api
This folder contains the Firebase Functions code responsible for generating and scraping live cricket scores. The code is written in JavaScript (converted from Python using AI for Firebase compatibility) and deployed to Firebase. For detailed setup and usage instructions, refer to the README.md file inside the cricket-api folder.
2. cricket-extension
This folder contains the code for a browser extension built using Plasmo and pnpm. The extension is designed to work with Chrome and other compatible browsers, displaying live cricket scores fetched from the Firebase backend. For detailed setup and usage instructions, refer to the README.md file inside the cricket-extension folder.
3. cricket-live-data-python
This folder contains the original Python code used for development and prototyping. It is included for reference but is not part of the deployed solution, as the code was converted to JavaScript for Firebase Functions compatibility.
## Firestore Database Structure
The project uses a Firestore database to store and manage cricket data. Below is the structure of the database:
![image](https://github.com/user-attachments/assets/ac1502c1-f08c-40ac-8243-ddb733ed105c)

------------------------------------------------------
## Lessons Learned
During the development of this project, several key insights were gained:

Node.js Libraries for Firebase Functions: When deploying on Firebase Functions, use Node.js-based libraries to ensure compatibility and smooth execution.
Browser Extension Development: Initially, the extension was built using a traditional approach with manifest.json, popup.html, popup.js, and background.js. This led to errors such as service worker issues with background.js and Content Security Policy (CSP) errors related to Firebase and scripts. Switching to Plasmo simplified the development process and resolved these issues.
Dependency Management: Properly importing dependencies like axios, fs, and cheerio into index.js was critical for successful deployment on Firebase Functions.
Firestore Structure: Understanding and designing the Firestore database structure (as outlined above) was essential for organizing and accessing cricket data efficiently.
Headless Browser Limitations: Libraries like Selenium and Puppeteer, which rely on headless Chrome, are not compatible with Firebase Functions. Alternatives like Replit or cloud-based instances were suggested by AI, though paid solutions were avoided.

## Getting Started
To get started with this project:

Refer to the README.md files in the cricket-api and cricket-extension folders for specific setup instructions.
Ensure you have a Firebase project set up and configured for the cricket-api deployment.
Install pnpm and follow the instructions in the cricket-extension folder to build and load the browser extension.

## Future Improvements

1. Optimize the Firebase Functions code for performance and cost efficiency.
2. Enhance the browser extension with additional features, such as real-time notifications or customizable UI.
3. Explore alternative scraping methods that are compatible with Firebase Functions without requiring headless browsers.

