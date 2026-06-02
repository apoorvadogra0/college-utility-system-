const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_utility'
});

// Get student profile
exports.getProfile = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [student] = await connection.query(`
            SELECT 
                s.id,
                s.student_id,
                s.roll_number,
                s.registration_number,
                s.department,
                s.course,
                s.semester,
                s.phone_number,
                s.date_of_birth,
                s.guardian_name,
                s.guardian_phone,
                s.address,
                s.current_cgpa,
                s.total_credits_earned,
                u.name,
                u.email,
                u.profile_photo,
                u.is_password_changed
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE u.id = ?
        `, [req.userId]);
        
        if (student.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Student not found' });
        }
        
        connection.release();
        const profile = student[0];
        // Convert BLOB to base64 if exists
        if (profile.profile_photo) {
            profile.profile_photo = Buffer.from(profile.profile_photo).toString('base64');
        }
        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update student profile
exports.updateProfile = async (req, res) => {
    const { phoneNumber, dateOfBirth, guardianName, guardianPhone, address } = req.body;
    
    try {
        const connection = await pool.getConnection();
        
        const [student] = await connection.query(
            'SELECT id FROM students WHERE user_id = ?',
            [req.userId]
        );
        
        if (student.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const studentId = student[0].id;
        
        // Update student profile
        await connection.query(`
            UPDATE students
            SET phone_number = ?, date_of_birth = ?, guardian_name = ?, 
                guardian_phone = ?, address = ?
            WHERE id = ?
        `, [phoneNumber || null, dateOfBirth || null, guardianName || null, guardianPhone || null, address || null, studentId]);
        
        // Update profile photo if provided
        if (req.file) {
            await connection.query(
                'UPDATE users SET profile_photo = ? WHERE id = ?',
                [req.file.buffer, req.userId]
            );
        }
        
        connection.release();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dashboard data
exports.getDashboard = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [studentData] = await connection.query(`
            SELECT 
                s.id,
                s.student_id,
                s.roll_number,
                s.semester,
                s.current_cgpa,
                s.total_credits_earned,
                u.name,
                u.email,
                u.profile_photo
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE u.id = ?
        `, [req.userId]);
        
        if (studentData.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentData[0];
        const studentId = student.id;
        
        // Get current semester data
        const [semesterData] = await connection.query(`
            SELECT s.*, COUNT(sub.id) as total_subjects
            FROM semesters s
            LEFT JOIN subjects sub ON s.id = sub.semester_id
            WHERE s.student_id = ? AND s.status = 'ongoing'
            GROUP BY s.id
            LIMIT 1
        `, [studentId]);
        
        // Get overall attendance
        const [attendanceData] = await connection.query(`
            SELECT 
                COUNT(*) as total_classes,
                COUNT(CASE WHEN status = 'present' THEN 1 END) as classes_present,
                ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END) / COUNT(*)) * 100, 2) as attendance_percentage
            FROM attendance
            WHERE student_id = ?
        `, [studentId]);
        
        // Get recent notifications
        const [notifications] = await connection.query(`
            SELECT *
            FROM notifications
            WHERE student_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [studentId]);
        
        // Get recent notices
        const [notices] = await connection.query(`
            SELECT *
            FROM notices
            ORDER BY created_at DESC
            LIMIT 3
        `);
        
        connection.release();
        
        const dashboard = {
            student,
            currentSemester: semesterData[0] || null,
            attendance: attendanceData[0] || { attendance_percentage: 0, classes_present: 0, total_classes: 0 },
            notifications,
            notices
        };
        
        res.json(dashboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get notifications
exports.getNotifications = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [student] = await connection.query(
            'SELECT id FROM students WHERE user_id = ?',
            [req.userId]
        );
        
        if (student.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const [notifications] = await connection.query(`
            SELECT *
            FROM notifications
            WHERE student_id = ?
            ORDER BY created_at DESC
        `, [student[0].id]);
        
        connection.release();
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        await connection.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [req.params.notificationId]
        );
        
        connection.release();
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
