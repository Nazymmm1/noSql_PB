// API Configuration
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;
let userProfile = null;
let userPosts = [];

// DOM Elements
const navbar = document.getElementById('navbar');
const profileLoading = document.getElementById('profileLoading');
const profileContent = document.getElementById('profileContent');
const userPostsList = document.getElementById('userPostsList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
});

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    
    if (token && username && userId) {
        currentUser = { token, username, userId };
        updateNavbar(true);
    } else {
        updateNavbar(false);
        // Redirect to home if not logged in
        window.location.href = 'index.html';
    }
}

// Update navbar
function updateNavbar(isLoggedIn) {
    if (isLoggedIn) {
        navbar.innerHTML = `
            <a href="index.html">Home</a>
            <span class="username-display">👤 ${currentUser.username}</span>
            <button onclick="logout()">Logout</button>
        `;
    } else {
        navbar.innerHTML = `
            <a href="index.html">Home</a>
            <button onclick="window.location.href='index.html'">Login</button>
        `;
    }
}

// Load Profile
async function loadProfile() {
    if (!currentUser) return;

    try {
        // Get user profile data
        const profileResponse = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error('Failed to load profile');
        }

        const profileData = await profileResponse.json();
        userProfile = profileData;

        // Get user's posts
        const postsResponse = await fetch(`${API_URL}/users/${currentUser.userId}/posts`);
        
        if (postsResponse.ok) {
            userPosts = await postsResponse.json();
        }

        renderProfile();
        renderUserPosts();
        
        profileLoading.style.display = 'none';
        profileContent.style.display = 'block';

    } catch (error) {
        console.error('Error loading profile:', error);
        profileLoading.innerHTML = '<div class="error">Failed to load profile. Please try again.</div>';
    }
}

// Render Profile
function renderProfile() {
    if (!userProfile) return;

    const { user, stats } = userProfile;

    // Set profile initial (first letter of username)
    document.getElementById('profileInitial').textContent = user.username.charAt(0).toUpperCase();

    // Set profile info
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileJoined').textContent = `Joined ${formatDate(user.createdAt)}`;

    // Set stats
    document.getElementById('statPosts').textContent = stats.postCount;
    document.getElementById('statLikes').textContent = stats.totalLikes;
    document.getElementById('statComments').textContent = stats.totalComments;
}

// Render User Posts
function renderUserPosts() {
    if (userPosts.length === 0) {
        userPostsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h4>No posts yet</h4>
                <p>Start sharing your thoughts with the world!</p>
                <br>
                <a href="index.html" style="color: #3498db; text-decoration: none;">
                    ← Go back and create your first post
                </a>
            </div>
        `;
        return;
    }

    userPostsList.innerHTML = userPosts.map(post => `
        <div class="user-post-card">
            <h4 class="user-post-title">${escapeHtml(post.title)}</h4>
            
            <div class="user-post-meta">
                <span>📅 ${formatDate(post.createdAt)}</span>
                ${post.tags && post.tags.length > 0 ? `
                    <span>🏷️ ${post.tags.join(', ')}</span>
                ` : ''}
            </div>
            
            <div class="user-post-content">${escapeHtml(post.content)}</div>
            
            <div class="user-post-stats">
                <span>❤️ ${post.likes?.length || 0} likes</span>
                <span>💬 ${post.comments?.length || 0} comments</span>
                <span>👍 ${post.reactions?.length || 0} reactions</span>
            </div>
        </div>
    `).join('');
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    currentUser = null;
    window.location.href = 'index.html';
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}