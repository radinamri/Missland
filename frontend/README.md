# NANA-AI: Frontend

This directory contains the Next.js frontend for the NANA-AI application. It provides a modern, responsive user interface for exploring styles, managing a user profile, and interacting with the backend API.

## Prerequisites
Before you begin, ensure you have the following installed on your system:

`Node.js (v18 or later)`

`Git`

## Getting Started
Follow these steps to get the frontend development environment set up and running.

### 1. Navigate to the Frontend Directory
From the root of the project, navigate into this frontend directory:

`cd frontend`

### 2. Install Dependencies
Install all the required Node.js packages using npm. This will create a node_modules folder with all the necessary libraries.

`npm install`

### 3. Configure Environment Variables
The frontend requires environment variables to connect to the backend API and Google's authentication service.

In the frontend directory, create a new file named .env.local and add the following lines. Remember to replace the placeholder values with your actual keys.

The full URL of your running Django backend
`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

Your OAuth Client ID from the Google Cloud Console
`NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE`

## Running the Development Server
Once the setup is complete, you can start the Next.js development server.

`npm run dev`

The application will now be available in your browser at http://localhost:3000. The page will automatically update as you edit the code.

Note: For the application to function correctly, the Django backend server must also be running.

## Key Technologies
`Next.js: The core React framework.`

`TypeScript: For type safety and a better development experience.`

`Tailwind CSS: For styling the user interface.`

`Axios: For making requests to the backend API.`

`React Context API: For managing global state like authentication and search.`

`@react-oauth/google: For handling the Google login flow on the client side.`
