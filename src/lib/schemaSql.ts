export const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- MEQ WHEELS — COMPLETE PRODUCTION POSTGRESQL SCHEMA
-- Target Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==============================================================================
-- 2. TABLES
-- ==============================================================================

-- A. Branches (Operational Hubs)
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

CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);

-- B. User Profiles (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    phone VARCHAR(20),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON profiles(branch_id);

-- C. Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'verified' 
        CHECK (verification_status IN ('verified', 'pending', 'rejected')),
    notes TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    registration_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_archived ON customers(is_archived);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(verification_status);

-- D. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL 
        CHECK (category IN ('Scooter', 'Motorcycle', 'Sport', 'Cruiser', 'Electric')),
    rental_price NUMERIC(10,2) NOT NULL CHECK (rental_price > 0),
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 1000.00 CHECK (security_deposit >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available' 
        CHECK (status IN ('available', 'reserved', 'rented', 'maintenance', 'inactive')),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_reg ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_branch ON vehicles(branch_id);

-- E. Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL DEFAULT '10:00:00',
    return_date DATE NOT NULL,
    return_time TIME NOT NULL DEFAULT '10:00:00',
    rental_duration INTEGER NOT NULL CHECK (rental_duration >= 1),
    rental_amount NUMERIC(10,2) NOT NULL CHECK (rental_amount >= 0),
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
    advance_payment NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (advance_payment >= 0),
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    outstanding_balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (outstanding_balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' 
        CHECK (status IN ('confirmed', 'active', 'completed', 'cancelled', 'pending')),
    notes TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT chk_booking_dates CHECK (return_date >= pickup_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(pickup_date, return_date);

-- F. Strict Overlap Prevention Constraint (Exclusion using GiST)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_vehicle_rentals'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT no_overlapping_vehicle_rentals
        EXCLUDE USING gist (
            vehicle_id WITH =,
            tsrange(
                (pickup_date + pickup_time),
                (return_date + return_time),
                '[]'
            ) WITH &&
        ) WHERE (status IN ('confirmed', 'active'));
    END IF;
END $$;

-- G. Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_id VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL 
        CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'other')),
    transaction_reference VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type VARCHAR(20) NOT NULL 
        CHECK (payment_type IN ('rental', 'security_deposit', 'refund', 'advance', 'balance')),
    notes TEXT,
    recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(payment_type);

-- ==============================================================================
-- 3. AUTOMATED TRIGGERS
-- ==============================================================================

-- A. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_branches_updated_at ON branches;
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON vehicles;
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- B. Synchronize booking balance from payments
CREATE OR REPLACE FUNCTION sync_booking_balance_from_payments()
RETURNS TRIGGER AS $$
DECLARE
    target_booking_id UUID;
    total_paid NUMERIC(10,2);
    rent_total NUMERIC(10,2);
BEGIN
    target_booking_id := COALESCE(NEW.booking_id, OLD.booking_id);
    
    IF target_booking_id IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) INTO total_paid
        FROM payments
        WHERE booking_id = target_booking_id 
          AND payment_type IN ('rental', 'advance', 'balance');
          
        SELECT rental_amount INTO rent_total
        FROM bookings
        WHERE id = target_booking_id;
        
        UPDATE bookings
        SET amount_paid = total_paid,
            outstanding_balance = GREATEST(0, rent_total - total_paid)
        WHERE id = target_booking_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_booking_balance ON payments;
CREATE TRIGGER trg_sync_booking_balance
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION sync_booking_balance_from_payments();

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON profiles;
CREATE POLICY "Users can view own profile or admins view all" ON profiles
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins can manage profiles" ON profiles
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Branches
DROP POLICY IF EXISTS "Anyone can view active branches" ON branches;
DROP POLICY IF EXISTS "Anyone authenticated can view active branches" ON branches;
CREATE POLICY "Anyone can view active branches" ON branches
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage branches" ON branches;
CREATE POLICY "Admins can manage branches" ON branches
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Vehicles
DROP POLICY IF EXISTS "Users can view vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON vehicles;
CREATE POLICY "Users can view vehicles" ON vehicles
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Staff can manage vehicles" ON vehicles;
CREATE POLICY "Staff can manage vehicles" ON vehicles
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Customers
DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
CREATE POLICY "Staff can manage customers" ON customers
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Bookings
DROP POLICY IF EXISTS "Staff can manage bookings" ON bookings;
CREATE POLICY "Staff can manage bookings" ON bookings
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Payments
DROP POLICY IF EXISTS "Staff can manage payments" ON payments;
CREATE POLICY "Staff can manage payments" ON payments
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. SEED INITIAL HEADQUARTERS BRANCH
-- ==============================================================================
INSERT INTO branches (name, code, phone, email, address, is_active)
VALUES (
    'MEQ Wheels Bengaluru Hub',
    'BLR-IND',
    '+91 98765 43210',
    'hub.indiranagar@meqwheels.in',
    '100ft Road, Indiranagar, Bengaluru, Karnataka 560038',
    true
)
ON CONFLICT (code) DO NOTHING;
`;
