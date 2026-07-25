-- ============================================
-- AISAMMS - Agro Marketplace Schema (Updated)
-- ============================================

CREATE DATABASE IF NOT EXISTS agro_marketplace;
USE agro_marketplace;

-- ============================================
-- 1. PARTIES
-- ============================================
CREATE TABLE IF NOT EXISTS parties (
    party_id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    party_type                  ENUM('S','B','CA','A') NOT NULL,      -- S=supplier, B=buyer, CA=commission agent, A=admin

    name                        VARCHAR(50) NOT NULL,
    phone                       VARCHAR(13),
    cnic                        VARCHAR(15),
    email                       VARCHAR(50),
    password_hash               VARCHAR(255),
    active_status               TINYINT(1) DEFAULT 1,
    credit_limit                DECIMAL(12,2) DEFAULT 0,
    billing_address             VARCHAR(150),
    shipping_address            VARCHAR(150),
    is_registered               TINYINT(1) DEFAULT 0,
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (party_id, party_type)
);

-- ============================================
-- 2. SUPPLIES
-- ============================================
CREATE TABLE IF NOT EXISTS supplies (
    supply_id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    supplier_id        INT UNSIGNED NOT NULL,
    supplier_type      ENUM('S') NOT NULL DEFAULT 'S',

    unit               ENUM('kg','bag','crate','dozen','ton','maund') NOT NULL DEFAULT 'kg',
    item_name          VARCHAR(50) NOT NULL,
    category           VARCHAR(30) NOT NULL DEFAULT 'Uncategorized',
    current_stock      INT UNSIGNED NOT NULL,
    cost_per_unit      DECIMAL(10,2) NOT NULL,
    description        VARCHAR(200),

    FOREIGN KEY (supplier_id, supplier_type)
        REFERENCES parties(party_id, party_type)
);

-- ============================================
-- 3. SUPPLIER_AGENT_CONSIGNMENT
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_agent_consignment (
    consigned_id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    supply_id              INT UNSIGNED NOT NULL,
    supplier_id            INT UNSIGNED NOT NULL,
    supplier_type          ENUM('S') NOT NULL DEFAULT 'S',
    agent_id               INT UNSIGNED NOT NULL,
    agent_type             ENUM('CA') NOT NULL DEFAULT 'CA',

    payment_term           ENUM('cash','credit') NOT NULL DEFAULT 'credit',

    quantity_consigned     INT UNSIGNED NOT NULL,
    selling_price_per_unit DECIMAL(10,2) NOT NULL,
    commission_rate        DECIMAL(5,2),      -- agent-set at intake; NULL = use platform default rate
    quantity_sold          INT UNSIGNED NOT NULL DEFAULT 0,
    quantity_remaining     INT UNSIGNED NOT NULL,

    consigned_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status                 ENUM('pending','confirmed','completed','cancelled')
                           DEFAULT 'pending',

    FOREIGN KEY (supply_id)
        REFERENCES supplies(supply_id),

    FOREIGN KEY (supplier_id, supplier_type)
        REFERENCES parties(party_id, party_type),

    FOREIGN KEY (agent_id, agent_type)
        REFERENCES parties(party_id, party_type)
);

-- ============================================
-- 4. ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    order_id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    buyer_id            INT UNSIGNED NOT NULL,
    buyer_type          ENUM('B') NOT NULL DEFAULT 'B',
    consigned_id        INT UNSIGNED NOT NULL,

    quantity_ordered    INT UNSIGNED NOT NULL,
    rate_per_unit       DECIMAL(10,2) NOT NULL,
    total_amount        DECIMAL(12,2) NOT NULL,

    payment_term        ENUM('cash','credit') NOT NULL,
    status              ENUM('pending','confirmed','completed','cancelled')
                         DEFAULT 'pending',

    order_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_date       TIMESTAMP NULL,

    FOREIGN KEY (buyer_id, buyer_type)
        REFERENCES parties(party_id, party_type),

    FOREIGN KEY (consigned_id)
        REFERENCES supplier_agent_consignment(consigned_id)
);

-- ============================================
-- 5. PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    payer_id               INT UNSIGNED NOT NULL,
    payer_type             ENUM('S','B','CA') NOT NULL,

    payee_id               INT UNSIGNED NOT NULL,
    payee_type             ENUM('S','B','CA') NOT NULL,

    payment_method         ENUM('cash','card','other') NOT NULL,

    order_id               INT UNSIGNED,

    amount_paid            DECIMAL(12,2) NOT NULL,
    transaction_reference  VARCHAR(100),

    payment_date           DATE NOT NULL,

    FOREIGN KEY (payer_id, payer_type)
        REFERENCES parties(party_id, party_type),

    FOREIGN KEY (payee_id, payee_type)
        REFERENCES parties(party_id, party_type),

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

-- ============================================
-- 6. ACCOUNTS (Ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    account_id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    party_id          INT UNSIGNED NOT NULL,
    party_type        ENUM('S','B','CA') NOT NULL,

    transaction_type  ENUM('payment','refund','commission') NOT NULL,
    description       VARCHAR(255),

    debit_amount      DECIMAL(12,2) DEFAULT 0,
    credit_amount     DECIMAL(12,2) DEFAULT 0,
    running_balance   DECIMAL(12,2) DEFAULT 0,

    payment_id        INT UNSIGNED,
    order_id          INT UNSIGNED,

    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (party_id, party_type)
        REFERENCES parties(party_id, party_type),

    FOREIGN KEY (payment_id)
        REFERENCES payments(payment_id),

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

-- ============================================
-- 7. COMMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS commissions (
    commission_id      INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    order_id           INT UNSIGNED NOT NULL,

    agent_id           INT UNSIGNED NOT NULL,
    agent_type         ENUM('CA') NOT NULL DEFAULT 'CA',

    commission_rate    DECIMAL(5,2) NOT NULL,
    commission_amount  DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    FOREIGN KEY (agent_id, agent_type)
        REFERENCES parties(party_id, party_type)
);