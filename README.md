# Advanced Databases (NoSQL) – Final Project

## Project Overview
This project is a full-stack web application developed as a final assessment for the **Advanced Databases (NoSQL)** course.  
The application demonstrates the use of **MongoDB** as a NoSQL database, advanced data modeling techniques, aggregation pipelines, authentication, and RESTful API development.

The system allows users to register, authenticate, create posts, interact with posts and comments, and view user profiles.

---

## Tech Stack
**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer (file uploads)

**Frontend:**
- HTML
- CSS
- JavaScript (Vanilla JS)

**Tools:**
- Postman (API testing)
- GitHub (version control)

---

## Main Features
- User authentication and authorization (JWT)
- Role-based user registration
- Create, read, update, and delete posts
- Embedded comments and reactions
- Likes and reactions on posts and comments
- Search posts by tags
- User profile pages
- Analytics endpoints using MongoDB aggregation

---
project-root/

│
├── controllers/
│ ├── auth.controller.js
│ ├── post.controller.js
│ ├── user.controller.js
│ └── analytics.controller.js
│
├── routes/
│ ├── auth.routes.js
│ ├── post.routes.js
│ ├── user.routes.js
│ └── analytics.routes.js
│
├── models/
│ ├── User.js
│ └── Post.js
│
├── middleware/
│ ├── auth.middleware.js
│ └── upload.middleware.js
│
├── front-end/
│ └── frontend files
│
├── app.js
├── package.json
└── README.md


---

## REST API Overview

### Authentication
- `POST /auth/register` – Register a new user
- `POST /auth/login` – User login

### Posts
- `POST /posts` – Create a post
- `GET /posts` – Get all posts
- `GET /posts/:id` – Get post by ID
- `PUT /posts/:id` – Update a post
- `DELETE /posts/:id` – Delete a post
- `POST /posts/:id/comments` – Add comment
- `DELETE /posts/:postId/comments/:commentId` – Delete comment
- `PUT /posts/:id/like` – Like a post
- `PUT /posts/:id/react` – React to a post

### Users
- `GET /users/me` – Get current user profile
- `GET /users/:id` – Get user profile
- `GET /users/:id/posts` – Get posts by user

### Analytics
- `GET /analytics/top-posts` – Get most popular posts
- `GET /analytics/posts-per-user` – Count posts per user

---

## Database Design
The project uses a hybrid NoSQL data model:
- **Users** are stored in a separate collection.
- **Posts** reference users by ID.
- **Comments** are embedded inside posts to optimize read operations.

This approach reduces the need for joins and improves performance.

---

## Authentication & Security
- JWT-based authentication
- Protected routes using middleware
- Authorization checks to ensure users can only modify their own content

---

## Indexing & Performance Optimization
Indexes are created on frequently queried fields such as:
- user identifiers
- post creation dates
- tags
- compound fields for optimized sorting and filtering

These indexes improve query performance and scalability.

---
