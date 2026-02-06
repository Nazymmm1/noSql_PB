// API Configuration
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;
let currentFilter = 'tag';
let allPosts = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadAllPosts();
    loadPopularTags();
    
    // Check if there's a tag parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tag = urlParams.get('tag');
    if (tag) {
        document.getElementById('tagInput').value = tag;
        searchByTag();
    }
    
    // Add Enter key listeners
    document.getElementById('tagInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchByTag();
    });
    document.getElementById('keywordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchByKeyword();
    });
    document.getElementById('titleInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchByTitle();
    });
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
            <a href="index.html" class="btn btn-link">🏠 Home</a>
            <a href="create-post.html" class="btn btn-link">✍️ Create</a>
            <a href="profile.html" class="btn btn-link">
                👤 ${currentUser.username}
            </a>
            <button onclick="logout()" class="btn btn-secondary">Logout</button>
        `;
    } else {
        navbar.innerHTML = `
            <a href="index.html" class="btn btn-link">🏠 Home</a>
            <a href="auth.html" class="btn btn-primary">Login / Sign Up</a>
        `;
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

// Switch Filter
function switchFilter(filter) {
    currentFilter = filter;
    
    // Update tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.filter-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${filter}Filter`).classList.add('active');
}

// Load All Posts
async function loadAllPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        allPosts = await response.json();
        renderPosts(allPosts);
        updateResultsHeader('All Posts', allPosts.length);
    } catch (error) {
        console.error('Error loading posts:', error);
        document.getElementById('searchResultsList').innerHTML = 
            '<div class="loading">Failed to load posts</div>';
    }
}

// Load Popular Tags
async function loadPopularTags() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        
        // Extract and count tags
        const tagCount = {};
        posts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
        });
        
        // Get top 10 tags
        const popularTags = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag]) => tag);
        
        const tagsContainer = document.getElementById('popularTags');
        tagsContainer.innerHTML = popularTags.map(tag => 
            `<span class="tag" onclick="quickSearchTag('${tag}')">#${tag}</span>`
        ).join('');
    } catch (error) {
        console.error('Error loading popular tags:', error);
    }
}

// Quick search by clicking popular tag
function quickSearchTag(tag) {
    document.getElementById('tagInput').value = tag;
    searchByTag();
}

// Search by Tag
async function searchByTag() {
    const tag = document.getElementById('tagInput').value.trim();
    
    if (!tag) {
        showToast('Please enter a tag to search', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/search?tag=${encodeURIComponent(tag)}`);
        const posts = await response.json();
        
        renderPosts(posts);
        updateResultsHeader(`Posts tagged with "${tag}"`, posts.length);
        showSearchActions();
        
        if (posts.length === 0) {
            showToast(`No posts found with tag "${tag}"`, 'error');
        } else {
            showToast(`Found ${posts.length} post${posts.length !== 1 ? 's' : ''}`, 'success');
        }
    } catch (error) {
        console.error('Error searching:', error);
        showToast('Error searching posts', 'error');
    }
}

// Search by Keyword
async function searchByKeyword() {
    const keyword = document.getElementById('keywordInput').value.trim().toLowerCase();
    
    if (!keyword) {
        showToast('Please enter a keyword to search', 'error');
        return;
    }

    const filteredPosts = allPosts.filter(post => 
        post.content.toLowerCase().includes(keyword) ||
        post.title.toLowerCase().includes(keyword)
    );
    
    renderPosts(filteredPosts);
    updateResultsHeader(`Posts containing "${keyword}"`, filteredPosts.length);
    showSearchActions();
    
    if (filteredPosts.length === 0) {
        showToast(`No posts found containing "${keyword}"`, 'error');
    } else {
        showToast(`Found ${filteredPosts.length} post${filteredPosts.length !== 1 ? 's' : ''}`, 'success');
    }
}

// Search by Title
async function searchByTitle() {
    const title = document.getElementById('titleInput').value.trim().toLowerCase();
    
    if (!title) {
        showToast('Please enter a title to search', 'error');
        return;
    }

    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(title)
    );
    
    renderPosts(filteredPosts);
    updateResultsHeader(`Posts with title containing "${title}"`, filteredPosts.length);
    showSearchActions();
    
    if (filteredPosts.length === 0) {
        showToast(`No posts found with title containing "${title}"`, 'error');
    } else {
        showToast(`Found ${filteredPosts.length} post${filteredPosts.length !== 1 ? 's' : ''}`, 'success');
    }
}

// Clear Search
function clearSearch() {
    document.getElementById('tagInput').value = '';
    document.getElementById('keywordInput').value = '';
    document.getElementById('titleInput').value = '';
    
    renderPosts(allPosts);
    updateResultsHeader('All Posts', allPosts.length);
    hideSearchActions();
    
    showToast('Search cleared', 'success');
}

// Render Posts
function renderPosts(posts) {
    const container = document.getElementById('searchResultsList');
    
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h4>No posts found</h4>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="post-card" onclick="goToPost('${post._id}')">
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
                        `<span class="tag" onclick="event.stopPropagation(); quickSearchTag('${tag}')">#${tag}</span>`
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
}

// Update Results Header
function updateResultsHeader(title, count) {
    const header = document.getElementById('resultsHeader');
    const titleElement = document.getElementById('resultsTitle');
    const countElement = document.getElementById('resultsCount');
    
    header.style.display = 'flex';
    titleElement.textContent = title;
    countElement.textContent = `${count} post${count !== 1 ? 's' : ''}`;
}

// Show/Hide Search Actions
function showSearchActions() {
    document.getElementById('searchActions').style.display = 'block';
}

function hideSearchActions() {
    document.getElementById('searchActions').style.display = 'none';
}

// Navigate to post
function goToPost(postId) {
    window.location.href = `post.html?id=${postId}`;
}

// Utility Functions
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