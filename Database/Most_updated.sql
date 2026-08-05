-- ============================================
-- AISAMMS - Agro Marketplace Schema (Temporary)
-- Simplified Foreign Keys (Backend Compatible)
-- ============================================

DROP DATABASE IF EXISTS agro_marketplace;
CREATE DATABASE agro_marketplace;
USE agro_marketplace;

-- ============================================
-- 1. PARTIES
-- ============================================
CREATE TABLE parties (
    party_id                    INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    party_type                  ENUM('S','B','CA','A') NOT NULL,

    name                        VARCHAR(50) NOT NULL,
    phone                       VARCHAR(13),
    cnic                        VARCHAR(15),
    email                       VARCHAR(50) UNIQUE,
    password_hash               VARCHAR(255),
    active_status               TINYINT(1) DEFAULT 1,
    credit_limit                DECIMAL(12,2) DEFAULT 0,
    billing_address             VARCHAR(150),
    shipping_address            VARCHAR(150),
    is_registered               TINYINT(1) DEFAULT 0,
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. SUPPLIES
-- ============================================
CREATE TABLE supplies (
    supply_id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    supplier_id         INT UNSIGNED NOT NULL,
    supplier_type       ENUM('S') NOT NULL DEFAULT 'S',

    unit                ENUM('kg','bag','crate','dozen','ton','maund')
                        NOT NULL DEFAULT 'kg',

    item_name           VARCHAR(50) NOT NULL,
    category            VARCHAR(30) NOT NULL DEFAULT 'Uncategorized',

    current_stock       INT UNSIGNED NOT NULL,
    cost_per_unit       DECIMAL(10,2) NOT NULL,

    description         VARCHAR(200),

    FOREIGN KEY (supplier_id)
        REFERENCES parties(party_id)
);

-- ============================================
-- 3. SUPPLIER_AGENT_CONSIGNMENT
-- ============================================
CREATE TABLE supplier_agent_consignment (

    consigned_id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    supply_id               INT UNSIGNED NOT NULL,

    supplier_id             INT UNSIGNED NOT NULL,
    supplier_type           ENUM('S') NOT NULL DEFAULT 'S',

    agent_id                INT UNSIGNED NOT NULL,
    agent_type              ENUM('CA') NOT NULL DEFAULT 'CA',

    payment_term            ENUM('cash','credit')
                            NOT NULL DEFAULT 'credit',

    quantity_consigned      INT UNSIGNED NOT NULL,

    selling_price_per_unit  DECIMAL(10,2) NOT NULL,

    commission_rate         DECIMAL(5,2),

    quantity_sold           INT UNSIGNED NOT NULL DEFAULT 0,

    quantity_remaining      INT UNSIGNED NOT NULL,

    consigned_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status                  ENUM(
                                'pending',
                                'confirmed',
                                'completed',
                                'cancelled'
                            ) DEFAULT 'pending',

    FOREIGN KEY (supply_id)
        REFERENCES supplies(supply_id),

    FOREIGN KEY (supplier_id)
        REFERENCES parties(party_id),

    FOREIGN KEY (agent_id)
        REFERENCES parties(party_id)
);

-- ============================================
-- 4. ORDERS
-- ============================================
CREATE TABLE orders (

    order_id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    buyer_id            INT UNSIGNED NOT NULL,
    buyer_type          ENUM('B') NOT NULL DEFAULT 'B',

    consigned_id        INT UNSIGNED NOT NULL,

    quantity_ordered    INT UNSIGNED NOT NULL,

    rate_per_unit       DECIMAL(10,2) NOT NULL,

    total_amount        DECIMAL(12,2) NOT NULL,

    payment_term        ENUM('cash','credit') NOT NULL,

    status              ENUM(
                            'pending',
                            'confirmed',
                            'completed',
                            'cancelled'
                        ) DEFAULT 'pending',

    order_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    delivery_date       TIMESTAMP NULL,

    FOREIGN KEY (buyer_id)
        REFERENCES parties(party_id),

    FOREIGN KEY (consigned_id)
        REFERENCES supplier_agent_consignment(consigned_id)
);

-- ============================================
-- 5. PAYMENTS
-- ============================================
CREATE TABLE payments (

    payment_id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    payer_id                INT UNSIGNED NOT NULL,
    payer_type              ENUM('S','B','CA') NOT NULL,

    payee_id                INT UNSIGNED NOT NULL,
    payee_type              ENUM('S','B','CA') NOT NULL,

    payment_method          ENUM('cash','card','other') NOT NULL,

    order_id                INT UNSIGNED,

    amount_paid             DECIMAL(12,2) NOT NULL,

    transaction_reference   VARCHAR(100),

    payment_date            DATE NOT NULL,

    FOREIGN KEY (payer_id)
        REFERENCES parties(party_id),

    FOREIGN KEY (payee_id)
        REFERENCES parties(party_id),

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

-- ============================================
-- 6. ACCOUNTS (Ledger)
-- ============================================
CREATE TABLE accounts (

    account_id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    party_id            INT UNSIGNED NOT NULL,
    party_type          ENUM('S','B','CA') NOT NULL,

    transaction_type    ENUM(
                            'payment',
                            'refund',
                            'commission'
                        ) NOT NULL,

    description         VARCHAR(255),

    debit_amount        DECIMAL(12,2) DEFAULT 0,

    credit_amount       DECIMAL(12,2) DEFAULT 0,

    running_balance     DECIMAL(12,2) DEFAULT 0,

    payment_id          INT UNSIGNED,

    order_id            INT UNSIGNED,

    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (party_id)
        REFERENCES parties(party_id),

    FOREIGN KEY (payment_id)
        REFERENCES payments(payment_id),

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

-- ============================================
-- 7. COMMISSIONS
-- ============================================
CREATE TABLE commissions (

    commission_id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

    order_id            INT UNSIGNED NOT NULL,

    agent_id            INT UNSIGNED NOT NULL,
    agent_type          ENUM('CA') NOT NULL DEFAULT 'CA',

    commission_rate     DECIMAL(5,2) NOT NULL,

    commission_amount   DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    FOREIGN KEY (agent_id)
        REFERENCES parties(party_id)
);

INSERT INTO parties
(
    party_type,
    name,
    phone,
    cnic,
    email,
    password_hash,
    active_status,
    credit_limit,
    billing_address,
    shipping_address,
    is_registered
)
VALUES
('S','Ali Farms','03001234567','42101-1234567-1',
'ali@farms.com','hashed_password',1,50000,
'Hyderabad','Hyderabad',1),

('B','Karachi Fresh Market','03111234567','42101-7654321-2',
'karachi@market.com','hashed_password',1,100000,
'Karachi','Karachi',1),

('CA','Ahmed Commission Agency','03221234567','42101-1111111-3',
'ahmed@agency.com','hashed_password',1,0,
'Multan','Multan',1);

INSERT INTO supplies
(
    supplier_id,
    supplier_type,
    unit,
    item_name,
    category,
    current_stock,
    cost_per_unit,
    description
)
VALUES
(
    1,
    'S',
    'kg',
    'Wheat',
    'Grains',
    5000,
    65.00,
    'Premium quality wheat'
);

INSERT INTO supplier_agent_consignment
(
    supply_id,
    supplier_id,
    supplier_type,
    agent_id,
    agent_type,
    payment_term,
    quantity_consigned,
    selling_price_per_unit,
    commission_rate,
    quantity_sold,
    quantity_remaining,
    status
)
VALUES
(
    1,
    1,
    'S',
    3,
    'CA',
    'credit',
    1000,
    75.00,
    5.00,
    200,
    800,
    'confirmed'
);

INSERT INTO orders
(
    buyer_id,
    buyer_type,
    consigned_id,
    quantity_ordered,
    rate_per_unit,
    total_amount,
    payment_term,
    status,
    delivery_date
)
VALUES
(
    2,
    'B',
    1,
    100,
    75.00,
    7500.00,
    'cash',
    'confirmed',
    NOW()
);

INSERT INTO payments
(
    payer_id,
    payer_type,
    payee_id,
    payee_type,
    payment_method,
    order_id,
    amount_paid,
    transaction_reference,
    payment_date
)
VALUES
(
    2,
    'B',
    1,
    'S',
    'cash',
    1,
    7500.00,
    'TXN001',
    CURDATE()
);

INSERT INTO accounts
(
    party_id,
    party_type,
    transaction_type,
    description,
    debit_amount,
    credit_amount,
    running_balance,
    payment_id,
    order_id
)
VALUES
(
    1,
    'S',
    'payment',
    'Payment received from buyer',
    0.00,
    7500.00,
    7500.00,
    1,
    1
);

INSERT INTO commissions
(
    order_id,
    agent_id,
    agent_type,
    commission_rate,
    commission_amount
)
VALUES
(
    1,
    3,
    'CA',
    5.00,
    375.00
);