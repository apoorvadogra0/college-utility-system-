const mysql = require('mysql2/promise');
const PDFDocument = require('pdfkit');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'college_utility'
});

// Download semester marksheet as PDF
exports.downloadMarksheet = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Get semester data
        const [semester] = await connection.query(`
            SELECT s.*, st.id as student_id, st.student_id, st.roll_number, st.registration_number,
                   st.department, u.name, u.email
            FROM semesters s
            JOIN students st ON s.student_id = st.id
            JOIN users u ON st.user_id = u.id
            WHERE s.id = ? AND st.user_id = ?
        `, [req.params.semesterId, req.userId]);
        
        if (semester.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Semester not found' });
        }
        
        const semesterData = semester[0];
        
        // Get subjects with marks
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
            LEFT JOIN marks m ON sub.id = m.subject_id AND m.student_id = ?
            WHERE sub.semester_id = ?
        `, [semesterData.student_id, req.params.semesterId]);
        
        connection.release();
        
        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Semester_${semesterData.semester_number}_Marksheet.pdf"`);
        doc.pipe(res);
        
        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('SEMESTER MARKSHEET', { align: 'center' });
        doc.moveDown(0.5);
        
        // Student Info
        doc.fontSize(11).font('Helvetica-Bold').text('Student Information:', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Name: ${semesterData.name}`);
        doc.text(`Student ID: ${semesterData.student_id}`);
        doc.text(`Roll Number: ${semesterData.roll_number}`);
        doc.text(`Department: ${semesterData.department}`);
        doc.text(`Semester: ${semesterData.semester_number}`);
        doc.text(`Academic Year: ${semesterData.academic_year}`);
        doc.moveDown(1);
        
        // Subjects Table
        doc.fontSize(11).font('Helvetica-Bold').text('Subject Details:', { underline: true });
        doc.moveDown(0.5);
        
        // Table headers
        const startX = 50;
        const col1X = startX;
        const col2X = startX + 150;
        const col3X = startX + 220;
        const col4X = startX + 280;
        const col5X = startX + 320;
        const col6X = startX + 360;
        
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Subject', col1X, doc.y);
        doc.text('Code', col2X, doc.y);
        doc.text('Internal', col3X, doc.y);
        doc.text('External', col4X, doc.y);
        doc.text('Grade', col5X, doc.y);
        doc.text('Status', col6X, doc.y);
        doc.moveDown(0.7);
        
        doc.font('Helvetica');
        subjects.forEach(subject => {
            doc.text(subject.subject_name.substring(0, 20), col1X, doc.y, { width: 130 });
            doc.text(subject.subject_code, col2X, doc.y - 15);
            doc.text(subject.internal_marks.toString(), col3X, doc.y - 15);
            doc.text(subject.external_marks.toString(), col4X, doc.y - 15);
            doc.text(subject.grade || 'N/A', col5X, doc.y - 15);
            doc.text(subject.result_status || 'N/A', col6X, doc.y - 15);
            doc.moveDown(1);
        });
        
        doc.moveDown(1);
        
        // Summary
        doc.fontSize(11).font('Helvetica-Bold').text('Semester Summary:', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`SGPA: ${semesterData.sgpa}`);
        doc.text(`Credits Earned: ${semesterData.total_credits}`);
        doc.text(`Status: ${semesterData.status}`);
        doc.moveDown(2);
        
        doc.fontSize(9).text('Generated on: ' + new Date().toLocaleDateString(), { align: 'center' });
        
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Download complete academic transcript
exports.downloadTranscript = async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Get student data
        const [studentData] = await connection.query(`
            SELECT s.*, u.name, u.email
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE u.id = ?
        `, [req.userId]);
        
        if (studentData.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const student = studentData[0];
        
        // Get all semesters
        const [semesters] = await connection.query(`
            SELECT *
            FROM semesters
            WHERE student_id = ?
            ORDER BY semester_number
        `, [student.id]);
        
        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Academic_Transcript_${student.student_id}.pdf"`);
        doc.pipe(res);
        
        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('ACADEMIC TRANSCRIPT', { align: 'center' });
        doc.moveDown(0.5);
        
        // Student Info
        doc.fontSize(11).font('Helvetica-Bold').text('Student Information:', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Name: ${student.name}`);
        doc.text(`Student ID: ${student.student_id}`);
        doc.text(`Roll Number: ${student.roll_number}`);
        doc.text(`Registration Number: ${student.registration_number}`);
        doc.text(`Department: ${student.department}`);
        doc.text(`Current Semester: ${student.semester}`);
        doc.moveDown(1);
        
        // Semester wise details
        for (let i = 0; i < semesters.length; i++) {
            const sem = semesters[i];
            
            doc.fontSize(11).font('Helvetica-Bold').text(`Semester ${sem.semester_number}`, { underline: true });
            doc.fontSize(10).font('Helvetica');
            doc.text(`Academic Year: ${sem.academic_year}`);
            doc.text(`SGPA: ${sem.sgpa}`);
            doc.text(`Credits: ${sem.total_credits}`);
            doc.moveDown(0.5);
            
            // Get subjects for this semester
            const [subjects] = await connection.query(`
                SELECT 
                    sub.*,
                    COALESCE(m.internal_marks, 0) as internal_marks,
                    COALESCE(m.external_marks, 0) as external_marks,
                    COALESCE(m.total_marks, 0) as total_marks,
                    m.grade
                FROM subjects sub
                LEFT JOIN marks m ON sub.id = m.subject_id AND m.student_id = ?
                WHERE sub.semester_id = ?
            `, [student.id, sem.id]);
            
            doc.fontSize(9).font('Helvetica');
            subjects.forEach(subject => {
                doc.text(`${subject.subject_name} (${subject.subject_code}): ${subject.grade || 'N/A'}`);
            });
            doc.moveDown(0.8);
        }
        
        // Overall Summary
        doc.fontSize(11).font('Helvetica-Bold').text('Overall Summary:', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`CGPA: ${student.current_cgpa}`);
        doc.text(`Total Credits Earned: ${student.total_credits_earned}`);
        doc.moveDown(2);
        
        doc.fontSize(9).text('Generated on: ' + new Date().toLocaleDateString(), { align: 'center' });
        
        connection.release();
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
