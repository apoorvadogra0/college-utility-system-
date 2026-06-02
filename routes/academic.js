const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const academicController = require('../controllers/academicController');

// Get all semesters for student
router.get('/semesters', verifyToken, academicController.getAllSemesters);

// Get specific semester details
router.get('/semesters/:semesterId', verifyToken, academicController.getSemesterDetails);

// Get subjects for a semester
router.get('/semesters/:semesterId/subjects', verifyToken, academicController.getSemesterSubjects);

// Get marks for a subject
router.get('/subjects/:subjectId/marks', verifyToken, academicController.getSubjectMarks);

// Get attendance for subject
router.get('/subjects/:subjectId/attendance', verifyToken, academicController.getSubjectAttendance);

// Get overall CGPA
router.get('/cgpa', verifyToken, academicController.getCGPA);

// Get semester wise SGPA
router.get('/sgpa/:semesterId', verifyToken, academicController.getSGPA);

// Get total credits earned
router.get('/credits', verifyToken, academicController.getTotalCredits);

module.exports = router;
