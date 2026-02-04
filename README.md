# Lorenald Instagram Tracker - Backend

This is the backend server for tracking the Instagram account @lorenald_

## Features
- ✅ Fetches Instagram profile data (posts, followers, following)
- ✅ Detects changes (new posts, follower changes, bio updates)
- ✅ Stores state to track changes over time
- ✅ CORS enabled for frontend communication

## Quick Start (Local Testing)

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### `GET /check`
Returns current Instagram stats and detects changes
```json
{
  "changed": true,
  "ai_summary": "Posted 2 new posts • Gained 150 followers",
  "stats": {
    "posts": 123,
    "followers": 5000,
    "following": 300,
    "lastChecked": "2024-02-04 15:30"
  }
}
```

### `GET /health`
Health check endpoint
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

## Deploy to Render (Recommended)

1. Create account at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo (or use "Deploy from Git URL")
4. Configure:
   - **Name**: lorenald-tracker-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free
5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. Copy your service URL (e.g., `https://lorenald-tracker-backend.onrender.com`)
8. Use this URL in your frontend app!

## Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Railway auto-detects Python and deploys
5. Copy your service URL
6. Use this URL in your frontend!

## Deploy to Heroku

1. Install Heroku CLI
2. Create a `Procfile`:
```
web: gunicorn app:app
```
3. Deploy:
```bash
heroku create lorenald-tracker-backend
git push heroku main
```

## Important Notes

⚠️ **Instagram Rate Limits**: Instagram may block excessive requests. The frontend is set to check every 30 minutes which should be safe.

⚠️ **Private Accounts**: This only works for public Instagram accounts.

⚠️ **Instaloader**: Uses the `instaloader` library which scrapes Instagram without authentication (for public profiles).

## Troubleshooting

**"Failed to fetch Instagram data"**
- Check if the Instagram username is correct (currently set to 'lorenald_')
- Instagram might be blocking requests - try again later
- Check server logs for specific errors

**CORS errors in frontend**
- Make sure `flask-cors` is installed
- Check that the backend URL is correct in your frontend

**Backend not responding**
- Check if the service is running (visit /health endpoint)
- Free tier services sleep after inactivity - first request may be slow

## Customization

To track a different Instagram account, change this line in `app.py`:
```python
username = 'lorenald_'  # Change to any public Instagram username
```
