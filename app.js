// API Base URL
const API_URL = 'http://localhost:3000/api';

// Current user
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        currentUser = JSON.parse(localStorage.getItem('user'));
        showMainContent();
        loadDashboard();
    }
});

// Auth Functions
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
    
    // Clear error messages
    document.getElementById(tab + 'Error').textContent = '';
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    if (!email || !password) {
        errorEl.textContent = 'Please fill all fields';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showMainContent();
            loadDashboard();
        } else {
            errorEl.textContent = data.message || 'Login failed';
        }
    } catch (error) {
        errorEl.textContent = 'Error connecting to server';
        console.error(error);
    }
}

async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const rollNumber = document.getElementById('registerRoll').value;
    const department = document.getElementById('registerDept').value;
    const errorEl = document.getElementById('registerError');
    
    if (!name || !email || !password || !rollNumber || !department) {
        errorEl.textContent = 'Please fill all fields';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, rollNumber, department })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            errorEl.style.color = '#27ae60';
            errorEl.textContent = 'Registration successful! Logging in...';
            setTimeout(() => {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                currentUser = data.user;
                showMainContent();
                loadDashboard();
            }, 1500);
        } else {
            errorEl.textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        errorEl.textContent = 'Error connecting to server';
        console.error(error);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// Section Navigation
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionName + 'Section').classList.add('active');
    
    // Load data for the section
    if (sectionName === 'courses') loadCourses();
    else if (sectionName === 'attendance') loadAttendance();
    else if (sectionName === 'grades') loadGrades();
    else if (sectionName === 'notices') loadNotices();
}

// Get authorization header
function getAuthHeader() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// Load Dashboard
async function loadDashboard() {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch all data
        const [coursesRes, attendanceRes, gradesRes, noticesRes] = await Promise.all([
            fetch(`${API_URL}/courses`, { headers: getAuthHeader() }),
            fetch(`${API_URL}/attendance`, { headers: getAuthHeader() }),
            fetch(`${API_URL}/grades`, { headers: getAuthHeader() }),
            fetch(`${API_URL}/notices`, { headers: getAuthHeader() })
        ]);
        
        const courses = await coursesRes.json();
        const attendance = await attendanceRes.json();
        const grades = await gradesRes.json();
        const notices = await noticesRes.json();
        
        // Update dashboard stats
        document.getElementById('totalCourses').textContent = courses.length || 0;
        document.getElementById('totalNotices').textContent = notices.length || 0;
        
        // Calculate average attendance
        if (attendance.length > 0) {
            const avgAtt = attendance.reduce((sum, item) => sum + item.percentage, 0) / attendance.length;
            document.getElementById('avgAttendance').textContent = avgAtt.toFixed(1) + '%';
        }
        
        // Calculate GPA
        if (grades.length > 0) {
            const totalGpa = grades.reduce((sum, item) => sum + (item.total || 0), 0) / grades.length / 10;
            document.getElementById('currentGPA').textContent = totalGpa.toFixed(2);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load Courses
async function loadCourses() {
    try {
        const response = await fetch(`${API_URL}/courses`, { headers: getAuthHeader() });
        const courses = await response.json();
        
        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = '';
        
        if (courses.length === 0) {
            coursesList.innerHTML = '<p>No courses enrolled yet.</p>';
            return;
        }
        
        courses.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <h3>${course.name}</h3>
                <p><strong>Code:</strong> ${course.code}</p>
                <p><strong>Instructor:</strong> ${course.instructor}</p>
                <p><strong>Credits:</strong> ${course.credits}</p>
                <p><strong>Schedule:</strong> ${course.schedule}</p>
            `;
            coursesList.appendChild(courseCard);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Load Attendance
async function loadAttendance() {
    try {
        const response = await fetch(`${API_URL}/attendance`, { headers: getAuthHeader() });
        const attendance = await response.json();
        
        const attendanceList = document.getElementById('attendanceList');
        attendanceList.innerHTML = '';
        
        if (attendance.length === 0) {
            attendanceList.innerHTML = '<p>No attendance records found.</p>';
            return;
        }
        
        attendance.forEach(record => {
            const item = document.createElement('div');
            item.className = 'attendance-item';
            const percentage = Math.round(record.percentage);
            item.innerHTML = `
                <h3>${record.courseName}</h3>
                <p>Classes Attended: ${record.present}/${record.total}</p>
                <div class="attendance-bar">
                    <div class="attendance-fill" style="width: ${percentage}%"></div>
                </div>
                <p style="margin-top: 0.5rem; color: #667eea; font-weight: bold;">${percentage}% Attendance</p>
            `;
            attendanceList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

// Load Grades
async function loadGrades() {
    try {
        const response = await fetch(`${API_URL}/grades`, { headers: getAuthHeader() });
        const grades = await response.json();
        
        const gradesList = document.getElementById('gradesList');
        gradesList.innerHTML = '';
        
        if (grades.length === 0) {
            gradesList.innerHTML = '<p>No grades available yet.</p>';
            return;
        }
        
        grades.forEach(grade => {
            const card = document.createElement('div');
            card.className = 'grade-card';
            card.innerHTML = `
                <h3>${grade.courseName}</h3>
                <div class="grade-row">
                    <div class="grade-field">
                        <span class="grade-label">Assignment:</span>
                        <span class="grade-value">${grade.assignment}/10</span>
                    </div>
                    <div class="grade-field">
                        <span class="grade-label">Midterm:</span>
                        <span class="grade-value">${grade.midterm}/20</span>
                    </div>
                </div>
                <div class="grade-row">
                    <div class="grade-field">
                        <span class="grade-label">Final:</span>
                        <span class="grade-value">${grade.final}/50</span>
                    </div>
                    <div class="grade-field">
                        <span class="grade-label">Total:</span>
                        <span class="grade-value">${grade.total}/100</span>
                    </div>
                </div>
            `;
            gradesList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading grades:', error);
    }
}

// Load Notices
async function loadNotices() {
    try {
        const response = await fetch(`${API_URL}/notices`, { headers: getAuthHeader() });
        const notices = await response.json();
        
        const noticesList = document.getElementById('noticesList');
        noticesList.innerHTML = '';
        
        if (notices.length === 0) {
            noticesList.innerHTML = '<p>No notices available.</p>';
            return;
        }
        
        notices.forEach(notice => {
            const card = document.createElement('div');
            card.className = 'notice-card';
            const date = new Date(notice.createdAt).toLocaleDateString('en-IN');
            card.innerHTML = `
                <h3>${notice.title}</h3>
                <p class="notice-date">${date}</p>
                <p class="notice-content">${notice.content}</p>
            `;
            noticesList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading notices:', error);
    }
}
