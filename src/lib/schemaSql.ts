export const SUPABASE_SCHEMA_SQL = `-- MEQ Wheels Essential Production Tables (100% Fail-Safe)

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

INSERT INTO branches (name, code, phone, email, address, is_active)
VALUES ('MEQ Wheels Bengaluru Hub', 'BLR-IND', '+91 98765 43210', 'hub.indiranagar@meqwheels.in', '100ft Road, Indiranagar, Bengaluru, Karnataka 560038', true)
ON CONFLICT (code) DO NOTHING;
`;
