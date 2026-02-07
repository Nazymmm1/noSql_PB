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
    const imageInput = document.getElementById('postImage');
    
    // Character counter
    contentTextarea.addEventListener('input', updateCharCounter);
    
    // Live preview
    titleInput.addEventListener('input', updatePreview);
    contentTextarea.addEventListener('input', updatePreview);
    tagsInput.addEventListener('input', updatePreview);
    
    // Image preview
    imageInput.addEventListener('change', handleImageSelect);
    
    // Form submission
    form.addEventListener('submit', handleCreatePost);
}

// Handle Image Selection
function handleImageSelect(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        e.target.value = '';
        return;
    }
    
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        showToast('Please select a valid image file (JPG, PNG, GIF, WebP)', 'error');
        e.target.value = '';
        return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(event) {
        const preview = document.getElementById('imagePreview');
        const container = document.getElementById('imagePreviewContainer');
        const previewImage = document.getElementById('previewImage');
        const previewImageContainer = document.getElementById('previewImageContainer');
        
        preview.src = event.target.result;
        container.style.display = 'block';
        
        // Update preview section
        if (previewImage && previewImageContainer) {
            previewImage.src = event.target.result;
            previewImageContainer.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

// Remove Image Preview
function removeImagePreview() {
    const imageInput = document.getElementById('postImage');
    const container = document.getElementById('imagePreviewContainer');
    const previewImageContainer = document.getElementById('previewImageContainer');
    
    imageInput.value = '';
    container.style.display = 'none';
    if (previewImageContainer) {
        previewImageContainer.style.display = 'none';
    }
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
    const imageInput = document.getElementById('postImage');
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    if (!title || !content) {
        showToast('Title and content are required', 'error');
        return;
    }

    // Use FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('tags', JSON.stringify(tags));
    
    // Add image if selected
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
                // Don't set Content-Type - browser sets it with boundary for FormData
            },
            body: formData
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