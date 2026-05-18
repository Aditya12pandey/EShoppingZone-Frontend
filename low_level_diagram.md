# Low-Level Architecture & Implementation Diagram: EShoppingZone

This document outlines the **Low-Level Design (LLD)** of both the backend .NET 8 microservices and the frontend Angular 17 application. It explains the class structures, database entity models, dependency injections, and data access layers.

---

## 1. Backend Microservices Internals (N-Tier Clean Architecture)

Each of the five microservices (`Profile`, `Product`, `Cart`, `Order`, `Wallet`) is structured using an N-Tier architecture pattern that enforces a clean separation of concerns.

```mermaid
graph TD
    %% Define Layers
    subgraph ControllerLayer [1. API / Presentation Layer]
        Controller[Controller Class<br/>e.g., OrderController.cs]
        DTO[DTO Models<br/>e.g., PlaceOrderDto.cs]
        Middleware[GlobalExceptionMiddleware.cs]
    end

    subgraph ServiceLayer [2. Core Business Logic Layer]
        IService[Interface Definition<br/>e.g., IOrderService.cs]
        Service[Service Implementation<br/>e.g., OrderService.cs]
    end

    subgraph RepositoryLayer [3. Data Access Layer]
        IRepo[Repository Interface<br/>e.g., IOrderRepository.cs]
        Repo[Repository Implementation<br/>e.g., OrderRepository.cs]
        DBContext[EF Core DbContext<br/>e.g., OrderDbContext.cs]
    end

    subgraph EntityLayer [4. Domain Entities Layer]
        Entity[Entity Models<br/>e.g., OrderEntity.cs]
    end

    %% Dependency & Request Flows
    Request((Client Request)) ==> Middleware
    Middleware ==> Controller
    DTO -.->|Used for input validation| Controller
    Controller -->|Injects Interface| IService
    IService --- Service
    Service -->|Injects Interface| IRepo
    IRepo --- Repo
    Repo -->|Queries| DBContext
    DBContext -->|Maps & Persists| Entity
    DBContext -->|PostgreSQL DB| Postgres[(PostgreSQL Table)]
```

### Backend Components Deep-Dive

#### A. Controller Layer (Presentation)
*   **Routing**: Defined using route attributes (e.g., `[Route("api/orders")]`).
*   **Model Validation**: Enforces strict input rules. Handled automatically in `Program.cs` by overriding `InvalidModelStateResponseFactory` to return uniform validation error formats.
*   **Authentication & Authorization**: Controlled via `[Authorize]` and `[Authorize(Roles = "CUSTOMER")]` attributes, using the claims extracted from JWTs.

#### B. Business Logic Service Layer
*   **Abstraction**: Business logic is separated into service implementations behind interfaces (e.g. `IOrderService` implemented by `OrderService`).
*   **Responsibility**:
    *   Saga transaction orchestrations (calling the `WalletAPI` from `OrderService`).
    *   Third-party SDK interactions (e.g., calling Razorpay APIs to generate order IDs or verify signatures).
    *   Calculating order subtotals and wallet balance adjustments.

#### C. Repository & Database Context Layer
*   **EF Core**: Database tables are configured and queried using Entity Framework Core.
*   **Npgsql**: PostgreSQL provider for Entity Framework Core.
*   **Auto-Migration**: Upon application start, the program executes migrations automatically:
    ```csharp
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<DbContext>();
        db.Database.Migrate();
    }
    ```

---

## 2. Frontend Application Internals (Angular)

The Angular client follows a modular, feature-oriented structure with distinct pages, shared UI elements, and a core services layer managing HTTP requests.

```mermaid
graph TD
    %% Routing and Guards
    subgraph Routing [Angular Route Guard Flow]
        AppRoutes[app.routes.ts]
        AuthGuard[auth.guard.ts]
        RoleGuard[role.guard.ts]
    end

    %% Components
    subgraph FeaturePages [Feature Component Modules]
        PublicFeatures[Public Components<br/>- ProductListComponent<br/>- ProductDetailComponent]
        AuthFeatures[Authentication Components<br/>- LoginComponent<br/>- RegisterComponent]
        CustomerFeatures[Customer Components<br/>- CartComponent<br/>- CheckoutComponent<br/>- MyOrdersComponent<br/>- WalletComponent]
        MerchantFeatures[Merchant Components<br/>- Merchant DashboardComponent]
        AdminFeatures[Admin Components<br/>- Admin DashboardComponent]
    end

    %% Services
    subgraph ServicesLayer [Angular Core Services Layer]
        AuthService[auth.service.ts]
        ProductService[product.service.ts]
        CartService[cart.service.ts]
        OrderService[order.service.ts]
        WalletService[wallet.service.ts]
        ProfileService[profile.service.ts]
    end

    %% Backend Targets
    subgraph BackendAPI [External REST Endpoints]
        ProfileBackend[Profile API :5001]
        ProductBackend[Product API :5002]
        CartBackend[Cart API :5003]
        OrderBackend[Order API :5004]
        WalletBackend[Wallet API :5005]
    end

    %% Navigation Flow
    AppRoutes -->|Checks Auth| AuthGuard
    AuthGuard -->|Checks Authorization| RoleGuard
    RoleGuard -->|Allows Access| FeaturePages

    %% Service consumption
    PublicFeatures --> ProductService
    AuthFeatures --> AuthService
    CustomerFeatures --> CartService
    CustomerFeatures --> OrderService
    CustomerFeatures --> WalletService
    MerchantFeatures --> ProductService
    AdminFeatures --> ProfileService

    %% Services calling REST endpoints
    AuthService ==>|HTTP Post /login| ProfileBackend
    ProfileService ==>|HTTP Get /api/profiles/all| ProfileBackend
    ProductService ==>|HTTP Get /api/products| ProductBackend
    CartService ==>|HTTP Get /api/cart| CartBackend
    OrderService ==>|HTTP Post /api/orders| OrderBackend
    WalletService ==>|HTTP Get /api/wallet| WalletBackend
```

---

## 3. Database Entity Relationship (Logical Design)

Each microservice isolates its domain entities. The following diagram models the logical associations and records across these service boundaries.

```mermaid
erDiagram
    %% Profile Service Entities
    USER_PROFILE {
        int ProfileId PK
        string FullName
        string Email
        string PasswordHash
        string Role "CUSTOMER | MERCHANT | ADMIN"
        string MobileNumber
    }
    ADDRESS {
        int AddressId PK
        int ProfileId FK
        string HouseNumber
        string Street
        string City
        string State
        string PinCode
    }
    USER_PROFILE ||--o{ ADDRESS : "has many"

    %% Product Service Entities
    PRODUCT_ENTITY {
        int ProductId PK
        string ProductName
        string Category
        string Description
        decimal Price
        string ImageUrl
        int MerchantId "Foreign ref to UserProfile"
    }

    %% Cart Service Entities
    CART_ENTITY {
        int CartId PK "Corresponds to Customer ProfileId"
        decimal TotalPrice
    }
    CART_ITEM_ENTITY {
        int ItemId PK
        int CartId FK
        int ProductId
        string ProductName
        int Quantity
        decimal Price
    }
    CART_ENTITY ||--o{ CART_ITEM_ENTITY : "contains"

    %% Order Service Entities
    ORDER_ENTITY {
        int OrderId PK
        DateTime OrderDate
        int CustomerId "Foreign ref to UserProfile"
        int MerchantId "Foreign ref to UserProfile"
        int ProductId "Foreign ref to ProductEntity"
        string ProductName
        int Quantity
        decimal AmountPaid
        string ModeOfPayment "EWALLET | ONLINE"
        string OrderStatus "Placed | Shipped | Delivered | Cancelled"
        string Address "Flattened Address String"
    }

    %% Wallet Service Entities
    E_WALLET {
        int WalletId PK "Corresponds to Customer ProfileId"
        decimal CurrentBalance
    }
    STATEMENT {
        int StatementId PK
        int WalletId FK
        string TransactionType "CREDIT | DEBIT"
        decimal Amount
        DateTime DateTime
        int OrderId "0 if load transaction"
        string TransactionRemarks
    }
    E_WALLET ||--o{ STATEMENT : "logs"
```
