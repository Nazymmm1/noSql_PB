// API Configuration script js
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;
let posts = [];
let allPosts = []; // Store all posts for filtering
let isSearching = false;
let currentEditingPostId = null;
let currentDeletingPostId = null;
let currentDeletingCommentId = null;
let currentDeletingCommentPostId = null;

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const navbar = document.getElementById('navbar');
const createPostSection = document.getElementById('createPostSection');
const postsList = document.getElementById('postsList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    loadPosts();
    
    // Add Enter key listener for search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchByTag();
        }
    });
});

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    
    if (token && username && userId) {
        currentUser = { token, username, userId };
        updateNavbar(true);
        createPostSection.style.display = 'block';
    } else {
        updateNavbar(false);
        createPostSection.style.display = 'none';
    }
}

// Update navbar based on auth state
function updateNavbar(isLoggedIn) {
    if (isLoggedIn) {
        navbar.innerHTML = `
            <a href="profile.html" class="username-display" style="text-decoration: none; cursor: pointer;">
                👤 ${currentUser.username}
            </a>
            <button onclick="logout()">Logout</button>
        `;
    } else {
        navbar.innerHTML = `
            <button onclick="openAuthModal('login')">Login</button>
            <button onclick="openAuthModal('register')">Sign Up</button>
        `;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Modal close
    document.querySelector('.close').addEventListener('click', closeAuthModal);
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            closeAuthModal();
        }
        if (e.target === document.getElementById('editPostModal')) {
            closeEditModal();
        }
        if (e.target === document.getElementById('deleteModal')) {
            closeDeleteModal();
        }
        if (e.target === document.getElementById('deleteCommentModal')) {
            closeDeleteCommentModal();
        }
    });

    // Toggle between login and register
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Login form submit
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);

    // Register form submit
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);

    // Create post form submit
    document.getElementById('createPostForm').addEventListener('submit', handleCreatePost);
    
    // Edit post form submit
    document.getElementById('editPostForm').addEventListener('submit', handleEditPost);
}

// Auth Modal Functions
function openAuthModal(mode) {
    authModal.classList.add('show');
    if (mode === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function closeAuthModal() {
    authModal.classList.remove('show');
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Decode JWT to get user ID
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            const userId = payload.id;
            
            const username = email.split('@')[0];
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            localStorage.setItem('userId', userId);
            
            currentUser = { token: data.token, username, userId };
            
            closeAuthModal();
            checkAuth();
            showMessage('Login successful!', 'success');
            loadPosts();
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('An error occurred during login', 'error');
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Registration successful! Please login.', 'success');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            document.getElementById('registerFormElement').reset();
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showMessage('An error occurred during registration', 'error');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    currentUser = null;
    checkAuth();
    showMessage('Logged out successfully', 'success');
    loadPosts();
}

// Load Posts
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        allPosts = await response.json();
        posts = allPosts; // Show all posts initially
        renderPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = '<div class="error">Failed to load posts</div>';
    }
}

// Render Posts
function renderPosts() {
    if (posts.length === 0) {
        postsList.innerHTML = '<div class="loading">No posts yet. Create the first one!</div>';
        return;
    }

    postsList.innerHTML = posts.map(post => {
        // Check if current user liked this post
        const userLiked = currentUser && post.likes?.some(like => 
            like === currentUser.userId || like._id === currentUser.userId
        );
        
        // Get user's reaction if any
        const userReaction = currentUser && post.reactions?.find(r => 
            r.userId === currentUser.userId || r.userId._id === currentUser.userId
        );
        
        // Count reactions by type
        const reactionCounts = {};
        if (post.reactions) {
            post.reactions.forEach(r => {
                reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
            });
        }
        
        return `
        <div class="post-card" data-post-id="${post._id}">
            <div class="post-header">
                <div>
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        By ${post.author?.username || 'Unknown'} • ${formatDate(post.createdAt)}
                    </div>
                </div>
                ${currentUser && (post.author?._id === currentUser.userId || post.author === currentUser.userId) ? `
                    <div class="post-actions-menu">
                        <button onclick="editPost('${post._id}')" class="edit-btn" title="Edit">✏️</button>
                        <button onclick="deletePost('${post._id}')" class="delete-btn" title="Delete">🗑️</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="post-content">${escapeHtml(post.content)}</div>
            
            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag" onclick="searchByTagClick('${tag}')">#${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="post-actions">
                <button onclick="likePost('${post._id}')" ${!currentUser ? 'disabled' : ''} 
                    class="${userLiked ? 'liked' : ''}">
                    ${userLiked ? '❤️' : '🤍'} ${userLiked ? 'Liked' : 'Like'} (${post.likes?.length || 0})
                </button>
                
                ${['👍', '❤️', '😂', '😭', '😡'].map(emoji => {
                    const count = reactionCounts[emoji] || 0;
                    const isActive = userReaction?.type === emoji;
                    return `
                        <button class="reaction-btn ${isActive ? 'active' : ''}" 
                            onclick="reactToPost('${post._id}', '${emoji}')" 
                            ${!currentUser ? 'disabled' : ''}
                            title="${count} reaction${count !== 1 ? 's' : ''}">
                            ${emoji} ${count > 0 ? count : ''}
                        </button>
                    `;
                }).join('')}
                
                <button onclick="toggleComments('${post._id}')">
                    💬 Comments (${post.comments?.length || 0})
                </button>
            </div>
            
            <div id="comments-${post._id}" class="comments-section" style="display: none;">
                <h3>Comments</h3>
                
                ${currentUser ? `
                    <div class="comment-form">
                        <input type="text" id="comment-input-${post._id}" placeholder="Write a comment...">
                        <button onclick="addComment('${post._id}')">Post</button>
                    </div>
                ` : '<p>Please login to comment</p>'}
                
                <div class="comments-list" id="comments-list-${post._id}">
                    ${renderComments(post.comments || [], post._id)}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Render Comments
function renderComments(comments, postId) {
    if (comments.length === 0) {
        return '<p class="loading">No comments yet</p>';
    }

    return comments.map(comment => {
        const userLiked = currentUser && comment.likes?.some(like => 
            like === currentUser.userId || like._id === currentUser.userId
        );
        
        const isCommentAuthor = currentUser && (comment.userId === currentUser.userId || comment.userId?._id === currentUser.userId);
        
        return `
        <div class="comment">
            <div class="comment-header">
                <div class="comment-meta">
                    ${formatDate(comment.createdAt)}
                </div>
                ${isCommentAuthor ? `
                    <button onclick="deleteComment('${postId}', '${comment._id}')" class="delete-comment-btn" title="Delete comment">🗑️</button>
                ` : ''}
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            <div class="comment-actions">
                <button onclick="likeComment('${postId}', '${comment._id}')" 
                    ${!currentUser ? 'disabled' : ''}
                    class="${userLiked ? 'liked' : ''}">
                    ${userLiked ? '❤️' : '🤍'} ${comment.likes?.length || 0}
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Toggle Comments Section
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
    } else {
        commentsSection.style.display = 'none';
    }
}

// Create Post
async function handleCreatePost(e) {
    e.preventDefault();

    if (!currentUser) {
        showMessage('Please login to create a post', 'error');
        return;
    }

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const tagsInput = document.getElementById('postTags').value;
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

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
            showMessage('Post created successfully!', 'success');
            document.getElementById('createPostForm').reset();
            loadPosts();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showMessage('An error occurred while creating the post', 'error');
    }
}

// Like Post
async function likePost(postId) {
    if (!currentUser) {
        showMessage('Please login to like posts', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            loadPosts();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Failed to like post', 'error');
        }
    } catch (error) {
        console.error('Error liking post:', error);
    }
}

// React to Post
async function reactToPost(postId, type) {
    if (!currentUser) {
        showMessage('Please login to react', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/react`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ type })
        });

        if (response.ok) {
            loadPosts();
        }
    } catch (error) {
        console.error('Error reacting to post:', error);
    }
}

// Add Comment
async function addComment(postId) {
    if (!currentUser) {
        showMessage('Please login to comment', 'error');
        return;
    }

    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();

    if (!text) return;

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            input.value = '';
            loadPosts();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Failed to add comment', 'error');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
}

// Like Comment
async function likeComment(postId, commentId) {
    if (!currentUser) {
        showMessage('Please login to like comments', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/like`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            loadPosts();
        }
    } catch (error) {
        console.error('Error liking comment:', error);
    }
}

// Utility Functions
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Search by Tag
async function searchByTag() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    const tag = searchInput.value.trim();

    if (!tag) {
        showMessage('Please enter a tag to search', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/search?tag=${encodeURIComponent(tag)}`);
        
        if (response.ok) {
            posts = await response.json();
            
            if (posts.length === 0) {
                postsList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <h4>No posts found</h4>
                        <p>No posts found with tag "${escapeHtml(tag)}"</p>
                        <button onclick="clearSearch()" style="margin-top: 1rem; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Show All Posts
                        </button>
                    </div>
                `;
            } else {
                renderPosts();
                showMessage(`Found ${posts.length} post${posts.length !== 1 ? 's' : ''} with tag "${tag}"`, 'success');
            }
            
            isSearching = true;
            clearBtn.style.display = 'block';
        } else {
            showMessage('Error searching posts', 'error');
        }
    } catch (error) {
        console.error('Error searching:', error);
        showMessage('Error searching posts', 'error');
    }
}

// Clear Search
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    searchInput.value = '';
    posts = allPosts;
    isSearching = false;
    clearBtn.style.display = 'none';
    
    renderPosts();
    showMessage('Showing all posts', 'success');
}

// Search by clicking a tag
function searchByTagClick(tag) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = tag;
    searchByTag();
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Edit Post - Open Modal
function editPost(postId) {
    const post = posts.find(p => p._id === postId);
    if (!post) return;

    currentEditingPostId = postId;

    // Populate the form
    document.getElementById('editPostTitle').value = post.title;
    document.getElementById('editPostContent').value = post.content;
    document.getElementById('editPostTags').value = post.tags?.join(', ') || '';

    // Show modal
    document.getElementById('editPostModal').classList.add('show');
}

// Handle Edit Post Form Submit
async function handleEditPost(e) {
    e.preventDefault();

    if (!currentEditingPostId) return;

    const title = document.getElementById('editPostTitle').value.trim();
    const content = document.getElementById('editPostContent').value.trim();
    const tagsInput = document.getElementById('editPostTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    await updatePostAPI(currentEditingPostId, { title, content, tags });
    closeEditModal();
}

// Close Edit Modal
function closeEditModal() {
    document.getElementById('editPostModal').classList.remove('show');
    currentEditingPostId = null;
    document.getElementById('editPostForm').reset();
}

// Update Post API Call
async function updatePostAPI(postId, updates) {
    if (!currentUser) {
        showMessage('Please login to edit posts', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            showMessage('Post updated successfully!', 'success');
            loadPosts();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Failed to update post', 'error');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showMessage('An error occurred while updating the post', 'error');
    }
}

// Delete Post - Open Confirmation Modal
function deletePost(postId) {
    if (!currentUser) {
        showMessage('Please login to delete posts', 'error');
        return;
    }

    const post = posts.find(p => p._id === postId);
    if (!post) return;

    currentDeletingPostId = postId;
    
    // Show post title in confirmation
    document.getElementById('deletePostTitle').textContent = post.title;
    
    // Show modal
    document.getElementById('deleteModal').classList.add('show');
}

// Confirm Delete Post
async function confirmDelete() {
    if (!currentDeletingPostId) return;

    try {
        const response = await fetch(`${API_URL}/posts/${currentDeletingPostId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            showMessage('Post deleted successfully!', 'success');
            closeDeleteModal();
            loadPosts();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showMessage('An error occurred while deleting the post', 'error');
    }
}

// Close Delete Modal
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    currentDeletingPostId = null;
}

// Delete Comment - Open Confirmation Modal
function deleteComment(postId, commentId) {
    if (!currentUser) {
        showMessage('Please login to delete comments', 'error');
        return;
    }

    // Find the comment text
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    
    const comment = post.comments?.find(c => c._id === commentId);
    if (!comment) return;

    currentDeletingCommentPostId = postId;
    currentDeletingCommentId = commentId;
    
    // Show comment text in confirmation
    document.getElementById('deleteCommentText').textContent = comment.text;
    
    // Show modal
    document.getElementById('deleteCommentModal').classList.add('show');
}

// Confirm Delete Comment
async function confirmDeleteComment() {
    if (!currentDeletingCommentPostId || !currentDeletingCommentId) return;

    try {
        const response = await fetch(`${API_URL}/posts/${currentDeletingCommentPostId}/comments/${currentDeletingCommentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            showMessage('Comment deleted successfully!', 'success');
            closeDeleteCommentModal();
            loadPosts();
        } else {
            const data = await response.json();
            showMessage(data.message || 'Failed to delete comment', 'error');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        showMessage('An error occurred while deleting the comment', 'error');
    }
}

// Close Delete Comment Modal
function closeDeleteCommentModal() {
    document.getElementById('deleteCommentModal').classList.remove('show');
    currentDeletingCommentPostId = null;
    currentDeletingCommentId = null;
}