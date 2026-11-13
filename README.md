# InventoryIQ – AI Inventory Intelligence Platform

<p align="center">
  <strong>AI-Powered Demand Forecasting • Smart Inventory Management • Automated Purchase Recommendations</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-FastAPI-blue?logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-316192?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/AI-LSTM%20Forecasting-orange" alt="AI Forecasting" />
</p>

## Overview

**InventoryIQ** is an AI-powered inventory intelligence platform designed to help businesses manage inventory efficiently, forecast product demand, identify potential stock shortages, and make smarter purchasing decisions.

The platform combines inventory management, historical sales analysis, AI-based demand forecasting, purchase order management, and Gmail notifications in one integrated application.

## Key Features

- **AI Demand Forecasting:** Uses historical sales data and an LSTM-based forecasting model to estimate future product demand.
- **Smart Inventory Management:** Manage products, stock quantities, warehouses, and inventory levels.
- **Purchase Order Management:** Create and manage purchase orders and track order status.
- **Purchase Recommendations:** Support purchasing decisions using demand and inventory information.
- **Email Notifications:** Send email notifications through Gmail SMTP.
- **Analytics and Reports:** View inventory and sales insights through the application dashboard.
- **User Authentication:** Access the application through its login and user-management functionality.
- **Supplier Management:** Maintain supplier information and support purchase workflows.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| AI / Machine Learning | TensorFlow / Keras, LSTM, NumPy, Pandas |
| Email Integration | Gmail SMTP |
| API Documentation | FastAPI Swagger UI |

## Project Structure

```text
InventoryIQ-AI-Inventory-Platform/
│
├── backend/
│   ├── ai/
│   │   ├── forecast.py
│   │   ├── preprocessing.py
│   │   ├── train_lstm.py
│   │   ├── inventory_demand_model.keras
│   │   └── demand_scaler.npy
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── product.py
│   │   ├── inventory.py
│   │   ├── supplier.py
│   │   ├── purchase_order.py
│   │   ├── ai_forecast.py
│   │   └── analytics.py
│   │
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── email_service.py
│   └── main.py
│
├── dataset/
│   ├── products.csv
│   ├── historical_sales.csv
│   ├── daily_demand.csv
│   ├── inventory.csv
│   ├── suppliers.csv
│   ├── warehouses.csv
│   ├── purchase_orders.csv
│   └── purchase_order_items.csv
│
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── pages/
│   ├── App.tsx
│   └── api.ts
│
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Harikrishna-9133/InventoryIQ-AI-Inventory-Platform.git
cd InventoryIQ-AI-Inventory-Platform
```

### 2. Backend Setup

Create and activate a virtual environment:

**Windows PowerShell**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies using the dependency file provided by the project. If your project uses `requirements.txt`:

```powershell
pip install -r requirements.txt
```

Configure the database connection and required environment variables in a local `.env` file. Do not commit this file.

Start the backend:

```powershell
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open a second terminal from the project root:

```powershell
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## Environment Configuration

Configure the required database and email credentials in your local environment file.

Example Gmail settings:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-google-app-password
```

Add the database connection variable required by the backend configuration.

**Security:** Never upload passwords, API keys, or `.env` files to GitHub.

## Dataset

The project includes sample CSV datasets for:

- Products
- Historical sales
- Daily demand
- Inventory
- Suppliers
- Warehouses
- Purchase orders
- Purchase order items

The included sample dataset is synthetic demonstration data and should not be treated as real business sales data.

## AI Forecasting Workflow

1. Collect historical sales data.
2. Preprocess and prepare the sales data.
3. Scale the data for model input.
4. Use the LSTM forecasting model to estimate future demand.
5. Compare forecasted demand with available inventory.
6. Support inventory and purchasing decisions using the generated insights.

## API Documentation

FastAPI provides interactive API documentation through Swagger UI:

```text
http://127.0.0.1:8000/docs
```

Use this interface to explore and test the available API endpoints.

## Future Enhancements

- Advanced forecasting and model evaluation.
- Automated low-stock alerts.
- Supplier performance analytics.
- Improved purchase order automation.
- Cloud deployment and scalable database hosting.
- Advanced inventory optimization.

## Security

- Keep environment variables and credentials private.
- Use secure database credentials.
- Do not commit local virtual environments or dependency folders.
- Configure production secrets through your hosting provider.

## Author

**Hari Krishna Digiventi**

GitHub: [@Harikrishna-9133](https://github.com/Harikrishna-9133)

## License

This project is available for educational and demonstration purposes. Add an appropriate open-source license before granting others permission to reuse or distribute the code.