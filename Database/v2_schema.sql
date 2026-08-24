-- ============================================================
-- AISAMMS - Agro Marketplace
-- VERSION 2 DATABASE SCHEMA
-- ============================================================

DROP DATABASE IF EXISTS agro_marketplace_v2;
CREATE DATABASE agro_marketplace_v2;
USE agro_marketplace_v2;


-- ============================================================
-- 1. USERS
-- ============================================================
-- Only users who can log into the website.
-- Roles: ADMIN and COMMISSION_AGENT
-- Buyers and suppliers do NOT have website accounts.

CREATE TABLE users (
    user_id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name                 VARCHAR(100) NOT NULL,
    email                VARCHAR(100) NOT NULL,
    phone                VARCHAR(13),
    cnic                 VARCHAR(15),

    password_hash        VARCHAR(255) NOT NULL,

    role                 ENUM('ADMIN', 'COMMISSION_AGENT') NOT NULL,

    active_status        TINYINT(1) NOT NULL DEFAULT 1,

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),

    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_cnic (cnic),

    INDEX idx_users_role_status (role, active_status)
);


-- ============================================================
-- 2. COMMISSION AGENTS
-- ============================================================
-- Additional information specific to commission agents.
-- Each commission agent has exactly one login user.

CREATE TABLE commission_agents (
    agent_id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id              INT UNSIGNED NOT NULL,

    commission_rate      DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (agent_id),

    UNIQUE KEY uq_agent_user (user_id),

    CONSTRAINT fk_agent_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- 3. BUYERS
-- ============================================================
-- Buyers do not log into the website.
-- They are managed by a commission agent.

CREATE TABLE buyers (
    buyer_id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id             INT UNSIGNED NOT NULL,

    name                 VARCHAR(100) NOT NULL,
    phone                VARCHAR(13),
    cnic                 VARCHAR(15),
    email                VARCHAR(100),

    active_status        TINYINT(1) NOT NULL DEFAULT 1,

    credit_limit         DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    billing_address      VARCHAR(150),
    shipping_address     VARCHAR(150),

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (buyer_id),

    UNIQUE KEY uq_buyer_cnic (cnic),

    INDEX idx_buyer_agent (agent_id),
    INDEX idx_buyer_status (agent_id, active_status),

    CONSTRAINT fk_buyer_agent
        FOREIGN KEY (agent_id)
        REFERENCES commission_agents(agent_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- 4. SUPPLIERS
-- ============================================================
-- Suppliers do not log into the website.
-- They are managed by a commission agent.

CREATE TABLE suppliers (
    supplier_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    agent_id             INT UNSIGNED NOT NULL,

    name                 VARCHAR(100) NOT NULL,
    phone                VARCHAR(13),
    cnic                 VARCHAR(15),
    email                VARCHAR(100),

    active_status        TINYINT(1) NOT NULL DEFAULT 1,

    credit_limit         DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    billing_address      VARCHAR(150),
    shipping_address     VARCHAR(150),

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (supplier_id),

    UNIQUE KEY uq_supplier_cnic (cnic),

    INDEX idx_supplier_agent (agent_id),
    INDEX idx_supplier_status (agent_id, active_status),

    CONSTRAINT fk_supplier_agent
        FOREIGN KEY (agent_id)
        REFERENCES commission_agents(agent_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- 5. PRODUCTS
-- ============================================================
-- Master list of agricultural products.
-- Example: Wheat, Rice, Mango, etc.

CREATE TABLE products (
    product_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,

    name                 VARCHAR(100) NOT NULL,
    category             VARCHAR(50) NOT NULL DEFAULT 'Uncategorized',

    unit                 ENUM(
                            'kg',
                            'bag',
                            'crate',
                            'dozen',
                            'ton',
                            'maund'
                         ) NOT NULL DEFAULT 'kg',

    description          VARCHAR(255),

    active_status        TINYINT(1) NOT NULL DEFAULT 1,

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (product_id),

    UNIQUE KEY uq_product_name (name),

    INDEX idx_product_category (category)
);


-- ============================================================
-- 6. SUPPLIER SUPPLIES
-- ============================================================
-- Represents a supplier providing a particular product.
-- A product can be supplied by many suppliers.

CREATE TABLE supplier_supplies (
    supplier_supply_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,

    supplier_id          INT UNSIGNED NOT NULL,
    product_id           INT UNSIGNED NOT NULL,

    quantity_available   DECIMAL(12,3) NOT NULL DEFAULT 0.000,

    cost_per_unit        DECIMAL(12,2) NOT NULL,

    description          VARCHAR(255),

    status               ENUM(
                            'available',
                            'depleted',
                            'cancelled'
                         ) NOT NULL DEFAULT 'available',

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (supplier_supply_id),

    INDEX idx_supply_supplier (supplier_id),
    INDEX idx_supply_product (product_id),
    INDEX idx_supply_status (supplier_id, status),

    CONSTRAINT fk_supply_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_supply_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- ============================================================
-- 7. CONSIGNMENTS
-- ============================================================
-- Represents stock given by a supplier to the commission agent
-- for selling.

CREATE TABLE consignments (
    consignment_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,

    supplier_supply_id      INT UNSIGNED NOT NULL,
    supplier_id             INT UNSIGNED NOT NULL,
    agent_id                INT UNSIGNED NOT NULL,

    quantity_consigned      DECIMAL(12,3) NOT NULL,
    quantity_sold           DECIMAL(12,3) NOT NULL DEFAULT 0.000,

    selling_price_per_unit  DECIMAL(12,2) NOT NULL,

    commission_rate         DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    payment_term            ENUM('cash', 'credit')
                            NOT NULL DEFAULT 'credit',

    status                  ENUM(
                                'pending',
                                'confirmed',
                                'completed',
                                'cancelled'
                            ) NOT NULL DEFAULT 'pending',

    consigned_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (consignment_id),

    INDEX idx_consignment_supplier (supplier_id),
    INDEX idx_consignment_agent (agent_id),
    INDEX idx_consignment_supply (supplier_supply_id),
    INDEX idx_consignment_status (agent_id, status),

    CONSTRAINT fk_consignment_supply
        FOREIGN KEY (supplier_supply_id)
        REFERENCES supplier_supplies(supplier_supply_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_consignment_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_consignment_agent
        FOREIGN KEY (agent_id)
        REFERENCES commission_agents(agent_id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 8. SALES
-- ============================================================
-- Sale header.
-- One sale can contain multiple sale items.

CREATE TABLE sales (
    sale_id              INT UNSIGNED NOT NULL AUTO_INCREMENT,

    agent_id             INT UNSIGNED NOT NULL,
    buyer_id             INT UNSIGNED NOT NULL,

    sale_date            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    payment_term         ENUM(
                            'cash',
                            'credit',
                            'partial'
                         ) NOT NULL,

    subtotal              DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    commission_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    payment_status       ENUM(
                            'unpaid',
                            'partial',
                            'paid'
                         ) NOT NULL DEFAULT 'unpaid',

    status                ENUM(
                            'pending',
                            'confirmed',
                            'completed',
                            'cancelled'
                         ) NOT NULL DEFAULT 'pending',

    delivery_date        TIMESTAMP NULL,

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (sale_id),

    INDEX idx_sale_agent (agent_id),
    INDEX idx_sale_buyer (buyer_id),
    INDEX idx_sale_date (sale_date),
    INDEX idx_sale_buyer_date (buyer_id, sale_date),

    CONSTRAINT fk_sale_agent
        FOREIGN KEY (agent_id)
        REFERENCES commission_agents(agent_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_sale_buyer
        FOREIGN KEY (buyer_id)
        REFERENCES buyers(buyer_id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 9. SALE ITEMS
-- ============================================================
-- Individual products/consignments included in a sale.

CREATE TABLE sale_items (
    sale_item_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,

    sale_id              INT UNSIGNED NOT NULL,
    consignment_id       INT UNSIGNED NOT NULL,

    quantity             DECIMAL(12,3) NOT NULL,
    rate_per_unit        DECIMAL(12,2) NOT NULL,
    total_amount         DECIMAL(12,2) NOT NULL,

    PRIMARY KEY (sale_item_id),

    INDEX idx_sale_item_sale (sale_id),
    INDEX idx_sale_item_consignment (consignment_id),

    CONSTRAINT fk_sale_item_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_sale_item_consignment
        FOREIGN KEY (consignment_id)
        REFERENCES consignments(consignment_id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 10. COMMISSIONS
-- ============================================================
-- Commission earned by the commission agent from a sale.

CREATE TABLE commissions (
    commission_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,

    sale_id             INT UNSIGNED NOT NULL,
    agent_id            INT UNSIGNED NOT NULL,

    commission_rate     DECIMAL(5,2) NOT NULL,
    commission_amount   DECIMAL(12,2) NOT NULL,

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (commission_id),

    UNIQUE KEY uq_commission_sale (sale_id),

    INDEX idx_commission_agent (agent_id),

    CONSTRAINT fk_commission_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_commission_agent
        FOREIGN KEY (agent_id)
        REFERENCES commission_agents(agent_id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 11. ACCOUNTS
-- ============================================================
-- Each buyer and supplier has one financial account.
-- An account belongs to either a buyer OR a supplier.

CREATE TABLE accounts (
    account_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,

    buyer_id            INT UNSIGNED NULL,
    supplier_id         INT UNSIGNED NULL,

    opening_balance     DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (account_id),

    UNIQUE KEY uq_account_buyer (buyer_id),
    UNIQUE KEY uq_account_supplier (supplier_id),

    CONSTRAINT fk_account_buyer
        FOREIGN KEY (buyer_id)
        REFERENCES buyers(buyer_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_account_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_account_owner
        CHECK (
            (buyer_id IS NOT NULL AND supplier_id IS NULL)
            OR
            (buyer_id IS NULL AND supplier_id IS NOT NULL)
        )
);


-- ============================================================
-- 12. TRANSACTIONS
-- ============================================================
-- Financial ledger entries.
-- Closing/running balance is calculated from these records
-- instead of being stored redundantly.

CREATE TABLE transactions (
    transaction_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    account_id          INT UNSIGNED NOT NULL,

    transaction_type    ENUM(
                            'opening_balance',
                            'sale',
                            'purchase',
                            'payment',
                            'refund',
                            'commission',
                            'adjustment'
                        ) NOT NULL,

    description         VARCHAR(255) NOT NULL,

    debit_amount        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    credit_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    reference_type      ENUM(
                            'sale',
                            'payment',
                            'refund',
                            'commission',
                            'manual'
                        ) NULL,

    reference_id        BIGINT UNSIGNED NULL,

    transaction_date    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_by          INT UNSIGNED NOT NULL,

    PRIMARY KEY (transaction_id),

    INDEX idx_transaction_account_date
        (account_id, transaction_date, transaction_id),

    INDEX idx_transaction_type
        (transaction_type),

    INDEX idx_transaction_reference
        (reference_type, reference_id),

    INDEX idx_transaction_creator
        (created_by),

    CONSTRAINT fk_transaction_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_transaction_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_transaction_amount
        CHECK (
            (debit_amount > 0 AND credit_amount = 0)
            OR
            (credit_amount > 0 AND debit_amount = 0)
            OR
            (debit_amount = 0 AND credit_amount = 0)
        )
);


-- ============================================================
-- 13. PAYMENTS
-- ============================================================
-- Actual payments recorded by the commission agent.
-- Buyers and suppliers do not directly use this system.

CREATE TABLE payments (
    payment_id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    account_id             INT UNSIGNED NOT NULL,
    agent_id               INT UNSIGNED NOT NULL,

    amount_paid            DECIMAL(12,2) NOT NULL,

    payment_method         ENUM(
                                'cash',
                                'bank_transfer',
                                'card',
                                'other'
                            ) NOT NULL DEFAULT 'cash',

    transaction_reference  VARCHAR(100),

    payment_date           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes                   VARCHAR(255),

    created_by              INT UNSIGNED NOT NULL,

    PRIMARY KEY (payment_id),

    INDEX idx_payment_account_date
        (account_id, payment_date),

    INDEX idx_payment_agent_date
        (agent_id, payment_date),

    CONSTRAINT fk_payment_account
        FOREIGN KEY (account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_agent
        FOREIGN KEY (agent_id)
        REFERENCES commission_agents(agent_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);


-- ============================================================
-- 14. RECEIPTS
-- ============================================================
-- One receipt is generated for a payment.

CREATE TABLE receipts (
    receipt_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    receipt_number      VARCHAR(30) NOT NULL,

    payment_id          BIGINT UNSIGNED NOT NULL,

    amount              DECIMAL(12,2) NOT NULL,

    description         VARCHAR(255),

    issued_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_by          INT UNSIGNED NOT NULL,

    PRIMARY KEY (receipt_id),

    UNIQUE KEY uq_receipt_number (receipt_number),
    UNIQUE KEY uq_receipt_payment (payment_id),

    CONSTRAINT fk_receipt_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(payment_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_receipt_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);


-- ============================================================
-- END OF AISAMMS V2 DATABASE SCHEMA
-- ============================================================