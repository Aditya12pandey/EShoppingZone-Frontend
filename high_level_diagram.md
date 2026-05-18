# High-Level Architecture Diagram: EShoppingZone

This document presents the **High-Level Architecture** of the **EShoppingZone** application, a full-stack, enterprise-grade e-commerce application built using a modern decoupled architecture. It highlights the overall system structure, microservices organization, communication paths, and external payment integration.

---

## 1. Architectural Overview

EShoppingZone uses a **Database-per-Service Microservices Architecture** combined with an **Angular Single Page Application (SPA)** client. This decoupling ensures high scalability, independent deployments, and strong isolation of concerns across business domains.

```mermaid
graph TB
    %% Client Layer
    subgraph Client Layer [Frontend Client Layer]
        Angular[Angular 17 SPA<br/>Port: 4200]
    end

    %% API / Service Layer
    subgraph Microservices API Layer [Microservices API Layer - .NET 8 ASP.NET Core]
        ProfileAPI[Profile API<br/>Port: 5001]
        ProductAPI[Product API<br/>Port: 5002]
        CartAPI[Cart API<br/>Port: 5003]
        OrderAPI[Order API<br/>Port: 5004]
        WalletAPI[Wallet API<br/>Port: 5005]
    end

    %% Data Storage Layer
    subgraph Storage Layer [Data Storage Layer - PostgreSQL]
        ProfileDB[(Profile DB<br/>eshoppingzone_profile)]
        ProductDB[(Product DB<br/>eshoppingzone_product)]
        CartDB[(Cart DB<br/>eshoppingzone_cart)]
        OrderDB[(Order DB<br/>eshoppingzone_order)]
        WalletDB[(Wallet DB<br/>eshoppingzone_wallet)]
    end

    %% External Systems
    subgraph External Systems [Third-Party Integrations]
        Razorpay[Razorpay Payment Gateway API]
    end

    %% Communication Paths
    %% Angular UI to Microservices
    Angular ==>|JWT Auth / Profiles / Login| ProfileAPI
    Angular ==>|Fetch & Manage Products| ProductAPI
    Angular ==>|Active Cart Management| CartAPI
    Angular ==>|Place & View Orders| OrderAPI
    Angular ==>|Check Balance / Top-up| WalletAPI

    %% Service to Database
    ProfileAPI -->|EF Core / Npgsql| ProfileDB
    ProductAPI -->|EF Core / Npgsql| ProductDB
    CartAPI -->|EF Core / Npgsql| CartDB
    OrderAPI -->|EF Core / Npgsql| OrderDB
    WalletAPI -->|EF Core / Npgsql| WalletDB

    %% Inter-Service Communication
    OrderAPI -.->|HTTP Post: /payMoney & /refund<br/>Saga Distributed Tx| WalletAPI

    %% Third Party Payments
    OrderAPI <-->|Initiate & Verify Payments| Razorpay
    WalletAPI <-->|Initiate & Verify Wallet Top-up| Razorpay
```

---

## 2. System Components

### A. Frontend Client (`eshoppingzone-frontend`)
*   **Technology**: Angular 17 SPA, TypeScript, HTML5, CSS3, RxJS.
*   **Responsibilities**: Exposes the user interface to three distinct roles: **Customer**, **Merchant**, and **Admin**.
*   **Routing**: Secure router setup utilizing Angular guards (`authGuard`, `roleGuard`) to strictly enforce role-based access.

### B. Microservices API Layer (`EShoppingZone`)
Built with **.NET 8** and organized as independent, lightweight RESTful web services:
1.  **Profile API (Port 5001)**: Manages authentication, JWT token generation, user profiles (Customers, Merchants, Admins), and shipping addresses.
2.  **Product API (Port 5002)**: Handles product catalogs, inventory list additions, updates, deletions, and filtering for merchants and buyers.
3.  **Cart API (Port 5003)**: Manages customer shopping carts and items in memory/persistence before purchase.
4.  **Order API (Port 5004)**: Manages the lifecycle of orders, Razorpay integration, online payments, and coordinates transactions.
5.  **Wallet API (Port 5005)**: Simulates a digital e-wallet enabling customers to load funds (via Razorpay) and purchase goods directly using their balance.

### C. Data Storage Layer
*   **Technology**: PostgreSQL.
*   **Isolation**: Adheres to the *Database-per-service* pattern. No service can directly query another service's database. This maintains clean bounds and prevents tight database-level coupling.

### D. Third-Party Payments (Razorpay)
*   **Integration**: Integrated directly at the backend service layer in both `Order.API` and `Wallet.API`.
*   **Security**: Signature validation (`Utils.verifyPaymentSignature`) is handled server-side to guarantee payment authenticity before dispatching/crediting orders or wallets.

---

## 3. Core Architectural Patterns

### A. Distributed Transactions (Saga Pattern)
When a customer pays for an order using their **E-Wallet**, the transaction spans two independent microservices: `Order.API` and `Wallet.API`. EShoppingZone uses a **Saga pattern with compensating transactions** to guarantee eventual consistency:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Angular)
    participant OrderService as Order.API
    participant WalletService as Wallet.API

    Customer->>OrderService: Place Order (EWallet Mode)
    opt Deduct Wallet Balance
        OrderService->>WalletService: HTTP POST /api/wallet/payMoney
        alt Balance OK
            WalletService-->>OrderService: 200 OK (Debit Successful)
        else Insufficient Balance / Error
            WalletService-->>OrderService: 400 Bad Request
            OrderService-->>Customer: Order Failed: Insufficient Balance
        end
    end

    alt Save Order
        OrderService->>OrderService: Save Order to Database
        OrderService-->>Customer: Order Placed Successfully
    else Database Save Fails (Compensating Transaction)
        OrderService->>OrderService: Rollback local DB transaction
        Note over OrderService,WalletService: SAGA COMPENSATING FLOW (REFUND)
        OrderService->>WalletService: HTTP POST /api/wallet/refund
        WalletService-->>OrderService: 200 OK (Credit Back Successful)
        OrderService-->>Customer: Order Failed: Database Error (Refunded)
    end
```

### B. Security & Token-Based Authentication
*   **Mechanism**: JWT Bearer Tokens.
*   **Authentication Flow**: The customer authenticates against `Profile.API` and receives a JWT signed with a secret key containing claims (User ID, Full Name, Role).
*   **Authorization Flow**: The frontend attaches the token in the `Authorization` HTTP header for subsequent microservice requests. Each microservice decodes and validates the token locally using the shared validation configuration.
