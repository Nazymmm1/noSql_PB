// API Configuration
const API_URL = 'http://localhost:5000';

// State
let currentUser = null;
let currentPost = null;
let postId = null;
let currentDeletingCommentId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get('id');
    
    if (!postId) {
        showToast('Post not found', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    checkAuth();
    loadPost();
    setupModalListeners();
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
            <a href="search.html" class="btn btn-link">🔍 Search</a>
            <a href="create-post.html" class="btn btn-link">✍️ Create</a>
            <a href="profile.html" class="btn btn-link">
                👤 ${currentUser.username}
            </a>
            <button onclick="logout()" class="btn btn-secondary">Logout</button>
        `;
    } else {
        navbar.innerHTML = `
            <a href="index.html" class="btn btn-link">🏠 Home</a>
            <a href="search.html" class="btn btn-link">🔍 Search</a>
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
    loadPost();
}

// Load Post
async function loadPost() {
    const loadingDiv = document.getElementById('loadingPost');
    const contentDiv = document.getElementById('postContent');
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        
        if (!response.ok) {
            throw new Error('Post not found');
        }
        
        currentPost = await response.json();
        
        loadingDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        
        renderPost();
        renderComments();
        
    } catch (error) {
        console.error('Error loading post:', error);
        loadingDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <h4>Post not found</h4>
                <p>The post you're looking for doesn't exist</p>
                <a href="index.html" class="btn btn-primary" style="margin-top: 1rem;">Go Home</a>
            </div>
        `;
    }
}

// Render Post
function renderPost() {
    document.getElementById('postTitle').textContent = currentPost.title;
    document.getElementById('postAuthor').textContent = currentPost.author?.username || 'Unknown';
    document.getElementById('postDate').textContent = formatDate(currentPost.createdAt);
    document.getElementById('postBody').textContent = currentPost.content;
    
    // Render image if exists
    if (currentPost.image) {
        const imageContainer = document.getElementById('postImageContainer');
        const imageElement = document.getElementById('postImage');
        
        imageElement.src = `${API_URL}${currentPost.image}`;
        imageElement.alt = currentPost.title;
        imageElement.onerror = function() {
            console.error('Failed to load image');
            imageContainer.style.display = 'none';
        };
        imageContainer.style.display = 'block';
    }
    
    // Render tags
    const tagsContainer = document.getElementById('postTags');
    if (currentPost.tags && currentPost.tags.length > 0) {
        tagsContainer.innerHTML = currentPost.tags.map(tag => 
            `<span class="tag" onclick="searchByTag('${tag}')">#${tag}</span>`
        ).join('');
    }
    
    // Update like button
    const userLiked = currentUser && currentPost.likes?.some(like => 
        like === currentUser.userId || like._id === currentUser.userId
    );
    
    const likeBtn = document.getElementById('likeBtn');
    document.getElementById('likeIcon').textContent = userLiked ? '❤️' : '🤍';
    document.getElementById('likeText').textContent = userLiked ? 'Liked' : 'Like';
    document.getElementById('likeCount').textContent = currentPost.likes?.length || 0;
    
    if (userLiked) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
    
    if (!currentUser) {
        likeBtn.disabled = true;
    }
    
    // Update reactions
    const reactionCounts = {};
    if (currentPost.reactions) {
        currentPost.reactions.forEach(r => {
            reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
        });
    }
    
    const userReaction = currentUser && currentPost.reactions?.find(r => 
        r.userId === currentUser.userId || r.userId._id === currentUser.userId
    );
    
    ['👍', '❤️', '😂', '😭', '😡'].forEach(emoji => {
        const count = reactionCounts[emoji] || 0;
        const btn = document.querySelector(`[data-reaction="${emoji}"]`);
        const countSpan = document.getElementById(`count-${emoji}`);
        
        if (countSpan) {
            countSpan.textContent = count || '';
        }
        
        if (btn) {
            if (userReaction?.type === emoji) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            if (!currentUser) {
                btn.disabled = true;
            }
        }
    });
    
    // Show edit/delete buttons if user is author
    const isAuthor = currentUser && (
        currentPost.author?._id === currentUser.userId || 
        currentPost.author === currentUser.userId
    );
    
    if (isAuthor) {
        document.getElementById('postOwnerActions').style.display = 'flex';
    }
}

// Render Comments
function renderComments() {
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    const addCommentForm = document.getElementById('addCommentForm');
    const loginPrompt = document.getElementById('loginPrompt');
    
    commentsCount.textContent = currentPost.comments?.length || 0;
    
    if (currentUser) {
        addCommentForm.style.display = 'block';
        loginPrompt.style.display = 'none';
    } else {
        addCommentForm.style.display = 'none';
        loginPrompt.style.display = 'block';
    }
    
    if (!currentPost.comments || currentPost.comments.length === 0) {
        commentsList.innerHTML = `
            <div class="empty-state">
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = currentPost.comments.map(comment => {
        const userLiked = currentUser && comment.likes?.some(like => 
            like === currentUser.userId || like._id === currentUser.userId
        );
        
        const isCommentAuthor = currentUser && (
            comment.userId === currentUser.userId || 
            comment.userId?._id === currentUser.userId
        );
        
        return `
            <div class="comment">
                <div class="comment-header">
                    <div class="comment-meta">
                        ${formatDate(comment.createdAt)}
                    </div>
                    ${isCommentAuthor ? `
                        <button onclick="deleteComment('${comment._id}')" class="delete-comment-btn" title="Delete comment">
                            🗑️
                        </button>
                    ` : ''}
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <div class="comment-actions">
                    <button onclick="likeComment('${comment._id}')" 
                        ${!currentUser ? 'disabled' : ''}
                        class="${userLiked ? 'liked' : ''}">
                        ${userLiked ? '❤️' : '🤍'} ${comment.likes?.length || 0}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Like Post
async function likePost() {
    if (!currentUser) {
        showToast('Please login to like posts', 'error');
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
            await loadPost();
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to like post', 'error');
        }
    } catch (error) {
        console.error('Error liking post:', error);
        showToast('Error liking post', 'error');
    }
}

// React to Post
async function reactToPost(type) {
    if (!currentUser) {
        showToast('Please login to react', 'error');
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
            await loadPost();
        }
    } catch (error) {
        console.error('Error reacting to post:', error);
    }
}

// Add Comment
async function addComment() {
    if (!currentUser) {
        showToast('Please login to comment', 'error');
        return;
    }

    const input = document.getElementById('commentInput');
    const text = input.value.trim();

    if (!text) {
        showToast('Comment cannot be empty', 'error');
        return;
    }

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
            await loadPost();
            showToast('Comment added!', 'success');
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to add comment', 'error');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showToast('Error adding comment', 'error');
    }
}

// Like Comment
async function likeComment(commentId) {
    if (!currentUser) {
        showToast('Please login to like comments', 'error');
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
            await loadPost();
        }
    } catch (error) {
        console.error('Error liking comment:', error);
    }
}

// Delete Comment
function deleteComment(commentId) {
    if (!currentUser) {
        showToast('Please login to delete comments', 'error');
        return;
    }

    const comment = currentPost.comments.find(c => c._id === commentId);
    if (!comment) {
        console.error('Comment not found:', commentId);
        showToast('Comment not found', 'error');
        return;
    }

    currentDeletingCommentId = commentId;
    
    const commentTextElement = document.getElementById('deleteCommentText');
    if (commentTextElement) {
        commentTextElement.textContent = comment.text;
    }
    
    const modal = document.getElementById('deleteCommentModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Confirm Delete Comment
async function confirmDeleteComment() {
    if (!currentDeletingCommentId) return;

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments/${currentDeletingCommentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            showToast('Comment deleted successfully!', 'success');
            closeDeleteCommentModal();
            await loadPost();
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to delete comment', 'error');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast('Error deleting comment', 'error');
    }
}

// Edit Post - with image support
function editPost() {
    document.getElementById('editPostTitle').value = currentPost.title;
    document.getElementById('editPostContent').value = currentPost.content;
    document.getElementById('editPostTags').value = currentPost.tags?.join(', ') || '';
    
    // Show current image if exists
    const currentImageSection = document.getElementById('currentImageSection');
    const currentPostImage = document.getElementById('currentPostImage');
    
    if (currentPost.image) {
        currentPostImage.src = `${API_URL}${currentPost.image}`;
        currentImageSection.style.display = 'block';
    } else {
        currentImageSection.style.display = 'none';
    }
    
    document.getElementById('editPostModal').classList.add('show');
}

// Handle Edit Post Form - with FormData for image
document.getElementById('editPostForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('editPostTitle').value.trim();
    const content = document.getElementById('editPostContent').value.trim();
    const tagsInput = document.getElementById('editPostTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
    
    const newImageInput = document.getElementById('editPostImage');
    const removeImageCheckbox = document.getElementById('removeImageCheckbox');

    // Use FormData for image upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('tags', JSON.stringify(tags));
    
    // Handle image
    if (newImageInput.files[0]) {
        formData.append('image', newImageInput.files[0]);
    } else if (removeImageCheckbox && removeImageCheckbox.checked) {
        formData.append('removeImage', 'true');
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
                // Don't set Content-Type for FormData
            },
            body: formData
        });

        if (response.ok) {
            showToast('Post updated successfully!', 'success');
            closeEditModal();
            await loadPost();
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to update post', 'error');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showToast('Error updating post', 'error');
    }
});

// Delete Post
function deletePost() {
    document.getElementById('deleteModal').classList.add('show');
}

// Confirm Delete Post
async function confirmDelete() {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });

        if (response.ok) {
            showToast('Post deleted successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        showToast('Error deleting post', 'error');
    }
}

// Modal Functions
function setupModalListeners() {
    window.addEventListener('click', (e) => {
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
}

function closeEditModal() {
    document.getElementById('editPostModal').classList.remove('show');
    document.getElementById('editPostImage').value = '';
    document.getElementById('removeImageCheckbox').checked = false;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
}

function closeDeleteCommentModal() {
    document.getElementById('deleteCommentModal').classList.remove('show');
    currentDeletingCommentId = null;
}

// Search by tag
function searchByTag(tag) {
    window.location.href = `search.html?tag=${encodeURIComponent(tag)}`;
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