-- MEQ Wheels Essential Production Tables & Official Fleet

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'verified',
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    registration_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    rental_price NUMERIC(10,2) NOT NULL,
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL DEFAULT '10:00:00',
    return_date DATE NOT NULL,
    return_time TIME NOT NULL DEFAULT '10:00:00',
    rental_duration INTEGER NOT NULL DEFAULT 1,
    rental_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0,
    advance_payment NUMERIC(10,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    outstanding_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'upi',
    transaction_reference VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'rental',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for branches" ON branches;
CREATE POLICY "Allow all for branches" ON branches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for customers" ON customers;
CREATE POLICY "Allow all for customers" ON customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for vehicles" ON vehicles;
CREATE POLICY "Allow all for vehicles" ON vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for bookings" ON bookings;
CREATE POLICY "Allow all for bookings" ON bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for payments" ON payments;
CREATE POLICY "Allow all for payments" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed Initial Hub
INSERT INTO branches (name, code, phone, email, address, is_active)
VALUES ('MEQ Wheels Bengaluru Hub', 'BLR-IND', '+91 98765 43210', 'hub.indiranagar@meqwheels.in', '100ft Road, Indiranagar, Bengaluru, Karnataka 560038', true)
ON CONFLICT (code) DO NOTHING;

-- Seed Official MEQ Wheels 14-Vehicle Fleet
INSERT INTO vehicles (custom_id, registration_number, brand, model, category, rental_price, security_deposit, status, notes)
VALUES
('VH-001', 'KA-01-MW-1001', 'Honda', 'Activa 2G', 'Scooter', 479, 1000, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹1,879 | Monthly: ₹4,784'),
('VH-002', 'KA-01-MW-1002', 'Honda', 'Activa 6G', 'Scooter', 549, 1000, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹2,149 | Monthly: ₹5,744'),
('VH-003', 'KA-01-MW-1003', 'Yamaha', 'Fascino 125', 'Scooter', 549, 1000, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹2,149 | Monthly: ₹5,744'),
('VH-004', 'KA-01-MW-1004', 'TVS', 'Raider 125', 'Motorcycle', 679, 1500, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹2,449 | Monthly: ₹6,749'),
('VH-005', 'KA-01-MW-1005', 'Honda', 'Shine 125', 'Motorcycle', 649, 1500, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹2,349 | Monthly: ₹6,449'),
('VH-006', 'KA-01-MW-1006', 'Yamaha', 'R15 V4', 'Sport', 979, 2500, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹4,779 | Monthly: ₹12,499'),
('VH-007', 'KA-01-MW-1007', 'Hero', 'Xpulse 200 4V', 'Motorcycle', 949, 2000, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹4,779 | Monthly: ₹11,449'),
('VH-008', 'KA-01-MW-1008', 'Royal Enfield', 'Classic 350', 'Cruiser', 1149, 2500, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹5,449 | Monthly: ₹12,779'),
('VH-009', 'KA-01-MW-1009', 'Royal Enfield', 'Hunter 350', 'Motorcycle', 1179, 2500, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹5,749 | Monthly: ₹13,779'),
('VH-010', 'KA-01-MW-1010', 'Royal Enfield', 'Meteor 350', 'Cruiser', 1349, 3000, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹6,449 | Monthly: ₹13,779'),
('VH-011', 'KA-01-MW-1011', 'Triumph', 'Speed 400', 'Sport', 1449, 3500, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹7,449 | Monthly: ₹16,449'),
('VH-012', 'KA-01-MW-1012', 'BMW', 'G310 R', 'Sport', 1479, 3500, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹8,449 | Monthly: ₹20,449'),
('VH-013', 'KA-01-MW-1013', 'Royal Enfield', 'Himalayan 450', 'Cruiser', 1779, 4000, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹9,449 | Monthly: ₹27,779'),
('VH-014', 'KA-01-MW-1014', 'Royal Enfield', 'Continental GT 650', 'Sport', 2249, 4000, 'available', 'Daily KM: 150 - 200 KM | Weekly: ₹10,779 | Monthly: ₹32,449')
ON CONFLICT (custom_id) DO UPDATE SET
  rental_price = EXCLUDED.rental_price,
  security_deposit = EXCLUDED.security_deposit,
  notes = EXCLUDED.notes;
