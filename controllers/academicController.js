const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_utility'
});

// Get all semesters
exports.getAllSemesters = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [semesters] = await connection.query(`
            SELECT s.*, COUNT(sub.id) as total_subjects
            FROM semesters s
            LEFT JOIN subjects sub ON s.id = sub.semester_id
            JOIN students st ON s.student_id = st.id
            WHERE st.user_id = ?
            GROUP BY s.id
            ORDER BY s.semester_number
        `, [req.userId]);
        
        connection.release();
        res.json(semesters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get semester details
exports.getSemesterDetails = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [semester] = await connection.query(`
            SELECT s.*
            FROM semesters s
            JOIN students st ON s.student_id = st.id
            WHERE s.id = ? AND st.user_id = ?
        `, [req.params.semesterId, req.userId]);
        
        if (semester.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Semester not found' });
        }
        
        connection.release();
        res.json(semester[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get semester subjects with marks
exports.getSemesterSubjects = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [subjects] = await connection.query(`
            SELECT 
                sub.*,
                COALESCE(m.internal_marks, 0) as internal_marks,
                COALESCE(m.external_marks, 0) as external_marks,
                COALESCE(m.total_marks, 0) as total_marks,
                m.grade,
                m.grade_point,
                m.result_status
            FROM subjects sub
            LEFT JOIN marks m ON sub.id = m.subject_id
            JOIN semesters s ON sub.semester_id = s.id
            JOIN students st ON s.student_id = st.id
            WHERE s.id = ? AND st.user_id = ? AND m.student_id = st.id
        `, [req.params.semesterId, req.userId]);
        
        connection.release();
        res.json(subjects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get subject marks
exports.getSubjectMarks = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [marks] = await connection.query(`
            SELECT m.*, sub.subject_name, sub.subject_code
            FROM marks m
            JOIN subjects sub ON m.subject_id = sub.id
            JOIN semesters s ON sub.semester_id = s.id
            JOIN students st ON s.student_id = st.id
            WHERE m.subject_id = ? AND m.student_id = st.id AND st.user_id = ?
        `, [req.params.subjectId, req.userId]);
        
        if (marks.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Marks not found' });
        }
        
        connection.release();
        res.json(marks[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get subject attendance
exports.getSubjectAttendance = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [attendance] = await connection.query(`
            SELECT 
                sub.subject_name,
                sub.subject_code,
                COUNT(*) as total_classes,
                COUNT(CASE WHEN a.status = 'present' THEN 1 END) as classes_present,
                ROUND((COUNT(CASE WHEN a.status = 'present' THEN 1 END) / COUNT(*)) * 100, 2) as attendance_percentage
            FROM attendance a
            JOIN subjects sub ON a.subject_id = sub.id
            JOIN semesters s ON sub.semester_id = s.id
            JOIN students st ON s.student_id = st.id
            WHERE a.subject_id = ? AND a.student_id = st.id AND st.user_id = ?
            GROUP BY a.subject_id
        `, [req.params.subjectId, req.userId]);
        
        if (attendance.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Attendance not found' });
        }
        
        connection.release();
        res.json(attendance[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get CGPA
exports.getCGPA = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [result] = await connection.query(`
            SELECT st.current_cgpa, st.total_credits_earned
            FROM students st
            WHERE st.user_id = ?
        `, [req.userId]);
        
        if (result.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Student not found' });
        }
        
        connection.release();
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get SGPA
exports.getSGPA = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [result] = await connection.query(`
            SELECT s.sgpa, s.semester_number, s.academic_year
            FROM semesters s
            JOIN students st ON s.student_id = st.id
            WHERE s.id = ? AND st.user_id = ?
        `, [req.params.semesterId, req.userId]);
        
        if (result.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Semester not found' });
        }
        
        connection.release();
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get total credits
exports.getTotalCredits = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        const [result] = await connection.query(`
            SELECT st.total_credits_earned
            FROM students st
            WHERE st.user_id = ?
        `, [req.userId]);
        
        if (result.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Student not found' });
        }
        
        connection.release();
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
