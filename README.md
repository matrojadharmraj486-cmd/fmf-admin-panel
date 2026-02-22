FMF Admin Panel (React + Vite)
================================

Requirements
------------
- Node.js LTS

Setup
-----
1. Copy .env.example to .env and set VITE_API_BASE_URL.
2. Install dependencies:
   npm install
3. Run development server:
   npm run dev
4. Build for production:
   npm run build

Folder Structure
----------------
- src/pages: App pages
- src/routes: Router and route guards
- src/shared: Layout and shared UI
- src/context: Auth provider
- src/services: Axios instance and storage
- src/assets: Static assets

Backend Integration
-------------------
- Configure VITE_API_BASE_URL.
- Use api from src/services/api.js for requests.

