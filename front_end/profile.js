// Same as original profile.js but with image support in loadUserPosts

// API Configuration
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;
let userProfile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    
    if (token && username && userId) {
        currentUser = { token, username, userId };
        updateNavbar(true);
    } else {
        showToast('Please login to view profile', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 2000);
    }
}

function updateNavbar(isLoggedIn) {
    const navbar = document.getElementById('navbar');
    
    if (isLoggedIn) {
        navbar.innerHTML = `
            <a href="index.html" class="btn btn-link">🏠 Home</a>
            <a href="search.html" class="btn btn-link">🔍 Search</a>
            <a href="create-post.html" class="btn btn-link">✍️ Create</a>
            <button onclick="logout()" class="btn btn-secondary">Logout</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

async function loadProfile() {
    if (!currentUser) return;
    
    const loadingDiv = document.getElementById('profileLoading');
    const contentDiv = document.getElementById('profileContent');
    
    try {
        console.log('Fetching profile for user:', currentUser);
        
        const response = await fetch(`${API_URL}/users/me`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        console.log('Profile response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        userProfile = await response.json();
        console.log('Received profile data:', userProfile);
        
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        
        renderProfile();
        await loadUserPosts();
        
    } catch (error) {
        console.error('Error loading profile:', error);
        loadingDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h4>Failed to load profile</h4>
                <p>${error.message}</p>
                <p>Please try logging in again</p>
                <a href="auth.html" class="btn btn-primary" style="margin-top: 1rem;">Go to Login</a>
            </div>
        `;
    }
}

function renderProfile() {
    console.log('User Profile Data:', userProfile);
    
    let username, email, createdAt, postsCount, likesReceived, commentsReceived;
    
    if (userProfile.user && userProfile.stats) {
        username = userProfile.user.username;
        email = userProfile.user.email;
        createdAt = userProfile.user.createdAt;
        postsCount = userProfile.stats.postCount || 0;
        likesReceived = userProfile.stats.totalLikes || 0;
        commentsReceived = userProfile.stats.totalComments || 0;
    } else {
        username = userProfile.username || currentUser.username || 'User';
        email = userProfile.email || 'No email';
        createdAt = userProfile.createdAt;
        postsCount = userProfile.postsCount || userProfile.postCount || 0;
        likesReceived = userProfile.likesReceived || userProfile.totalLikes || 0;
        commentsReceived = userProfile.commentsReceived || userProfile.totalComments || 0;
    }
    
    const initial = username.charAt(0).toUpperCase();
    document.getElementById('profileInitial').textContent = initial;
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileEmail').textContent = email;
    document.getElementById('profileJoined').textContent = `Joined: ${formatDate(createdAt || new Date())}`;
    
    document.getElementById('statPosts').textContent = postsCount;
    document.getElementById('statLikes').textContent = likesReceived;
    document.getElementById('statComments').textContent = commentsReceived;
    
    console.log('Profile rendered:', { username, email, postsCount, likesReceived, commentsReceived });
}

// UPDATED: Load User Posts with Image Support
async function loadUserPosts() {
    const postsContainer = document.getElementById('userPostsList');
    
    try {
        const response = await fetch(`${API_URL}/users/${currentUser.userId}/posts`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const posts = await response.json();
        
        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h4>No posts yet</h4>
                    <p>Start sharing your thoughts with the community!</p>
                    <a href="create-post.html" class="btn btn-primary" style="margin-top: 1rem;">
                        Create Your First Post
                    </a>
                </div>
            `;
            return;
        }
        
        postsContainer.innerHTML = posts.map(post => `
            <div class="user-post-card" onclick="goToPost('${post._id}')">
                ${post.image ? `
                    <div class="user-post-image">
                        <img src="${API_URL}${post.image}" alt="${escapeHtml(post.title)}" 
                             onerror="this.parentElement.style.display='none'"
                             style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0; margin-bottom: 1rem;">
                    </div>
                ` : ''}
                <h4 class="user-post-title">${escapeHtml(post.title)}</h4>
                <div class="user-post-meta">
                    <span>📅 ${formatDate(post.createdAt)}</span>
                    ${post.tags && post.tags.length > 0 ? 
                        `<span>🏷️ ${post.tags.join(', ')}</span>` : ''}
                </div>
                <div class="user-post-content">${escapeHtml(post.content.substring(0, 200))}${post.content.length > 200 ? '...' : ''}</div>
                <div class="user-post-stats">
                    <span>❤️ ${post.likes?.length || 0} likes</span>
                    <span>💬 ${post.comments?.length || 0} comments</span>
                    ${post.reactions ? 
                        `<span>😊 ${post.reactions.length} reactions</span>` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading user posts:', error);
        postsContainer.innerHTML = `
            <div class="empty-state">
                <p>Failed to load posts</p>
            </div>
        `;
    }
}

function goToPost(postId) {
    window.location.href = `post.html?id=${postId}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}