from flask import Flask, jsonify, Response, request
from flask_cors import CORS
import instaloader
from datetime import datetime
import json
import os
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend to connect

# File to store previous state
STATE_FILE = 'instagram_state.json'

def load_previous_state():
    """Load the previous state from file"""
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return None

def save_state(state):
    """Save current state to file"""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f)

def get_instagram_data(username):
    """Fetch Instagram profile data using instaloader"""
    try:
        L = instaloader.Instaloader()
        profile = instaloader.Profile.from_username(L.context, username)
        
        # Fetch recent posts (up to 6)
        recent_posts = []
        for i, post in enumerate(profile.get_posts()):
            if i >= 6:
                break
            recent_posts.append({
                'id': post.shortcode,
                'imageUrl': post.url,  # Store original URL for proxy
                'caption': post.caption[:200] if post.caption else '',
                'likes': post.likes,
                'comments': post.comments,
                'timestamp': post.date_utc.isoformat()
            })
        
        return {
            'posts': profile.mediacount,
            'followers': profile.followers,
            'following': profile.followees,
            'biography': profile.biography,
            'full_name': profile.full_name,
            'recentPosts': recent_posts
        }
    except Exception as e:
        print(f"Error fetching Instagram data: {e}")
        return None

def detect_changes(old_data, new_data):
    """Compare old and new data to detect changes"""
    if not old_data:
        return True, "Initial data fetched"
    
    changes = []
    
    if new_data['posts'] > old_data['posts']:
        diff = new_data['posts'] - old_data['posts']
        changes.append(f"Posted {diff} new {'post' if diff == 1 else 'posts'}")
    
    if new_data['followers'] > old_data['followers']:
        diff = new_data['followers'] - old_data['followers']
        changes.append(f"Gained {diff} {'follower' if diff == 1 else 'followers'}")
    elif new_data['followers'] < old_data['followers']:
        diff = old_data['followers'] - new_data['followers']
        changes.append(f"Lost {diff} {'follower' if diff == 1 else 'followers'}")
    
    if new_data['following'] > old_data['following']:
        diff = new_data['following'] - old_data['following']
        changes.append(f"Following {diff} more")
    elif new_data['following'] < old_data['following']:
        diff = old_data['following'] - new_data['following']
        changes.append(f"Unfollowed {diff}")
    
    if changes:
        return True, " • ".join(changes)
    
    return False, "No changes detected"

@app.route('/check', methods=['GET'])
def check_updates():
    """Main endpoint to check for Instagram updates"""
    username = 'lorenald_'  # The Instagram account to track
    
    # Load previous state
    previous_state = load_previous_state()
    
    # Fetch new data
    new_data = get_instagram_data(username)
    
    if not new_data:
        return jsonify({
            'error': 'Failed to fetch Instagram data',
            'stats': {
                'posts': 'Error',
                'followers': 'Error',
                'following': 'Error',
                'lastChecked': datetime.now().strftime('%Y-%m-%d %H:%M'),
                'recentPosts': []
            }
        }), 500
    
    # Detect changes
    changed, summary = detect_changes(previous_state, new_data)
    
    # Save new state
    save_state(new_data)
    
    # Convert image URLs to proxied URLs
    proxied_posts = []
    for post in new_data['recentPosts']:
        proxied_post = post.copy()
        proxied_post['imageUrl'] = f"{request.host_url}proxy-image?url={post['imageUrl']}"
        proxied_posts.append(proxied_post)
    
    # Return response
    return jsonify({
        'changed': changed,
        'ai_summary': summary,
        'stats': {
            'posts': new_data['posts'],
            'followers': new_data['followers'],
            'following': new_data['following'],
            'lastChecked': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'recentPosts': proxied_posts
        }
    })

@app.route('/proxy-image')
def proxy_image():
    """Proxy endpoint to fetch Instagram images and bypass CORS"""
    url = request.args.get('url')
    if not url:
        return "Missing URL", 400
    try:
        resp = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }, timeout=10)
        return Response(resp.content, content_type=resp.headers.get('Content-Type', 'image/jpeg'))
    except Exception as e:
        print(f"Failed to fetch image: {e}")
        return "Failed to fetch image", 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Backend is running'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)


