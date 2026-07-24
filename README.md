# CampusBorrow App
What is it:
CampusBorrow lets college students lend and borrow items they only need short-term textbooks, calculators, school supplies, sports gear, dorm supplies. Lenders earn money on items that would otherwise sit unused; borrowers save money by renting instead of buying. Scoping it to a single campus adds built-in trust and lets us add campus-specific perks like filtering by dorm/building or course code.

How it Works: 
Users register on the system and can act as a lender, a borrower, or both. Lenders list items they want to rent out, including a photo, category, price, and description, and can mark an item Available or Unavailable at any time. Borrowers search and filter listings, request an item, and coordinate pickup with the lender. Once a loan is complete, both sides rate and review each other, building a reputation score that helps future users decide who to trust.

The Project:

User Authentication: Users register and log in with an email/password combination. 
User Profiling: Each user has a profile with name, photo, campus location, bio, and an aggregate rating as both lender and borrower, editable by the user.
Basic Pages / Postings: Lenders can create, update, and delete their own item listings. Any user can browse and view listings.
Rating and Commenting: After each borrow, both sides rate and review one another.
Database: MongoDB with Mongoose. Core collections: Users, Listings, Borrows, Reviews.
Search Function: Keyword search over listing title/description/category, plus filters for category, price, availability, and rating.
Recommendation System: A 'Similar Items' panel on each listing surfaces items in the same category/price range/campus zone, and the homepage feed ranks listings using a weighted score based on the user's past borrows, listing recency, and lender rating.
Security: The system sanitizes and encodes all user-generated content to prevent Cross-Site Scripting, documented in the final report.
Extra Feature: A lightweight booking system lets borrowers request specific pickup/return dates, with a simple in-app message thread per request for coordinating hand-off.


Front-End Pages
Browse, Item Detail with reviews, similar items, and borrow requests, Login/Register, Create/Edit Listing, and Profile. Hand-drawn mockups of each page are attached as an appendix.

Team Member Primary Responsibility
Jared: Backend/API), database schema
Karl:  Frontend , search/filter UI, recommendation logic

Both of us will contribute to testing, security hardening, and the final report.

## Setup Instructions

### Backend
1. Open the backend folder:
   cd backend

2. Install dependencies:
   npm install

3. Create a .env file with:
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=3001

4. Start the backend:
   node server.js

### Frontend
1. Open the frontend folder:
   cd frontend

2. Install dependencies:
   npm install

3. Start the frontend:
   npm start

The frontend runs on http://localhost:3000.
The backend runs on http://localhost:3001.
