# Outbound-Guard Backend

FastAPI backend skeleton for the Outbound-Guard Vietnam trademark compliance agent.

## Start

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Docs

After startup, open http://localhost:8000/docs to view Swagger UI.

## Directory Layout

```text
app/           Main application package
app/api/       Route modules, such as health.py and audit.py
app/models/    Pydantic request and response models
app/services/  Business services, rules engine, model calls, report generation
app/core/      Configuration, constants, and shared utilities
data/          Local knowledge base and trademark data
rules/         Rule definition files for deterministic screening
reports/       Generated compliance reports
uploads/       Temporary uploaded trademark images
tests/         Automated tests
```
