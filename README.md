# API-Node-js

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////


READMe:  

This is a simple Node.js application that uses the Express framework to create an HTTP server. It serves static files from a "public" folder and uses Express to handle HTTP requests and responses, as well as the body-parser middleware for parsing request.


clinica-turnos-api/
│
├── 📁src/
│   ├── config/           # Configuración general (db, cors, etc)
│   ├── controllers/      # Lógica de cada endpoint
│   ├── routes/           # Rutas agrupadas por entidad
│   ├── middlewares/      # Middlewares personalizados (auth, error)
│   ├── models/           # Modelos (Mongoose, Sequelize, etc)
│   ├── services/         # Lógica de negocio y utilidades
│   ├── utils/            # Funciones auxiliares
│   └── app.js            # Configuración principal de Express
│
├── .env
├── .gitignore
├── package.json
└── server.js             # Punto de entrada




////////////////////////////////////////////////
////////////////////////////////////////////////

## REAL STATE WEB APP CON CHAT P2P


**Project Documentation: Agribusiness Budget and Forecast System**

---

## 📁 /docs Structure

```
/docs
│
├── database_schema.md          # ER model and DB relationships
├── api_endpoints.md            # API route specifications
├── frontend_structure.md       # Folder tree and UI components
├── backend_structure.md        # Folder tree and architecture for backend
└── README.md                   # Index of documentation
```

---

### 📄 database\_schema

#### 🗂️ Entities and Relationships (PostgreSQL)

* **users** (id, name, email, password, role\_id)
* **roles** (id, name) → e.g., "Analyst", "Commercial", "Manager"
* **objects** (id, name, zone, regional, bp, tax\_type)
* **versions** (id, name, start\_date, end\_date, status)
* **periods** (id, month, year)
* **item\_values** (id, object\_id, period\_id, value, version\_id, created\_by)
* **approvals** (id, version\_id, approved\_by, approved\_at, status)

**Relations:**

* One user → one role
* One object → many item\_values
* One version → many item\_values
* One version → one approval flow

---

### 📄 api\_endpoints

#### 🔐 Auth

* `POST /api/login` → User login (JWT)
* `GET /api/me` → Get current session data

#### 👤 Users & Roles

* `GET /api/users` → List users (admin only)
* `POST /api/users` → Create new user
* `GET /api/roles` → List available roles

#### 📦 Objects

* `GET /api/objects` → Get budgetable objects
* `POST /api/objects` → Create new object

#### 📆 Versions & Periods

* `GET /api/versions` → List versions
* `POST /api/versions` → Create version
* `GET /api/periods` → Available periods

#### 📊 Values

* `GET /api/values` → Get values by object/version/period
* `POST /api/values` → Insert or update value

#### ✅ Approvals

* `GET /api/approvals` → Approval history
* `POST /api/approvals` → Approve version

---

### 📄 frontend\_structure

#### 📁 Folder Tree (React 17 + Redux)

```
src/
├── components/          # Reusable UI components
│   ├── Stepper/
│   ├── ExcelGrid/
│   └── FormInputs/
├── pages/               # Login, Dashboard, Approval views
├── redux/               # Store, reducers, actions
├── routes/              # react-router-dom v5 setup
├── services/            # Axios HTTP services
├── styles/              # Sass, Less, styled-components
└── App.js
```

#### 🧩 Core Components

* `StepperForm`: for object creation flow
* `ExcelGrid`: handsontable/ag-grid wrapper
* `SelectPeriod`, `SelectVersion`
* `Tooltip`, `Modal`, `ConfirmDialog`

---

### 📄 backend\_structure

#### 📁 Folder Tree (Spring Boot)

```
src/
└── main/java/com/company/budget/
    ├── controller/
    ├── service/
    ├── repository/
    ├── model/
    ├── dto/
    ├── config/
    └── BudgetApplication.java
```

#### 📌 Key Layers

* `controller`: REST endpoints
* `service`: Business logic
* `repository`: JPA repositories
* `model`: Entities
* `dto`: Data transfer objects
* `config`: JWT security and DB config

---

### 📄 README.md (Docs Index)

```
# 📘 Project Documentation Index

- [DB Schema](./database_schema.md)
- [API Endpoints](./api_endpoints.md)
- [Frontend Structure](./frontend_structure.md)
- [Backend Structure](./backend_structure.md)
```

---
