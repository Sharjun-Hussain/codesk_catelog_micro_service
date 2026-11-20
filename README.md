# 📦 CoDesk Product Master Catalog Microservice

High-speed, multi-tier product catalog and barcode intelligence microservice for the **CoDesk ERP Ecosystem**.

When any merchant or store scans a product barcode (EAN-13, UPC-A, GTIN), this service automatically resolves the product name, brand, category, unit, and image, drastically reducing merchant onboarding friction.

---

## 🏛️ Architecture & Highlights

* **Isolated Dedicated Database:** Runs against `codesk_catalog_system` MySQL database, completely separated from core ERP financial transactions.
* **Sequelize ORM & Migrations:** Formal migrations and indices matching the CoDesk architecture.
* **Tiered Resolution Engine:**
  1. **Tier 1:** Local indexed MySQL database (`master_products`) – **~5–15ms response**.
  2. **Tier 2:** Free **Open Food Facts API** fallback. Automatically parses, standardizes, and caches the result into the local database so future hits are instantaneous.
  3. **Tier 3:** **Merchant Crowdsourcing & Consensus Engine**. When stores add unknown barcodes, they enter a review pool. Multiple independent store submissions automatically promote the item to the Master Catalog.
* **Barcode Gatekeeper:** Protects the master catalog by automatically filtering out weighing scale barcodes (GS1 prefix 20–29 / 02) and store-local custom SKUs.
* **Enterprise Security:**
  * **API Key Authentication (`X-API-Key`):** SHA-256 hashed keys with role-based access.
  * **Industrial Rate Limiting:** In-memory with IP and client-key tracking.
  * **Traefik & Docker Ready:** Multi-stage production Docker build with Traefik reverse-proxy labels and Let's Encrypt SSL automation.

---

## 🚀 Quick Start (Local Development)

```powershell
# Navigate to the service folder
cd d:\Projects\ERP\codesk-catalog-service

# Install dependencies
pnpm install

# Run database migrations
pnpm db:migrate

# Start the service
pnpm dev
# Or production mode
pnpm start
```

Default Port: `http://localhost:5005`  
Health Check: `http://localhost:5005/health`

---

## 📡 API Reference

All catalog endpoints require the `X-API-Key` header.

### 1. Barcode Lookup (Single)
**Endpoint:** `GET /api/v1/catalog/lookup/:barcode`  
**Header:** `X-API-Key: <YOUR_API_KEY>`

### 2. Bulk Barcode Lookup (For CSV / Excel Store Onboarding)
**Endpoint:** `POST /api/v1/catalog/bulk-lookup`  
**Header:** `X-API-Key: <YOUR_API_KEY>`

### 3. Merchant Product Contribution
**Endpoint:** `POST /api/v1/catalog/contribute`  
**Header:** `X-API-Key: <YOUR_API_KEY>`

### 4. Product Search (By Title or Brand)
**Endpoint:** `GET /api/v1/catalog/search?q=coca&limit=10`  
**Header:** `X-API-Key: <YOUR_API_KEY>`

---

## 🐳 Docker & Traefik Deployment

```powershell
docker compose up -d --build
```
Container Name: `codesk_catalog_service`  
Internal Docker URL: `http://codesk_catalog_service:5005`
