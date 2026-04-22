CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     email VARCHAR(100) UNIQUE NOT NULL,
                                     password VARCHAR(255) NOT NULL,
                                     role VARCHAR(20) DEFAULT 'empleado',
                                     name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS products (
                                        id SERIAL PRIMARY KEY,
                                        name VARCHAR(100),
                                        price NUMERIC(10,2),
                                        stock INT
);

CREATE TABLE IF NOT EXISTS clients (
                                       id SERIAL PRIMARY KEY,
                                       name VARCHAR(100) NOT NULL,
                                       cedula VARCHAR(20) UNIQUE NOT NULL,
                                       phone VARCHAR(20),
                                       email VARCHAR(100),
                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
                                      id SERIAL PRIMARY KEY,
                                      user_id INT REFERENCES users(id),
                                      client_id INT REFERENCES clients(id),
                                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                      invoice_number VARCHAR(20) UNIQUE
);

CREATE TABLE IF NOT EXISTS cart_items (
                                          id SERIAL PRIMARY KEY,
                                          order_id INT REFERENCES orders(id) ON DELETE CASCADE,
                                          product_id INT REFERENCES products(id),
                                          quantity INT,
                                          price_at_sale NUMERIC(10,2)
);

-- Admin por defecto
INSERT INTO users (email, password, role, name)
VALUES (
           'admin@shopcart.com',
           '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
           'admin',
           'Administrador'
       ) ON CONFLICT (email) DO NOTHING;