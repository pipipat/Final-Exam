# How to Test the App

**CourseHub - Online Course Service**

Built from the provided examination starter repository. The original `next-backend/` (Next.js API) and `react-frontend/` (React + Vite) structure is retained.

## Student Information

- **Student Name:** Napatra Hanwari
- **Student ID:** 6711232

## Test Credentials

Sign in with either a username or an email address. All six accounts below are created by the seed script.

| Role | Username | Email | Password |
| --- | --- | --- | --- |
| Student | student1 | student1@example.com | Course123! |
| Student | student2 | student2@example.com | Course123! |
| Student | student3 | student3@example.com | Course123! |
| Teacher | teacher1 | teacher1@example.com | Course123! |
| Teacher | teacher2 | teacher2@example.com | Course123! |
| Teacher | teacher3 | teacher3@example.com | Course123! |

Passwords are stored as bcrypt hashes. Re-running the seed script preserves existing accounts and does not delete courses or enrollments. It does not reset the password of an account that already exists.

## Prerequisites

- Node.js 22.12+ and npm.
- Git.
- Docker Desktop, running, for the local MongoDB setup below.
- A modern web browser.
- For deployment: a MongoDB Atlas database and two Vercel projects, one for each application directory.

## How to Run & Test

### 1. Backend Setup (`next-backend/`)

Open a terminal in the repository root.

**Start MongoDB on the first run:**

```bash
docker run -d \
  --name wad-final-mongo \
  -p 127.0.0.1:27018:27017 \
  -v wad-final-mongo-data:/data/db \
  mongo:8.0
```

If this container already exists, start it instead:

```bash
docker start wad-final-mongo
```

Confirm that its status is `Up`:

```bash
docker ps
```

**Install the backend dependencies:**

```bash
cd next-backend
npm ci
```

Create `next-backend/.env.local`, beside its `package.json`:

```env
MONGODB_URI=mongodb://127.0.0.1:27018/online_course
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET
FRONTEND_URL=http://localhost:5173
```

Generate a secret, then replace `REPLACE_WITH_A_RANDOM_SECRET` with the output:

```bash
openssl rand -hex 32
```

**Create the six test accounts and start the API:**

```bash
node --env-file=.env.local scripts/seed.mjs
npm run dev
```

Keep this terminal running. The local backend URL is `http://localhost:3000`. Ensure port 3000 is available so it matches the frontend configuration.

The seed script creates users only. To test from a fresh database, create courses using a Teacher account in the frontend.

### 2. Frontend Setup (`react-frontend/`)

Open another terminal in the repository root:

```bash
cd react-frontend
npm ci
```

Create `react-frontend/.env.local`, beside its `package.json`:

```env
VITE_API_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`. Routes use the starter project's `HashRouter`, for example `http://localhost:5173/#/login`.

The frontend uses port 5173 with `strictPort: true`. If this port is occupied, stop the previous frontend process before starting it again. Restart an application's development server after changing its environment file.

### 3. Testing Walkthrough

**A. Authentication and roles**

1. Open the frontend while signed out. Protected pages should redirect to Sign in.
2. Enter an incorrect password. An error message should appear.
3. Sign in as `teacher1@example.com` using `Course123!`. The app should display My courses.
4. Refresh the browser. The user should remain signed in.
5. Sign out, then sign in as `student1@example.com`. The app should display Explore courses and the My learning menu.
6. A Student cannot access the Teacher create/edit pages. Teacher access is also checked by the backend APIs.

**B. Teacher course management**

1. Sign in as Teacher 1 and select **Create course**.
2. Enter a course name, duration in days, topics, price, Max Student, and status. Example: `Web Fundamentals`, 5 days, `JavaScript, React`, price 500, Max Student 1, status Open.
3. Save. The app should open the new course details.
4. Select **Edit course**, change the name or price, and save. The details should show the new values.
5. The Teacher course list contains only that Teacher's courses, including Open, Close, and Cancel courses.
6. Sign in as Teacher 2. Teacher 1's courses must not appear. Opening a Teacher 1 course URL directly returns a permission error from the API.

**C. Student discovery and enrollment**

1. Sign in as Student 1. Search by part of the course name, then search by the Teacher's username (for example `teacher1`). Search is case-insensitive.
2. Open an Open course with an available seat and select **Enroll in this course**.
3. The page should confirm enrollment. The course should also appear under **My learning**.
4. The same Student cannot enroll again. The backend rejects duplicate enrollment with HTTP 409.
5. If the course has Max Student 1, sign in as Student 2. The course must show as full, and the backend must reject another enrollment.
6. Teacher accounts cannot enroll; the enrollment API rejects them with HTTP 403.

**D. Course status rules**

1. As the course owner, edit a course to **Close**. Ensure it has an available seat so this test is independent of capacity.
2. As a Student, confirm that the course is still visible, but enrollment is disabled. The API also rejects enrollment.
3. As the owner, change the status to **Cancel**.
4. As a Student, the course must disappear from course lists. Direct detail and enrollment requests return HTTP 404.
5. The Teacher owner can still view and edit the Cancel course, including its enrolled Students.
6. Change it back to **Open** to make it visible and available for enrollment again if seats remain.

**E. Enrolled Students, deletion, and capacity**

1. Sign in as the Teacher owner and open an enrolled course. Its details must list the enrolled Students' usernames and emails.
2. Deletion is disabled for courses with enrolled Students. Direct DELETE requests are also rejected with HTTP 409.
3. Create a separate course without any enrollment, then delete it and accept the confirmation. It should disappear from My courses.
4. Max Student cannot be reduced below the current enrollment count. Both the form and backend enforce this restriction.

## API Reference

All endpoints below require authentication except Login and Logout. CORS OPTIONS requests are handled before authentication.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Sign in with `identifier` and `password`; set an HttpOnly JWT cookie |
| POST | `/api/auth/logout` | Clear the authentication cookie |
| GET | `/api/auth/me` | Return the current user's public account details |
| GET | `/api/course` | Teacher: own courses; Student: courses excluding Cancel |
| GET | `/api/course?search=term` | Filter by part of the course or Teacher name |
| GET | `/api/course?mine=true` | Student's enrolled courses, excluding Cancel |
| POST | `/api/course` | Teacher creates a course |
| GET | `/api/course/:id` | Course details; Teacher owner also receives enrolled Students |
| PUT | `/api/course/:id` | Teacher owner updates all editable course fields |
| DELETE | `/api/course/:id` | Teacher owner deletes a course with no enrollment |
| POST | `/api/course/:id/enroll` | Student enrolls in an Open course with a free seat |

A create/update request uses the following field names:

```json
{
  "name": "Web Fundamentals",
  "duration": 5,
  "topics": ["JavaScript", "React"],
  "price": 500,
  "maxStudents": 10,
  "status": "Open"
}
```

Ownership comes from the authenticated user, not from a client-provided Teacher ID. Course status, capacity, and duplicate-enrollment restrictions are checked in the MongoDB update filter. Students cannot view other Students' enrollment identities through course responses.

## Build and Lint

From the repository root, check each application separately:

```bash
cd next-backend
npm run lint
npm run build
```

In another terminal at the repository root:

```bash
cd react-frontend
npm run lint
npm run build
```

## Deployment and Submission

Deployment links will be added after deployment is completed and verified.

- **Backend source code:** [ADD YOUR REPOSITORY OR BACKEND DIRECTORY URL]
- **Frontend source code:** [ADD YOUR REPOSITORY OR FRONTEND DIRECTORY URL]
- **Deployed Backend URL:** [ADD AFTER DEPLOYMENT]
- **Deployed Frontend URL:** [ADD AFTER DEPLOYMENT]
- **Screen recording URL:** [ADD YOUR RECORDING LINK]

Deploy the two existing directories as separate Vercel projects. The deployed backend needs a reachable MongoDB Atlas URI in `MONGODB_URI`, a `JWT_SECRET`, and the deployed frontend origin in `FRONTEND_URL`. A Docker database bound to the developer's localhost is for local testing.

The deployed frontend must be configured to communicate with the backend and preserve authentication cookies. Verify login, course management, enrollment, and logout on the deployed URLs before submission. The final deployment configuration and URLs will be documented here when verified.

Environment files are ignored by Git. Keep real JWT secrets and database connection credentials out of the repository and this README.
