// API Configuration
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadRecentPosts();
});

// Check Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    
    if (token && username && userId) {
        currentUser = { token, username, userId };
        updateNavbar(true);
    } else {
        currentUser = null;
        updateNavbar(false);
    }
}

// Update Navbar
function updateNavbar(isLoggedIn) {
    const navbar = document.getElementById('navbar');
    
    if (isLoggedIn) {
        navbar.innerHTML = `
            <a href="profile.html" class="btn btn-link">
                👤 ${currentUser.username}
            </a>
            <button onclick="logout()" class="btn btn-secondary">Logout</button>
        `;
        
        const createBtn = document.getElementById('createPostBtn');
        if (createBtn) {
            createBtn.style.display = 'inline-flex';
        }
    } else {
        navbar.innerHTML = `
            <a href="auth.html" class="btn btn-primary">Login / Sign Up</a>
        `;
        
        const createBtn = document.getElementById('createPostBtn');
        if (createBtn) {
            createBtn.style.display = 'none';
        }
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    currentUser = null;
    showToast('Logged out successfully', 'success');
    checkAuth();
}

// Load Recent Posts
async function loadRecentPosts() {
    const postsList = document.getElementById('postsList');
    
    console.log('Loading posts from:', `${API_URL}/posts`);
    
    try {
        const response = await fetch(`${API_URL}/posts`);
        console.log('Posts response status:', response.status);
        
        const posts = await response.json();
        console.log('Received posts:', posts);
        
        if (posts.length === 0) {
            postsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h4>No posts yet</h4>
                    <p>Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }
        
        const recentPosts = posts.slice(0, 12);
        console.log('Displaying posts:', recentPosts.length);
        
        postsList.innerHTML = recentPosts.map(post => `
            <div class="post-card" onclick="goToPost('${post._id}')">
                ${post.image ? `
                    <div class="post-image">
                        <img src="${API_URL}${post.image}" alt="${escapeHtml(post.title)}" 
                             onerror="this.parentElement.style.display='none'"
                             style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
                    </div>
                ` : ''}
                <div class="post-header">
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        By ${post.author?.username || 'Unknown'} • ${formatDate(post.createdAt)}
                    </div>
                </div>
                
                <div class="post-content">${escapeHtml(post.content)}</div>
                
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.slice(0, 3).map(tag => 
                            `<span class="tag" onclick="event.stopPropagation(); searchByTag('${tag}')">#${tag}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="post-actions" onclick="event.stopPropagation();">
                    <button disabled>
                        ❤️ ${post.likes?.length || 0}
                    </button>
                    <button disabled>
                        💬 ${post.comments?.length || 0}
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = '<div class="loading">Failed to load posts. Error: ' + error.message + '</div>';
    }
}

function goToPost(postId) {
    window.location.href = `post.html?id=${postId}`;
}

function searchByTag(tag) {
    window.location.href = `search.html?tag=${encodeURIComponent(tag)}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}