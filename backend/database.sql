-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist to ensure clean slate for new schema
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS link_clicks CASCADE; -- dropping old name just in case
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS themes CASCADE;

-- 🎨 Themes Table
CREATE TABLE themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    background_color VARCHAR(50) NOT NULL, -- e.g., '#000000' or 'bg-black' if using classes
    button_color VARCHAR(50) NOT NULL,     -- e.g., '#ffffff'
    button_text_color VARCHAR(50) DEFAULT '#000000',
    font_family VARCHAR(50) DEFAULT 'Inter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 👤 Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    profile_image TEXT,
    bio TEXT,
    theme_id INTEGER REFERENCES themes(id) ON DELETE SET NULL,
    is_pro BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 🔗 Links Table
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    position INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 📊 Analytics Table
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    link_id UUID REFERENCES links(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(50), -- Added based on previous useful tracking
    referer TEXT,        -- Added useful tracking
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_analytics_link_id ON analytics(link_id);
CREATE INDEX idx_users_username ON users(username);

-- Seed Default Themes
INSERT INTO themes (name, background_color, button_color, button_text_color) VALUES 
('Classic White', '#ffffff', '#000000', '#ffffff'),
('Sleek Black', '#000000', '#ffffff', '#000000'),
('Ocean Blue', '#e0f2fe', '#0284c7', '#ffffff'),
('Forest Green', '#dcfce7', '#16a34a', '#ffffff');
