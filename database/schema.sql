-- ==================== COLLEGE UTILITY SYSTEM DATABASE SCHEMA ====================

-- Create Database
CREATE DATABASE IF NOT EXISTS college_utility;
USE college_utility;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'teacher') DEFAULT 'student',
    is_password_changed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- ==================== STUDENTS TABLE ====================
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT DEFAULT 1,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    address TEXT,
    profile_photo LONGBLOB,
    current_cgpa DECIMAL(3, 2) DEFAULT 0.00,
    total_credits_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_department (department),
    INDEX idx_semester (semester),
    INDEX idx_roll_number (roll_number)
);

-- ==================== COURSES TABLE ====================
CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    credit_hours INT DEFAULT 3,
    description TEXT,
    instructor_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_semester (semester),
    INDEX idx_department (department)
);

-- ==================== SUBJECTS TABLE ====================
CREATE TABLE IF NOT EXISTS subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject_name VARCHAR(150) NOT NULL,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    semester INT NOT NULL,
    credit_hours INT DEFAULT 3,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_semester (semester),
    INDEX idx_code (subject_code)
);

-- ==================== ENROLLMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status)
);

-- ==================== ATTENDANCE TABLE ====================
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave') DEFAULT 'absent',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status)
);

-- ==================== GRADES TABLE ====================
CREATE TABLE IF NOT EXISTS grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT NOT NULL,
    subject_id INT,
    assignment DECIMAL(5, 2) DEFAULT 0,
    midterm DECIMAL(5, 2) DEFAULT 0,
    final DECIMAL(5, 2) DEFAULT 0,
    total_marks DECIMAL(5, 2) DEFAULT 0,
    grade VARCHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_subject_id (subject_id)
);

-- ==================== NOTICES TABLE ====================
CREATE TABLE IF NOT EXISTS notices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    department VARCHAR(100),
    severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_department (department),
    INDEX idx_active (is_active)
);

-- ==================== PASSWORD HISTORY TABLE ====================
CREATE TABLE IF NOT EXISTS password_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    old_password VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- ==================== SAMPLE DATA ====================

-- Insert sample users
INSERT INTO users (name, email, password, role, is_password_changed) VALUES
('John Doe', 'john@college.edu', '$2a$10$YourHashedPasswordHere', 'student', true),
('Admin User', 'admin@college.edu', '$2a$10$YourHashedPasswordHere', 'admin', true);

-- Insert sample student
INSERT INTO students (user_id, student_id, roll_number, department, semester, phone_number, date_of_birth) VALUES
(1, 'STUCSE001', '001', 'CSE', 1, '9876543210', '2003-05-15');

-- Insert sample courses
INSERT INTO courses (name, code, department, semester, credit_hours, instructor_name) VALUES
('Data Structures', 'CS101', 'CSE', 1, 3, 'Dr. Smith'),
('Database Management', 'CS102', 'CSE', 1, 3, 'Dr. Johnson'),
('Web Development', 'CS103', 'CSE', 1, 4, 'Dr. Williams');

-- Insert sample subjects
INSERT INTO subjects (subject_name, subject_code, semester, credit_hours) VALUES
('Data Structures', 'CS101', 1, 3),
('Database Management', 'CS102', 1, 3),
('Web Development', 'CS103', 1, 4);

-- Insert sample notices
INSERT INTO notices (title, content, department, severity) VALUES
('Welcome to College', 'Welcome to our college system. Please fill your complete profile.', 'CSE', 'low'),
('Midterm Exams', 'Midterm exams will be held from next month. Prepare well!', 'CSE', 'high');
