-- Create Database
CREATE DATABASE IF NOT EXISTS college_utility;
USE college_utility;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'faculty', 'admin') DEFAULT 'student',
    is_password_changed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students Table (ENHANCED)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    semester INT DEFAULT 1,
    phone_number VARCHAR(15),
    date_of_birth DATE,
    address TEXT,
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(15),
    cgpa DECIMAL(3, 2) DEFAULT 0.00,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    instructor VARCHAR(100),
    credits INT DEFAULT 4,
    schedule VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave') DEFAULT 'absent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (enrollment_id, date)
);

-- Grades Table
CREATE TABLE IF NOT EXISTS grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    assignment INT DEFAULT 0,
    midterm INT DEFAULT 0,
    final INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_grade (enrollment_id)
);

-- Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Password History Table (NEW)
CREATE TABLE IF NOT EXISTS password_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    old_password VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample Data
INSERT INTO users (name, email, password, role, is_password_changed) VALUES
('Admin User', 'admin@college.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'admin', TRUE),
('Dr. John Smith', 'john.smith@college.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'faculty', TRUE),
('Priya Sharma', 'priya.sharma@college.com', '$2a$10$abcdefghijklmnopqrstuvwxyz', 'student', FALSE);

INSERT INTO students (user_id, student_id, roll_number, department, semester, phone_number, date_of_birth, guardian_name, cgpa, status) VALUES
(3, 'STUCSE2024001', '2024001', 'CSE', 2, '9876543210', '2005-06-15', 'Raj Sharma', 3.85, 'active');

INSERT INTO courses (name, code, instructor, credits, schedule, description) VALUES
('Data Structures', 'CS101', 'Dr. John Smith', 4, 'Mon, Wed, Fri 10:00-11:00 AM', 'Introduction to data structures and algorithms'),
('Web Development', 'CS201', 'Dr. John Smith', 4, 'Tue, Thu 2:00-3:30 PM', 'Full-stack web development with modern frameworks'),
('Database Management', 'CS301', 'Dr. John Smith', 3, 'Mon, Wed 1:00-2:00 PM', 'SQL and database design'),
('Software Engineering', 'CS401', 'Dr. John Smith', 4, 'Tue, Thu, Fri 3:00-4:00 PM', 'Software development lifecycle and design patterns');

INSERT INTO enrollments (student_id, course_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4);

INSERT INTO attendance (enrollment_id, date, status) VALUES
(1, '2026-05-01', 'present'),
(1, '2026-05-03', 'present'),
(1, '2026-05-05', 'absent'),
(1, '2026-05-08', 'present'),
(1, '2026-05-10', 'present'),
(2, '2026-05-02', 'present'),
(2, '2026-05-04', 'present'),
(2, '2026-05-09', 'absent'),
(2, '2026-05-11', 'present'),
(3, '2026-05-01', 'present'),
(3, '2026-05-03', 'present'),
(3, '2026-05-08', 'present'),
(3, '2026-05-10', 'present'),
(4, '2026-05-02', 'present'),
(4, '2026-05-04', 'present'),
(4, '2026-05-09', 'present'),
(4, '2026-05-11', 'present');

INSERT INTO grades (enrollment_id, assignment, midterm, final) VALUES
(1, 8, 18, 42),
(2, 7, 16, 38),
(3, 9, 19, 45),
(4, 8, 17, 40);

INSERT INTO notices (title, content, category) VALUES
('Semester Exams Schedule', 'The semester exams will be conducted from June 1st to June 15th. Check the notice board for detailed timetable.', 'Academic'),
('Library Timings Extended', 'Library timings have been extended from 7 AM to 10 PM on weekdays.', 'Announcement'),
('Placement Drive', 'Top companies will be visiting campus for placement drive on May 25th.', 'Placement'),
('Hostel Maintenance', 'Hostel maintenance work will be done from May 15th to May 20th.', 'Maintenance');

-- Create Indexes for better performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_student_user ON students(user_id);
CREATE INDEX idx_student_id ON students(student_id);
CREATE INDEX idx_student_status ON students(status);
CREATE INDEX idx_enrollment_student ON enrollments(student_id);
CREATE INDEX idx_enrollment_course ON enrollments(course_id);
CREATE INDEX idx_attendance_enrollment ON attendance(enrollment_id);
CREATE INDEX idx_grades_enrollment ON grades(enrollment_id);
