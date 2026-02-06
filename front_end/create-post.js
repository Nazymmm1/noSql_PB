// API Configuration
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
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
        showToast('Please login to create a post', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 2000);
    }
}

// Update Navbar
function updateNavbar(isLoggedIn) {
    const navbar = document.getElementById('navbar');
    
    if (isLoggedIn) {
        navbar.innerHTML = `
            <a href="index.html" class="btn btn-link">🏠 Home</a>
            <a href="profile.html" class="btn btn-link">
                👤 ${currentUser.username}
            </a>
            <button onclick="logout()" class="btn btn-secondary">Logout</button>
        `;
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Setup Event Listeners
function setupEventListeners() {
    const form = document.getElementById('createPostForm');
    const contentTextarea = document.getElementById('postContent');
    const titleInput = document.getElementById('postTitle');
    const tagsInput = document.getElementById('postTags');
    
    // Character counter
    contentTextarea.addEventListener('input', updateCharCounter);
    
    // Live preview
    titleInput.addEventListener('input', updatePreview);
    contentTextarea.addEventListener('input', updatePreview);
    tagsInput.addEventListener('input', updatePreview);
    
    // Form submission
    form.addEventListener('submit', handleCreatePost);
}

// Update character counter
function updateCharCounter() {
    const content = document.getElementById('postContent').value;
    document.getElementById('charCount').textContent = content.length;
}

// Update preview
function updatePreview() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const tagsInput = document.getElementById('postTags').value;
    
    const preview = document.getElementById('postPreview');
    const previewTitle = document.getElementById('previewTitle');
    const previewContent = document.getElementById('previewContent');
    const previewTags = document.getElementById('previewTags');
    
    if (title || content || tagsInput) {
        preview.style.display = 'block';
        previewTitle.textContent = title || 'Your title will appear here';
        previewContent.textContent = content || 'Your content will appear here...';
        
        if (tagsInput) {
            const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
            previewTags.innerHTML = tags.map(tag => `<span class="tag">#${tag}</span>`).join('');
        } else {
            previewTags.innerHTML = '';
        }
    } else {
        preview.style.display = 'none';
    }
}

// Handle Create Post
async function handleCreatePost(e) {
    e.preventDefault();

    if (!currentUser) {
        showToast('Please login to create a post', 'error');
        return;
    }

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const tagsInput = document.getElementById('postTags').value;
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    if (!title || !content) {
        showToast('Title and content are required', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ title, content, tags })
        });

        if (response.ok) {
            const newPost = await response.json();
            showToast('Post created successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = `post.html?id=${newPost._id}`;
            }, 1000);
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showToast('An error occurred while creating the post', 'error');
    }
}

// Utility Functions
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