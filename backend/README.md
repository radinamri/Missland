# NANA-AI: Backend
This directory contains the Django backend for the NANA-AI application. It provides a RESTful API to handle user authentication, post management, and the recommendation engine.

## Prerequisites
Before you begin, ensure you have the following installed on your system:

`Python (v3.10 or later)`

`Git`

## Getting Started

Follow these steps to get the backend development environment set up and running.

## 1. Navigate to the Backend Directory

From the root of the project, navigate into this backend directory:

`cd backend`

## 2. Create and Activate Virtual Environment

It's a best practice to use a virtual environment to manage project-specific dependencies.

### Create the virtual environment
`python3 -m venv venv`

### Activate it (for macOS/Linux)
`source venv/bin/activate`

### For Windows, use:
`venv\Scripts\activate`

## 3. Install Dependencies
Install all the required Python packages from the requirements.txt file.

`pip install -r requirements.txt`

## 4. Set Up the Database
Run the database migrations to create all the necessary tables.

`python manage.py migrate`

## 5. Create a Superuser
To access the Django Admin panel, you'll need a superuser account.

`python manage.py createsuperuser`

Follow the prompts to create your admin user.

## Configuration
The application requires several API keys to function correctly. These are configured in the backend/config/settings.py file.

For development, you can add them directly to the file. For production, it is strongly recommended to use environment variables.

Required Keys:

`PEXELS_API_KEY: Your API key from the Pexels website.`

`GOOGLE_CLIENT_ID: Your OAuth Client ID from the Google Cloud Console.`

`GOOGLE_CLIENT_SECRET: Your OAuth Client Secret from the Google Cloud Console.`

## Running the Development Server
Once the setup is complete, you can run the backend server:

`python manage.py runserver`

The API will be available at http://localhost:8000.

## Custom Management Commands
This project includes custom commands to populate the database with sample data for testing.

### Seed Posts: To populate the database with sample posts.

`python manage.py seed_posts`

### Seed Articles: To populate the database with sample articles.

`python manage.py seed_articles`
