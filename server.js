const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MySQL Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_utility',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, rollNumber, department } = req.body;
    
    if (!name || !email || !password || !rollNumber || !department) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {
        const connection = await pool.getConnection();
        
        // Check if user exists
        const [existingUser] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            connection.release();
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        await connection.query(
            'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, hashedPassword, 'student']
        );
        
        // Get user ID
        const [user] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        const userId = user[0].id;
        
        // Create student profile
        await connection.query(
            'INSERT INTO students (user_id, roll_number, department, enrollment_date) VALUES (?, ?, ?, NOW())',
            [userId, rollNumber, department]
        );
        
        connection.release();
        
        // Generate token
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: userId, name, email, role: 'student' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    
    try {
        const connection = await pool.getConnection();
        
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        connection.release();
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== COURSES ROUTES ====================

// Get user's courses
app.get('/api/courses', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [courses] = await connection.query(
            `SELECT c.* FROM courses c
             JOIN enrollments e ON c.id = e.course_id
             JOIN students s ON e.student_id = s.id
             WHERE s.user_id = ?`,
            [req.userId]
        );
        
        connection.release();
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ATTENDANCE ROUTES ====================

// Get user's attendance
app.get('/api/attendance', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [attendance] = await connection.query(
            `SELECT c.name as courseName, c.id,
                    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
                    COUNT(*) as total,
                    ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(*)) * 100) as percentage
             FROM attendance a
             JOIN enrollments e ON a.enrollment_id = e.id
             JOIN courses c ON e.course_id = c.id
             JOIN students s ON e.student_id = s.id
             WHERE s.user_id = ?
             GROUP BY c.id, c.name`,
            [req.userId]
        );
        
        connection.release();
        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== GRADES ROUTES ====================

// Get user's grades
app.get('/api/grades', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [grades] = await connection.query(
            `SELECT c.name as courseName, g.*,
                    (g.assignment + g.midterm + g.final) as total
             FROM grades g
             JOIN enrollments e ON g.enrollment_id = e.id
             JOIN courses c ON e.course_id = c.id
             JOIN students s ON e.student_id = s.id
             WHERE s.user_id = ?`,
            [req.userId]
        );
        
        connection.release();
        res.json(grades);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== NOTICES ROUTES ====================

// Get all notices
app.get('/api/notices', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [notices] = await connection.query(
            'SELECT * FROM notices ORDER BY created_at DESC LIMIT 20'
        );
        
        connection.release();
        res.json(notices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== STUDENTS ROUTES ====================

// Get student profile
app.get('/api/students/profile', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [student] = await connection.query(
            `SELECT s.*, u.name, u.email
             FROM students s
             JOIN users u ON s.user_id = u.id
             WHERE u.id = ?`,
            [req.userId]
        );
        
        connection.release();
        
        if (student.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(student[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🎓 College Utility System Server running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`\n✅ Make sure MySQL is running with the 'college_utility' database`);
});
