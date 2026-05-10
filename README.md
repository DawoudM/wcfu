# Full-Stack Health Calculator

A comprehensive, full-stack web application designed to track user body measurements and calculate key health metrics. Built with a modern architecture separating a robust Django API backend from a dynamic Angular frontend, all containerized for seamless deployment.

## 🌟 Key Features

### 🔐 Authentication & User Management
- **Secure Registration & Login:** JWT-based authentication using Simple JWT.
- **Session Management:** Secure token handling and persistent user sessions.
- **User-Specific Data:** All health measurements and calculated results are tied securely to the authenticated user.

### ⚕️ Health Tracking & Calculations
- **Detailed Measurement Form:** Captures comprehensive user data including age, sex, height, weight, and waist circumference.
- **Advanced Health Metrics:** Automatically calculates a suite of vital health indicators:
  - **BMI (Body Mass Index):** General health indicator based on height and weight.
  - **IBW (Ideal Body Weight):** Target weight calculation.
  - **WtHR (Waist-to-Height Ratio):** Advanced cardiovascular risk indicator.
  - **LBM (Lean Body Mass):** Total body weight minus fat mass.
  - **BFP (Body Fat Percentage):** Estimated proportion of fat to total body weight.
- **Results Dashboard:** Clean, intuitive presentation of all calculated health metrics.

### 🎨 User Experience
- **Responsive Design:** Fully responsive layout built with Angular Material and modern SCSS techniques.
- **Proactive Feedback:** Integrated snackbars for immediate, silent-error-free user feedback during form submissions and data fetching.
- **Form Validation:** Comprehensive client-side and server-side validation to ensure data integrity.

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework:** Angular 17.3
- **UI Library:** Angular Material
- **State Management & Reactivity:** RxJS
- **Styling:** SCSS

### Backend (Server)
- **Framework:** Django 5.0
- **API Toolkit:** Django REST Framework (DRF)
- **Authentication:** djangorestframework-simplejwt
- **Server:** Gunicorn

### Infrastructure & DevOps
- **Containerization:** Docker & Docker Compose
- **Web Server / Reverse Proxy:** Nginx
- **Database:** SQLite (Configured with local Docker volume mapping)

## 📂 Project Structure

```text
.
├── client/                 # Angular 17 Frontend Application
│   ├── src/
│   │   └── app/
│   │       ├── core/       # Core singleton services (Auth, HTTP Interceptors)
│   │       ├── features/   # Feature modules
│   │       │   ├── auth/   # Login & Registration components
│   │       │   └── health/ # Measurement form & Results dashboard
│   │       └── shared/     # Reusable UI components & pipes
│   ├── Dockerfile          # Frontend container definition
│   └── nginx.conf          # Nginx configuration for serving Angular
│
├── server/                 # Django 5 Backend Application
│   ├── apps/               # Django Apps
│   │   ├── accounts/       # Custom user models & auth logic
│   │   └── health/         # BodyMeasurement & HealthResult models/views
│   ├── config/             # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile          # Backend container definition
│
└── docker-compose.yml      # Orchestrates the frontend, backend, and volumes
```

## 🚀 Getting Started

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (for local frontend development)
- [Python 3.10+](https://www.python.org/) (for local backend development)

### Running the Application

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Environment Configuration:**
   Navigate to the `server` directory and create your `.env` file based on the example:
   ```bash
   cp server/.env.example server/.env
   ```
   *Note: Update the secret keys and environment variables in the `.env` file as needed.*

3. **Build and Start Containers:**
   From the root directory, use Docker Compose to spin up the entire stack:
   ```bash
   docker-compose up --build
   ```

4. **Access the Application:**
   - **Frontend UI:** Open your browser and navigate to `http://localhost`
   - **Backend API:** The API is accessible internally and proxied via Nginx. Direct backend health check available at `http://localhost:8000/api/health/measurement/`

### Local Development (Without Docker)

**Backend Setup:**
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend Setup:**
```bash
cd client
npm install
npm run start
```
*The Angular app will be served at `http://localhost:4200/`.*

## 🔒 Security Measures
- **CORS Configuration:** Strictly controlled via `django-cors-headers` to ensure secure cross-origin requests.
- **JWT Authentication:** Short-lived access tokens with secure refresh token rotation strategies.
- **Environment Isolation:** Secrets and configuration managed externally via `python-decouple` and `.env` files.
