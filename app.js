// API Base URL
const API_URL = 'http://localhost:3000/api';

// Current user
let currentUser = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (token) {
        currentUser = JSON.parse(localStorage.getItem('user'));
        showMainContent();
        loadDashboard();
    }
});

// ==================== AUTH FUNCTIONS ====================

// Switch Login/Register Tabs
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.remove('active');
    });

    document.querySelectorAll('.auth-form').forEach(f => {
        f.classList.remove('active');
    });

    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');

    // Clear error messages
    document.getElementById(tab + 'Error').textContent = '';
}

// Login Function
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
            headers: {
                'Content-Type': 'application/json'
            },
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
        console.error(error);
        errorEl.textContent = 'Server connection error';
    }
}

// Register Function
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password,
                rollNumber,
                department
            })
        });

        const data = await response.json();

        if (response.ok) {

            errorEl.style.color = '#27ae60';
            errorEl.textContent = 'Registration successful!';

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            currentUser = data.user;

            setTimeout(() => {
                showMainContent();
                loadDashboard();
            }, 1000);

        } else {
            errorEl.textContent = data.message || 'Registration failed';
        }

    } catch (error) {
        console.error(error);
        errorEl.textContent = 'Server connection error';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    currentUser = null;

    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

// Show Main Content
function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// ==================== NAVIGATION ====================

function showSection(sectionName) {

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.getElementById(sectionName + 'Section').classList.add('active');

    if (sectionName === 'courses') {
        loadCourses();
    }

    if (sectionName === 'attendance') {
        loadAttendance();
    }

    if (sectionName === 'grades') {
        loadGrades();
    }

    if (sectionName === 'notices') {
        loadNotices();
    }
}

// ==================== AUTH HEADER ====================

function getAuthHeader() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// ==================== DASHBOARD ====================

async function loadDashboard() {

    try {

        const [coursesRes, attendanceRes, gradesRes, noticesRes] = await Promise.all([

            fetch(`${API_URL}/courses`, {
                headers: getAuthHeader()
            }),

            fetch(`${API_URL}/attendance`, {
                headers: getAuthHeader()
            }),

            fetch(`${API_URL}/grades`, {
                headers: getAuthHeader()
            }),

            fetch(`${API_URL}/notices`, {
                headers: getAuthHeader()
            })

        ]);

        const courses = await coursesRes.json();
        const attendance = await attendanceRes.json();
        const grades = await gradesRes.json();
        const notices = await noticesRes.json();

        // Dashboard Cards
        document.getElementById('totalCourses').textContent = courses.length || 0;

        document.getElementById('totalNotices').textContent = notices.length || 0;

        // Attendance %
        if (attendance.length > 0) {

            const avgAttendance =
                attendance.reduce((sum, item) => sum + Number(item.percentage), 0)
                / attendance.length;

            document.getElementById('avgAttendance').textContent =
                avgAttendance.toFixed(1) + '%';

        } else {

            document.getElementById('avgAttendance').textContent = '0%';
        }

        // GPA
        if (grades.length > 0) {

            const avgMarks =
                grades.reduce((sum, item) => sum + Number(item.total), 0)
                / grades.length;

            const gpa = avgMarks / 10;

            document.getElementById('currentGPA').textContent =
                gpa.toFixed(2);

        } else {

            document.getElementById('currentGPA').textContent = '0.00';
        }

    } catch (error) {
        console.error('Dashboard Error:', error);
    }
}

// ==================== COURSES ====================

async function loadCourses() {

    try {

        const response = await fetch(`${API_URL}/courses`, {
            headers: getAuthHeader()
        });

        const courses = await response.json();

        const coursesList = document.getElementById('coursesList');

        coursesList.innerHTML = '';

        if (courses.length === 0) {
            coursesList.innerHTML = '<p>No courses found.</p>';
            return;
        }

        courses.forEach(course => {

            const card = document.createElement('div');

            card.className = 'course-card';

            card.innerHTML = `
                <h3>${course.name}</h3>
                <p><strong>Code:</strong> ${course.code}</p>
                <p><strong>Instructor:</strong> ${course.instructor}</p>
                <p><strong>Credits:</strong> ${course.credits}</p>
                <p><strong>Schedule:</strong> ${course.schedule}</p>
            `;

            coursesList.appendChild(card);

        });

    } catch (error) {
        console.error('Courses Error:', error);
    }
}

// ==================== ATTENDANCE ====================

async function loadAttendance() {

    try {

        const response = await fetch(`${API_URL}/attendance`, {
            headers: getAuthHeader()
        });

        const attendance = await response.json();

        const attendanceList = document.getElementById('attendanceList');

        attendanceList.innerHTML = '';

        if (attendance.length === 0) {

            attendanceList.innerHTML = '<p>No attendance records found.</p>';
            return;
        }

        attendance.forEach(record => {

            const percentage = Math.round(record.percentage);

            const item = document.createElement('div');

            item.className = 'attendance-item';

            item.innerHTML = `
                <h3>${record.courseName}</h3>

                <p>
                    Classes Attended:
                    ${record.present}/${record.total}
                </p>

                <div class="attendance-bar">
                    <div class="attendance-fill"
                        style="width:${percentage}%">
                    </div>
                </div>

                <p style="margin-top:10px; font-weight:bold; color:#667eea;">
                    ${percentage}% Attendance
                </p>
            `;

            attendanceList.appendChild(item);

        });

    } catch (error) {
        console.error('Attendance Error:', error);
    }
}

// ==================== GRADES ====================

async function loadGrades() {

    try {

        const response = await fetch(`${API_URL}/grades`, {
            headers: getAuthHeader()
        });

        const grades = await response.json();

        const gradesList = document.getElementById('gradesList');

        gradesList.innerHTML = '';

        if (grades.length === 0) {

            gradesList.innerHTML = '<p>No grades available.</p>';
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
                        <span class="grade-value">
                            ${grade.assignment}/10
                        </span>
                    </div>

                    <div class="grade-field">
                        <span class="grade-label">Midterm:</span>
                        <span class="grade-value">
                            ${grade.midterm}/20
                        </span>
                    </div>

                </div>

                <div class="grade-row">

                    <div class="grade-field">
                        <span class="grade-label">Final:</span>
                        <span class="grade-value">
                            ${grade.final}/50
                        </span>
                    </div>

                    <div class="grade-field">
                        <span class="grade-label">Total:</span>
                        <span class="grade-value">
                            ${grade.total}/100
                        </span>
                    </div>

                </div>
            `;

            gradesList.appendChild(card);

        });

    } catch (error) {
        console.error('Grades Error:', error);
    }
}

// ==================== NOTICES ====================

async function loadNotices() {

    try {

        const response = await fetch(`${API_URL}/notices`, {
            headers: getAuthHeader()
        });

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

            // FIXED MYSQL DATE FIELD
            const date = new Date(notice.created_at)
                .toLocaleDateString('en-IN');

            card.innerHTML = `
                <h3>${notice.title}</h3>

                <p class="notice-date">
                    ${date}
                </p>

                <p class="notice-content">
                    ${notice.content}
                </p>
            `;

            noticesList.appendChild(card);

        });

    } catch (error) {
        console.error('Notices Error:', error);
    }
}
