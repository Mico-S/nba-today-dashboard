> **Disclaimer:** This application, including its architecture, backend, and frontend code, was entirely generated through interaction with **Cursor**, using the **gemini-2.5-pro-exp-03-25** Large Language Model (LLM) coding assistant. While functional, it serves as a demonstration and requires further review, optimization, and testing for production use.

# NBA Today Dashboard

**A focused dashboard displaying the top 8 NBA standings for each conference and key upcoming/recent matchups.**

This project provides a quick overview for NBA fans, highlighting top teams and games between highly-ranked opponents.

## Architecture & Tech Stack

This is a full-stack application composed of a Python backend and a React frontend:

- **Backend (`/backend`)**
  - **Framework:** [FastAPI](https://fastapi.tiangolo.com/) - A modern, fast Python web framework for building APIs.
  - **Data Source:** [nba_api (unofficial)](https://github.com/swar/nba_api) - Python client library to access NBA.com's internal APIs for game and standings data.
  - **Server:** [Uvicorn](https://www.uvicorn.org/) - ASGI server to run the FastAPI application.
  - **Caching:** Simple in-memory dictionary cache with a Time-To-Live (TTL) to reduce direct API calls.
- **Frontend (`/frontend`)**
  - **Framework:** [Next.js](https://nextjs.org/) (App Router) - A React framework providing structure, routing, and optimizations.
  - **Language:** [TypeScript](https://www.typescriptlang.org/)
  - **UI Library:** [React](https://react.dev/)
  - **Styling:** [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework.
  - **Components:** [ShadCN UI](https://ui.shadcn.com/) - Reusable UI components built using Tailwind CSS (copied into the project).
  - **Icons:** [Lucide React](https://lucide.dev/)
  - **Data Fetching:** [Axios](https://axios-http.com/)

## Running the Application Locally

You will need two separate terminals to run both the backend and frontend servers.

### Backend Setup & Run

1.  **Navigate to backend:**
    ```bash
    cd backend
    ```
2.  **Create & Activate Virtual Environment** (first time only):
    ```bash
    # Use python3 if python is not aliased to Python 3
    python3 -m venv venv
    # Activate (Linux/macOS)
    source venv/bin/activate
    # Activate (Windows CMD/PowerShell - using forward slashes often works)
    # . env/Scripts/activate
    ```
    _Remember to activate the environment (`source venv/bin/activate` or equivalent) in every new terminal session for the backend._
3.  **Install Dependencies** (first time or when `requirements.txt` changes):
    ```bash
    pip install -r requirements.txt
    ```
4.  **Run the Backend Server:**
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The API will be available at `http://localhost:8000`. Keep this terminal running.

### Frontend Setup & Run

1.  **Open a new terminal.**
2.  **Navigate to frontend:**
    ```bash
    cd frontend
    ```
3.  **Install Dependencies** (first time or when `package.json` changes):
    ```bash
    npm install
    ```
4.  **Run the Frontend Development Server:**
    ```bash
    npm run dev
    ```
    The frontend application will be available at `http://localhost:3000`. Keep this terminal running.
