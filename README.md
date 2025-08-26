# Employee Management System

_A compact React app prepared for the interview review. This README is tailored for evaluators to run, review, and test the project locally or directly in CodeSandbox._

---

## Links
- **GitHub Repository:** https://github.com/nbadoni7/employee-management-system
- **CodeSandbox Workspace:** A shareable link is provided with the submission. The workspace includes preconfigured **Tasks** (\`dev\` & \`test\`) and a **Preview** entry for quick validation.

> If your corporate network blocks local ports, use the CodeSandbox workspace to run the app and tests entirely in the browser.

---

## Tech Stack
- **React 18.x**
- **TypeScript**
- **Material UI 7.x**
- **Redux Toolkit** + **RTK Query**
- **Zod** (form validation)
- **Jest** + **@testing-library/react** (unit/integration tests)
- **Vite** for dev/test

> Package scripts use **npm**.

---

## Quick Start (Local)

### Prerequisites
- **Node.js 18+** (LTS recommended) and **npm 9+**
- macOS, Linux, or Windows

### 1) Clone and install
```bash
git clone https://github.com/nbadoni7/employee-management-system.git
cd employee-management-system
npm install
```

### 2) Start the dev server
```bash
npm run dev
```
- Vite serves the app on **http://localhost:5173** by default.

### 3) Run the test suite
```bash
npm test
```
- For coverage (CI-style):
```bash
npm test -- --coverage
```

---

## Running in CodeSandbox (No Local Setup Required)
1. Open the shared **CodeSandbox** link.
2. In the left sidebar, open **“CODESANDBOX: DEVTOOLS.”**
3. Under **Tasks**:
   - Click **`dev`** → this starts the Vite dev server.
   - Click **`test`** → this runs the Jest test runner 
   - **Note**: This task works only in Devbox workspaces (not in the default Sandbox). To execute tests, either convert your workspace to Devbox or run them locally.
4. Under **Previews**, choose **`5173  dev`** to open the running app in a new tab/pane.

> The screenshot in the submission shows **Tasks → dev (Running…)** and **Previews → 5173 dev**. Tests can be started/stopped independently via the **`test`** task.

---

## NPM Scripts
| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server (HMR) on port **5173** |
| `npm test` | Run the Jest test suite (watch mode in local terminals) |
| `npm test -- --coverage` | Generate coverage report for CI/review |

---

## Application Overview
- **Domain:** Employees CRUD (list, create, update, delete)
- **State Management:** Redux Toolkit slices with **RTK Query** for data fetching & cache invalidation
- **UI:** React components structured for testability

> The service layer points to a REST endpoint for **employees**. For interview review, a mock/public API (e.g., MockAPI) is typically configured in code; no secrets are required.

---

## Backend API (MockAPI)

> The app uses a public **MockAPI** backend so reviewers can exercise full CRUD without any private credentials.

- **Base URL:** `https://68a980b7b115e67576eb4f13.mockapi.io/api/v1`
- **Resource:** `employee`
- **Schema fields:** `id, first_name, last_name, email_address, phone_number, gender, date_of_birth, joined_date, created_date, updated_date`
- **Endpoints:**
  - `GET /employee` – list all employees
  - `GET /employee/:id` – fetch one
  - `POST /employee` – create
  - `PUT /employee/:id` – full update
  - `PATCH /employee/:id` – partial update
  - `DELETE /employee/:id` – delete

**Where configured in code**
- `src/features/employees/services/employeesApi.ts` – RTK Query endpoints and the API base URL.

**Quick curl tests** (optional)
```bash
# List
curl -X GET "https://68a980b7b115e67576eb4f13.mockapi.io/api/v1/employee" -H "accept: application/json"

# Create
curl -X POST "https://68a980b7b115e67576eb4f13.mockapi.io/api/v1/employee" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Neeti",
    "last_name": "Thapliyal",
    "email_address": "neeti@example.com",
    "phone_number": "+65 9123 4567",
    "gender": "Female",
    "date_of_birth": "1990-05-20",
    "joined_date": "2020-07-15"
  }'

# Update (replace :id)
curl -X PUT "https://68a980b7b115e67576eb4f13.mockapi.io/api/v1/employee/9" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "UpdatedName",
    "last_name": "UpdatedLast",
    "email_address": "updated@example.com",
    "phone_number": "+65 9876 5432",
    "gender": "Female",
    "date_of_birth": "1992-03-10",
    "joined_date": "2021-01-01"
  }'

# Partial update
curl -X PATCH "https://68a980b7b115e67576eb4f13.mockapi.io/api/v1/employee/9" \
  -H "Content-Type: application/json" \
  -d '{ "phone_number": "+65 9000 1111" }'

# Delete
curl -X DELETE "https://68a980b7b115e67576eb4f13.mockapi.io/api/v1/employee/9"
```

---

## Reviewer’s Guide (Functional Walkthrough)
1. **Open the app** (locally or via CodeSandbox Preview `5173 dev`).
2. **View Employees**: A list is fetched from the REST endpoint.
3. **Create / Edit / Delete**: Use the provided UI to add, update, or remove an employee. Deletions trigger RTK Query cache invalidation and a refetch of the list.
4. **Run Tests**: Start the **`test`** task in CodeSandbox or `npm test` locally. Expect unit/integration tests around the employees API logic (including delete/refetch behavior).
5. **(Optional) Inspect Code**: Look at API hooks (RTK Query), Redux slices, and components to see separation of concerns.

---

## Project Structure (at a glance)
```
employee-management-system/
├─ src/
│  ├─ app/
│  │  └─ store.ts
│  ├─ components/
│  │  └─ ConfirmDialog.tsx
│  ├─ features/
│  │  └─ employees/
│  │     ├─ components/
│  │     │  ├─ EmployeeForm.tsx
│  │     │  ├─ EmployeeTable.tsx
│  │     │  ├─ EmployeeFormPage.tsx
│  │     │  └─ EmployeeListPage.tsx
│  │     ├─ hooks/
│  │     │  └─ useUnsavedChangesPrompt.ts
│  │     ├─ schema/
│  │     │  └─ employeeSchema.ts
│  │     ├─ services/
│  │     │  └─ employeesApi.ts
│  │     ├─ utils/
│  │     │  └─ phone.ts
│  │     └─ types.ts
│  ├─ App.tsx
│  ├─ index.tsx
│  ├─ styles.css
│  ├─ theme.ts
│  └─ vite-env.d.ts
├─ test/
│  ├─ ConfirmDialog.test.tsx
│  ├─ EmployeeForm.test.tsx
│  ├─ EmployeeFormPage.test.tsx
│  ├─ EmployeeListPage.test.tsx
│  ├─ employeesApi.test.ts
│  ├─ EmployeeTable.test.tsx
│  ├─ phone.test.ts
│  └─ useUnsavedChangesPrompt.test.tsx
├─ index.html
├─ babel.config.cjs
├─ eslint.config.js
├─ jest.config.cjs
├─ jest.setup.ts
├─ tsconfig.json
├─ tsconfig.app.json
├─ vite.config.ts
├─ package.json
├─ package-lock.json
├─ LICENSE
└─ README.md
```

---

## Configuration & Environment
- No authentication or secrets needed for interview review.
- Corporate proxies/firewalls: If local `5173`/`4173` ports are restricted, use the **CodeSandbox** workspace.

---

## Troubleshooting
- **Port already in use**: Change the port in Vite config or stop the conflicting process.
- **Install issues**: Clear lockfile and modules, then reinstall
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- **Corporate network restrictions**: Prefer the provided **CodeSandbox** workspace.

---

## Notes for the Reviewers
- The project demonstrates a clean RTK Query data flow with cache invalidation on write operations and corresponding test coverage.
- The CodeSandbox workspace is preconfigured to reduce setup time—open `dev` (Preview on 5173) and `test` tasks to validate functionality and tests quickly.

---

## Author
**Neeti Akhilesh Thapliyal**  
GitHub: **@nbadoni7**

