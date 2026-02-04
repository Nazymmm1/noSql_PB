// API Configuration
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;
let posts = [];

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
            <span class="username-display">👤 ${currentUser.username}</span>
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
        posts = await response.json();
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
            </div>
            
            <div class="post-content">${escapeHtml(post.content)}</div>
            
            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
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
        
        return `
        <div class="comment">
            <div class="comment-meta">
                ${formatDate(comment.createdAt)}
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