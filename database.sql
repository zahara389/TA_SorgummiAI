-- Database Schema for Sorgum App
-- Create tables

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(128) UNIQUE, -- Compat with Firebase UID if needed, or just use ID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    photo VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status ENUM('Published', 'Draft') DEFAULT 'Published',
    content TEXT NOT NULL,
    description TEXT,
    duration VARCHAR(50),
    totalMateri INT DEFAULT 0,
    image VARCHAR(255),
    thumbnail VARCHAR(255),
    author VARCHAR(100),
    readTime VARCHAR(50),
    views INT DEFAULT 0,
    helpful INT DEFAULT 0,
    notHelpful INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    image VARCHAR(255),
    thumbnail VARCHAR(255),
    status ENUM('Published', 'Draft') DEFAULT 'Published',
    author VARCHAR(100),
    readTime VARCHAR(50),
    level VARCHAR(50),
    toc_title VARCHAR(255),
    tips TEXT,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    step_id VARCHAR(50),
    title VARCHAR(255),
    content TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    text TEXT,
    sender ENUM('user', 'bot'),
    steps JSON, -- Store steps array as JSON
    quick_actions JSON, -- Store quick actions as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faq (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_role VARCHAR(50) DEFAULT 'all', -- user, admin, all
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_email VARCHAR(255),
    guide_id VARCHAR(100), -- Can be article_id or product_id
    type ENUM('article', 'product', 'general') DEFAULT 'general',
    message TEXT NOT NULL,
    status ENUM('BARU', 'DITINJAU', 'SELESAI') DEFAULT 'BARU',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS article_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT,
    user_id INT,
    is_helpful BOOLEAN,
    user_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (article_id, user_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    article_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS article_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    article_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    product_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


-- AI Chatbot Monitoring Tables
CREATE TABLE IF NOT EXISTS chat_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_name VARCHAR(255),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'TIMEOUT', 'RETRY') DEFAULT 'SUCCESS',
    latency INT DEFAULT 0, -- Response time in milliseconds
    tokens INT DEFAULT 0, -- Tokens used in API call
    confidence DECIMAL(3, 2) DEFAULT 0.00, -- AI confidence level (0-1)
    error_message TEXT, -- If status is FAILED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    avg_latency INT DEFAULT 0, -- Average latency in ms
    token_usage INT DEFAULT 0, -- Average tokens per interaction
    success_rate DECIMAL(5, 2) DEFAULT 0.00, -- Percentage (0-100)
    total_interactions INT DEFAULT 0, -- Total count
    total_success INT DEFAULT 0,
    total_failed INT DEFAULT 0,
    total_timeout INT DEFAULT 0,
    total_retry INT DEFAULT 0,
    api_errors INT DEFAULT 0, -- Total Gemini API errors
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_metrics (id)
);

CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL,
    user_id INT,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED') DEFAULT 'OPEN',
    occurrences INT DEFAULT 1, -- How many times AI couldn't answer
    confidence DECIMAL(3, 2) DEFAULT 0.00, -- AI confidence level when gap detected
    error_type VARCHAR(100), -- Type of error: NOT_FOUND, LOW_CONFIDENCE, API_ERROR, FAQ_NOT_MATCHED
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_errors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL, -- GEMINI_API_ERROR, TIMEOUT, RATE_LIMIT, CONNECTION_ERROR, etc
    error_message TEXT NOT NULL,
    error_code VARCHAR(50),
    details JSON, -- Additional error details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_error_type (error_type),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS ai_training_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_faqs INT DEFAULT 0,
    total_articles INT DEFAULT 0,
    total_products INT DEFAULT 0,
    training_status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED') DEFAULT 'COMPLETED',
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_training_at TIMESTAMP,
    notes TEXT
);

-- RAG Knowledge Management Tables
CREATE TABLE IF NOT EXISTS knowledge_files (
    id VARCHAR(128) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL,
    uploaded_by VARCHAR(255) DEFAULT 'Administrator',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PROCESSING', 'INDEXED', 'FAILED') DEFAULT 'PROCESSING',
    version INT DEFAULT 1,
    url VARCHAR(255) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id VARCHAR(128) PRIMARY KEY,
    knowledge_file_id VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    chunk_index INT NOT NULL,
    embedding JSON, -- Menyimpan array vector float (misalnya 768 dimensi dari text-embedding-004)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (knowledge_file_id) REFERENCES knowledge_files(id) ON DELETE CASCADE
);

-- QUERY LOGIKA UNTUK UPDATE METRIC COUNTER "Knowledge Summary" DI UI:
-- 1. Total Files:
--    SELECT COUNT(*) FROM knowledge_files WHERE status = 'INDEXED';
-- 2. Total Chunks / Total Embeddings (karena setiap chunk memiliki embedding):
--    SELECT COUNT(*) FROM knowledge_chunks WHERE embedding IS NOT NULL;
-- 3. Last Training:
--    SELECT trained_at FROM ai_training_metadata ORDER BY trained_at DESC LIMIT 1;

