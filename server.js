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

// ==================== MIDDLEWARE ====================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ==================== MYSQL CONNECTION ====================

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_utility',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==================== JWT SECRET ====================

const JWT_SECRET =
    process.env.JWT_SECRET ||
    'your_super_secret_jwt_key';

// ==================== UTILITY FUNCTIONS ====================

// Generate unique Student ID
function generateStudentId(deptCode, rollNumber) {
    return `STU${deptCode.toUpperCase()}${rollNumber}`;
}

// Generate temporary password
function generateTemporaryPassword() {
    return 'Temp@' + Math.random().toString(36).substring(2, 8);
}

// ==================== VERIFY TOKEN ====================

const verifyToken = (req, res, next) => {

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'No token provided'
        });
    }

    try {

        const decoded = jwt.verify(token, JWT_SECRET);

        req.userId = decoded.userId;

        next();

    } catch (error) {

        return res.status(401).json({
            message: 'Invalid token'
        });
    }
};

// ==================== HOME ROUTE ====================

app.get('/', (req, res) => {
    res.send('🎓 College Utility System API Running...');
});

// ==================== AUTH ROUTES ====================

// REGISTER
app.post('/api/auth/register', async (req, res) => {

    const {
        name,
        email,
        password,
        rollNumber,
        department,
        phoneNumber,
        dateOfBirth
    } = req.body;

    if (!name || !email || !password || !rollNumber || !department) {

        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    try {

        const connection = await pool.getConnection();

        // Check existing user
        const [existingUser] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {

            connection.release();

            return res.status(400).json({
                message: 'User already exists'
            });
        }

        // Hash Password
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // Insert User
        const [userResult] = await connection.query(
            `INSERT INTO users
            (name,email,password,role,is_password_changed)
            VALUES (?,?,?,?,?)`,
            [name, email, hashedPassword, 'student', true]
        );

        const userId = userResult.insertId;

        // Generate Student ID
        const studentId = generateStudentId(department.substring(0, 3), rollNumber);

        // Insert Student
        await connection.query(
            `INSERT INTO students
            (user_id, student_id, roll_number, department, semester, phone_number, date_of_birth)
            VALUES (?,?,?,?,?,?,?)`,
            [userId, studentId, rollNumber, department, 1, phoneNumber || null, dateOfBirth || null]
        );

        connection.release();

        // Generate JWT
        const token = jwt.sign(
            { userId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: userId,
                name,
                email,
                role: 'student',
                studentId
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {

        return res.status(400).json({
            message: 'Email and password required'
        });
    }

    try {

        const connection = await pool.getConnection();

        const [users] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        connection.release();

        if (users.length === 0) {

            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Compare Password
        const validPassword =
            await bcrypt.compare(password, user.password);

        if (!validPassword) {

            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                passwordChanged: user.is_password_changed
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== ADMIN: ADD STUDENT ====================

app.post('/api/admin/students/add', async (req, res) => {

    const {
        name,
        email,
        rollNumber,
        department,
        semester,
        phoneNumber,
        dateOfBirth,
        guardianName,
        guardianPhone,
        address
    } = req.body;

    if (!name || !email || !rollNumber || !department) {

        return res.status(400).json({
            message: 'Name, email, roll number, and department are required'
        });
    }

    try {

        const connection = await pool.getConnection();

        // Check existing user
        const [existingUser] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {

            connection.release();

            return res.status(400).json({
                message: 'Email already exists'
            });
        }

        // Generate temporary password
        const tempPassword = generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Insert User with temporary password
        const [userResult] = await connection.query(
            `INSERT INTO users
            (name, email, password, role, is_password_changed)
            VALUES (?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, 'student', false]
        );

        const userId = userResult.insertId;

        // Generate Student ID
        const studentId = generateStudentId(department.substring(0, 3), rollNumber);

        // Insert Student with enhanced information
        await connection.query(
            `INSERT INTO students
            (user_id, student_id, roll_number, department, semester, phone_number, 
             date_of_birth, guardian_name, guardian_phone, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                studentId,
                rollNumber,
                department,
                semester || 1,
                phoneNumber || null,
                dateOfBirth || null,
                guardianName || null,
                guardianPhone || null,
                address || null
            ]
        );

        connection.release();

        res.status(201).json({
            message: 'Student added successfully',
            student: {
                userId,
                studentId,
                name,
                email,
                temporaryPassword: tempPassword,
                note: 'Share this temporary password with the student. They must change it on first login.'
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== CHANGE PASSWORD ====================

app.post('/api/auth/change-password', verifyToken, async (req, res) => {

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            message: 'New passwords do not match'
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long'
        });
    }

    try {

        const connection = await pool.getConnection();

        // Get current user
        const [users] = await connection.query(
            'SELECT * FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            connection.release();
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const user = users[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (!validPassword) {
            connection.release();
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        // Store old password in history
        await connection.query(
            'INSERT INTO password_history (user_id, old_password) VALUES (?, ?)',
            [req.userId, user.password]
        );

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await connection.query(
            'UPDATE users SET password = ?, is_password_changed = ? WHERE id = ?',
            [hashedPassword, true, req.userId]
        );

        connection.release();

        res.json({
            message: 'Password changed successfully'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== COURSES ====================

// GET COURSES
app.get('/api/courses', verifyToken, async (req, res) => {

    try {

        const connection = await pool.getConnection();

        const [courses] = await connection.query(
            `
            SELECT c.*
            FROM courses c
            JOIN enrollments e
            ON c.id = e.course_id
            JOIN students s
            ON e.student_id = s.id
            WHERE s.user_id = ?
            `,
            [req.userId]
        );

        connection.release();

        res.json(courses);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== ATTENDANCE ====================

app.get('/api/attendance', verifyToken, async (req, res) => {

    try {

        const connection = await pool.getConnection();

        const [attendance] = await connection.query(
            `
            SELECT
                c.name AS courseName,
                c.id,
                COUNT(
                    CASE
                    WHEN a.status='present'
                    THEN 1
                    END
                ) AS present,

                COUNT(*) AS total,

                ROUND(
                    (
                        COUNT(
                            CASE
                            WHEN a.status='present'
                            THEN 1
                            END
                        ) / COUNT(*)
                    ) * 100
                ) AS percentage

            FROM attendance a

            JOIN enrollments e
            ON a.enrollment_id = e.id

            JOIN courses c
            ON e.course_id = c.id

            JOIN students s
            ON e.student_id = s.id

            WHERE s.user_id = ?

            GROUP BY c.id, c.name
            `,
            [req.userId]
        );

        connection.release();

        res.json(attendance);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== GRADES ====================

app.get('/api/grades', verifyToken, async (req, res) => {

    try {

        const connection = await pool.getConnection();

        const [grades] = await connection.query(
            `
            SELECT
                c.name AS courseName,
                g.*,
                (g.assignment + g.midterm + g.final) AS total

            FROM grades g

            JOIN enrollments e
            ON g.enrollment_id = e.id

            JOIN courses c
            ON e.course_id = c.id

            JOIN students s
            ON e.student_id = s.id

            WHERE s.user_id = ?
            `,
            [req.userId]
        );

        connection.release();

        res.json(grades);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== NOTICES ====================

app.get('/api/notices', verifyToken, async (req, res) => {

    try {

        const connection = await pool.getConnection();

        const [notices] = await connection.query(
            `
            SELECT *
            FROM notices
            ORDER BY created_at DESC
            LIMIT 20
            `
        );

        connection.release();

        res.json(notices);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== STUDENT PROFILE ====================

app.get('/api/students/profile', verifyToken, async (req, res) => {

    try {

        const connection = await pool.getConnection();

        const [student] = await connection.query(
            `
            SELECT
                s.*,
                u.name,
                u.email,
                u.is_password_changed

            FROM students s

            JOIN users u
            ON s.user_id = u.id

            WHERE u.id = ?
            `,
            [req.userId]
        );

        connection.release();

        if (student.length === 0) {

            return res.status(404).json({
                message: 'Student not found'
            });
        }

        res.json(student[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== UPDATE STUDENT PROFILE ====================

app.put('/api/students/profile', verifyToken, async (req, res) => {

    const {
        phoneNumber,
        dateOfBirth,
        guardianName,
        guardianPhone,
        address
    } = req.body;

    try {

        const connection = await pool.getConnection();

        // Get student ID
        const [student] = await connection.query(
            'SELECT id FROM students WHERE user_id = ?',
            [req.userId]
        );

        if (student.length === 0) {
            connection.release();
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        const studentId = student[0].id;

        // Update student profile
        await connection.query(
            `UPDATE students
            SET phone_number = ?, date_of_birth = ?, guardian_name = ?, 
                guardian_phone = ?, address = ?
            WHERE id = ?`,
            [
                phoneNumber || null,
                dateOfBirth || null,
                guardianName || null,
                guardianPhone || null,
                address || null,
                studentId
            ]
        );

        connection.release();

        res.json({
            message: 'Profile updated successfully'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== GET STUDENT BY STUDENT ID ====================

app.get('/api/students/:studentId', verifyToken, async (req, res) => {

    try {

        const connection = await pool.getConnection();

        const [student] = await connection.query(
            `
            SELECT
                s.*,
                u.name,
                u.email

            FROM students s

            JOIN users u
            ON s.user_id = u.id

            WHERE s.student_id = ?
            `,
            [req.params.studentId]
        );

        connection.release();

        if (student.length === 0) {

            return res.status(404).json({
                message: 'Student not found'
            });
        }

        res.json(student[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {

    console.error(err.stack);

    res.status(500).json({
        message: 'Something went wrong!'
    });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {

    console.log(`
🎓 College Utility System Server Running
🌐 http://localhost:${PORT}

📊 API:
http://localhost:${PORT}/api

✅ MySQL Connected Successfully
`);
});