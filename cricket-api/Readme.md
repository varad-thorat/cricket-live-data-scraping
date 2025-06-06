# 🏏 Live Cricket Matches Score – Deploy to Firebase Cloud Functions

This project scrapes live cricket match data and stores it in Firebase Firestore using Firebase Functions. You can deploy it to your own Firebase project and connect it to a browser extension or web app.

---

## 📦 Prerequisites

Ensure the following are installed and set up:

- **Node.js & npm**
  1. Download from [https://nodejs.org](https://nodejs.org) (LTS version recommended)
  2. Install the setup
  3. Verify installation:
     ```bash
     node -v && npm -v
     ```

- **Firebase CLI**
  - Install globally via npm:
    ```bash
    npm install -g firebase-tools
    ```

- **Firebase Account**
  - Create a Firebase account at [Firebase Console](https://console.firebase.google.com/)
  - Create a new Firebase project
  - Switch to the **Blaze (Pay-as-you-go)** plan  
    *(No charges apply unless usage exceeds 2M function calls/month)*
  - Create a **Web App** in your project and copy the `firebaseConfig` object – you’ll need this when setting up the browser extension.

---

## 🚀 Setup & Deployment Steps

```bash
git clone https://github.com/varad-thorat/cricket-live-data-scraping.git
cd cricket-live-data-scraping
firebase login
cd functions
npm install
cd ..
firebase deploy --only functions
```
# During Deployment
- Choose your Firebase project when prompted.

-If asked to enable the Blaze plan:

  1. Add a payment method (you can set the monthly budget to ₹0 or ₹1).
  2. This is required to deploy HTTP-triggered functions, but you won’t be charged under normal usage.


# Result 
If everything is fine then you will be able to see -

## Firebase Firestore-
![firebase firestore](https://github.com/user-attachments/assets/4c029e17-aee0-4a10-9ef4-94a694c4cfb2)

## Functions-
![Functions](https://github.com/user-attachments/assets/7bead570-c438-4bc5-b107-1646c5c1827f)


