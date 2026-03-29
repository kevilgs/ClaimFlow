# ClaimFlow

ClaimFlow is an expense reimbursement portal designed for team expense management. It includes OCR receipt scanning, sequential approval workflows, and automated email notifications.

## Key Features

- OCR Scanning: Extract amounts, dates, and categories from receipt images.
- Approval Rules: Admins can create sequential approval steps for expenses.
- Role-based Dashboards: Tailored views for Admins, Managers, and Employees.
- Email Notifications: Automated welcome emails and password reset tokens.
- Sequential Workflows: Enforces approval paths and percentage-based thresholds.

## Tech Stack

- Frontend: React 19, Tailwind CSS v4, Shadcn UI, Lucide Icons.
- Backend: Node.js, Express.
- Database: PostgreSQL with Drizzle ORM.
- OCR: Tesseract.js.
- Auth/Email: JWT, Nodemailer.

## Local Setup

### 1. Database Setup
Ensure you have PostgreSQL running. Create a database named odoo_db.

### 2. Backend Setup
cd backend
npm install

Create a .env file in the backend folder:
DATABASE_URL=postgresql://postgres:password@localhost:5432/odoo_db
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
FRONTEND_URL=http://localhost:5173

Run migrations:
npx drizzle-kit push

Start the server:
npm run dev

### 3. Frontend Setup
cd frontend
npm install
npm run dev

The application will be available at http://localhost:5173.

## Usage Guide

1. Admin: Create a new company or user. The user will receive a welcome email with a temporary password.
2. Setup Rules: Go to the Admin Dashboard > Approval Rules to define the path an expense must take.
3. Employee: Submit an expense. You can upload a receipt to let the OCR fill out the details.
4. Manager: View pending approvals in your dashboard. Sequential rules ensure expenses only appear when it is your turn to approve.
