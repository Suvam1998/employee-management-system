# EMS API Documentation

Base URL: `http://localhost:5000/api`

All responses are JSON with the shape `{ success: boolean, ... }`. Errors return
`{ success: false, message: string, details?: [{ field, message }] }`.

## Authentication

Authentication uses a JWT delivered two ways:

- **httpOnly cookie** `ems_token` (set on login, used automatically by the browser).
- **`Authorization: Bearer <token>`** header (the login response also returns the raw
  token so non-browser clients / the frontend fallback can use it).

Protected routes accept either. Roles: `super_admin`, `hr`, `employee`.

---

### POST /api/auth/login
Authenticate and receive a token + cookie.

**Body**
```json
{ "email": "admin@ems.com", "password": "Admin@123" }
```
**200**
```json
{ "success": true, "token": "<jwt>", "user": { "_id": "...", "name": "Super Admin", "role": "super_admin", ... } }
```
**401** — invalid credentials.

### POST /api/auth/logout
Clears the auth cookie. **200** `{ "success": true, "message": "Logged out" }`

### GET /api/auth/me
Returns the current authenticated user. **Auth required.**

---

## Employees

> `stats`, listing, create, import and delete are restricted (see each route).
> Employees may only read/edit **their own** record.

### GET /api/employees
List with search, filter, sort, pagination. **Roles: super_admin, hr.**

**Query params**
| Param | Values | Notes |
|-------|--------|-------|
| `search` | string | matches name, email, employeeId (case-insensitive) |
| `department` | string | exact match |
| `role` | `super_admin` \| `hr` \| `employee` | |
| `status` | `active` \| `inactive` | |
| `sortBy` | `name` \| `joiningDate` \| `createdAt` \| `salary` | default `createdAt` |
| `order` | `asc` \| `desc` | default `desc` |
| `page` | int ≥ 1 | default 1 |
| `limit` | int 1–100 | default 10 |

**200**
```json
{
  "success": true,
  "data": [ { "_id": "...", "name": "...", "reportingManager": { "_id": "...", "name": "..." }, ... } ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

### GET /api/employees/stats
Dashboard metrics. **Roles: super_admin, hr.**
```json
{
  "success": true,
  "data": {
    "totalEmployees": 42, "activeEmployees": 38, "inactiveEmployees": 4, "departmentCount": 5,
    "byDepartment": [ { "department": "Engineering", "count": 12 } ],
    "byRole": [ { "role": "employee", "count": 39 } ]
  }
}
```

### GET /api/employees/:id
Fetch one employee. Employees can only fetch their own id (else **403**).

### POST /api/employees
Create an employee. **Roles: super_admin, hr.** HR **cannot** set `role: super_admin` (**403**).
Accepts JSON or `multipart/form-data` (for `profileImage`). `employeeId` auto-generated if omitted.
Default password `Password@123` if none provided.

**Body**
```json
{
  "name": "Jane Doe", "email": "jane@ems.com", "phone": "+1 555 1234",
  "department": "Engineering", "designation": "Engineer", "salary": 90000,
  "joiningDate": "2023-05-01", "status": "active", "role": "employee",
  "reportingManager": "<employeeId|null>", "password": "optional"
}
```
**201** `{ "success": true, "data": { ...employee } }`

### PUT /api/employees/:id
Update an employee.
- **Employee** role: may update only `name`, `phone`, `profileImage`, `password` on **own** record; other fields are ignored.
- **HR**: cannot promote to `super_admin` and cannot modify a `super_admin` (**403**).
- Changing `reportingManager` runs **circular-reporting detection** → **400** if it would create a cycle.

### DELETE /api/employees/:id
**Soft delete** (sets `isDeleted: true`). **Role: super_admin only.** Direct reports are detached
(their `reportingManager` set to null). Cannot delete your own account (**400**).

### POST /api/employees/import
Bulk CSV import. **Roles: super_admin, hr.** `multipart/form-data` with field `file`.
CSV headers: `name,email,phone,department,designation,salary,joiningDate,status,role,password,employeeId`.
Returns `{ created, failed, errors: [{ row, error }] }`.

---

## Organization / Hierarchy

### GET /api/organization/tree
Full reporting tree. Roots are employees with no manager. **Roles: super_admin, hr.**
```json
{ "success": true, "data": [ { "_id": "...", "name": "...", "reports": [ { ..., "reports": [] } ] } ] }
```

### GET /api/employees/:id/reportees
Direct reports of an employee. **Auth required.**
```json
{ "success": true, "data": { "manager": { "_id": "...", "name": "..." }, "reportees": [ { ... } ] } }
```

### PATCH /api/employees/:id/manager
Assign / change reporting manager. **Roles: super_admin, hr.**
**Body** `{ "reportingManager": "<employeeId>" | null }`
Rejects assignments that create a cycle (self or descendant) → **400**.

---

## Misc

### GET /api/health
`{ "success": true, "status": "ok", "uptime": 123.4 }`

## Status codes
| Code | Meaning |
|------|---------|
| 200 / 201 | success |
| 400 | validation error / cycle / bad input |
| 401 | not authenticated |
| 403 | authenticated but not allowed (RBAC) |
| 404 | not found |
| 409 | duplicate (email / employeeId) |
