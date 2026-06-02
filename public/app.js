// API Base URL - Configure based on environment
const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentStudentData = null;
let performanceChart = null;
let attendanceChart = null;

// ==================== AUTH FUNCTIONS ====================

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(tab + 'Form').classList.add('active');
    event.target.classList.add('active');
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('loginError', 'Please fill all fields');
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
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showDashboard();
        } else {
            showError('loginError', data.message || 'Login failed');
        }
    } catch (error) {
        console.error(error);
        showError('loginError', 'Network error');
    }
}

async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const rollNumber = document.getElementById('registerRoll').value;
    const department = document.getElementById('registerDept').value;
    const phoneNumber = document.getElementById('registerPhone').value;
    
    if (!name || !email || !password || !rollNumber || !department) {
        showError('registerError', 'Please fill all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, rollNumber, department, phoneNumber })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            showDashboard();
        } else {
            showError('registerError', data.message || 'Registration failed');
        }
    } catch (error) {
        console.error(error);
        showError('registerError', 'Network error');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    location.reload();
}

// ==================== UI FUNCTIONS ====================

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        setTimeout(() => element.textContent = '', 5000);
    }
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionName + 'Section')?.classList.add('active');
    
    if (sectionName === 'semesters') {
        loadSemesters();
    } else if (sectionName === 'profile') {
        loadProfileForm();
    } else if (sectionName === 'attendance') {
        loadAttendance();
    } else if (sectionName === 'dashboard') {
        loadDashboard();
    }
}

function showDashboard() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'flex';
    loadDashboard();
}

// ==================== DASHBOARD ====================

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/student/dashboard`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load dashboard');
        
        const data = await response.json();
        currentStudentData = data;
        
        // Update profile sidebar
        updateProfileSidebar(data.student);
        
        // Update stats
        document.getElementById('cgpaValue').textContent = (data.student.current_cgpa || 3.5).toFixed(2);
        document.getElementById('creditsValue').textContent = data.student.total_credits_earned || 0;
        document.getElementById('attendanceValue').textContent = data.attendance.attendance_percentage + '%';
        document.getElementById('semesterValue').textContent = data.student.semester || 1;
        
        // Load notices
        loadNotices(data.notices);
        
        // Initialize charts with real data
        initializeCharts(data);
    } catch (error) {
        console.error(error);
        showError('dashboardError', 'Failed to load dashboard');
    }
}

function updateProfileSidebar(student) {
    document.getElementById('profilePhotoImg').src = student.profile_photo 
        ? `data:image/jpeg;base64,${student.profile_photo}`
        : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23FF8C00%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2280%22%3E?%3C/text%3E%3C/svg%3E';
    document.getElementById('profileName').textContent = student.name || 'Student';
    document.getElementById('profileRoll').textContent = student.roll_number || '-';
    document.getElementById('profileReg').textContent = student.student_id || '-';
    document.getElementById('profileDept').textContent = student.department || '-';
    document.getElementById('profileSem').textContent = student.semester || '-';
    document.getElementById('profileEmail').textContent = student.email || '-';
    document.getElementById('profilePhone').textContent = student.phone_number || '-';
}

function loadNotices(notices) {
    const noticesList = document.getElementById('recentNotices');
    noticesList.innerHTML = '';
    
    if (!notices || notices.length === 0) {
        noticesList.innerHTML = '<p>No notices available</p>';
        return;
    }
    
    notices.forEach(notice => {
        const noticeCard = document.createElement('div');
        noticeCard.className = 'notice-card';
        noticeCard.innerHTML = `
            <h4>${notice.title || 'Notice'}</h4>
            <p>${(notice.content || notice.message || 'No content').substring(0, 100)}...</p>
            <span class="notice-date">${new Date(notice.created_at).toLocaleDateString()}</span>
        `;
        noticesList.appendChild(noticeCard);
    });
}

function initializeCharts(data = {}) {
    // Performance Chart - using semester data or defaults
    const performanceCtx = document.getElementById('performanceChart')?.getContext('2d');
    if (performanceCtx) {
        if (performanceChart) performanceChart.destroy();
        
        const semesterCount = (data.student?.semester || 6);
        const labels = Array.from({length: semesterCount}, (_, i) => `Sem ${i + 1}`);
        const sgpaData = data.student?.sgpa_data || Array.from({length: semesterCount}, () => (Math.random() * 1 + 3).toFixed(2));
        
        performanceChart = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'SGPA',
                    data: sgpaData,
                    borderColor: '#FF8C00',
                    backgroundColor: 'rgba(255, 140, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, max: 4.0 }
                }
            }
        });
    }
    
    // Attendance Chart
    const attendanceCtx = document.getElementById('attendanceChart')?.getContext('2d');
    if (attendanceCtx) {
        if (attendanceChart) attendanceChart.destroy();
        
        const attendancePercent = data.attendance?.attendance_percentage || 85;
        const absentPercent = 100 - attendancePercent;
        
        attendanceChart = new Chart(attendanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent'],
                datasets: [{
                    data: [attendancePercent, absentPercent],
                    backgroundColor: ['#27ae60', '#e74c3c']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

// ==================== SEMESTERS ====================

async function loadSemesters() {
    try {
        const response = await fetch(`${API_URL}/academic/semesters`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load semesters');
        
        const semesters = await response.json();
        
        const tabsContainer = document.getElementById('semesterTabs');
        tabsContainer.innerHTML = '';
        
        semesters.forEach((sem, index) => {
            const btn = document.createElement('button');
            btn.className = `semester-tab ${index === 0 ? 'active' : ''}`;
            btn.textContent = `Semester ${sem.semester_number}`;
            btn.onclick = () => loadSemesterDetails(sem.id);
            tabsContainer.appendChild(btn);
        });
        
        if (semesters.length > 0) {
            loadSemesterDetails(semesters[0].id);
        }
    } catch (error) {
        console.error(error);
        showError('semesterError', 'Failed to load semesters');
    }
}

async function loadSemesterDetails(semesterId) {
    try {
        const response = await fetch(`${API_URL}/academic/semesters/${semesterId}/subjects`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load semester details');
        
        const subjects = await response.json();
        
        document.querySelectorAll('.semester-tab').forEach(t => t.classList.remove('active'));
        event.target?.classList.add('active');
        
        const content = document.getElementById('semesterContent');
        content.innerHTML = '';
        
        if (!subjects || subjects.length === 0) {
            content.innerHTML = '<p>No subjects available for this semester</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'subject-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Subject Name</th>
                    <th>Code</th>
                    <th>Internal</th>
                    <th>External</th>
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${subjects.map(sub => `
                    <tr>
                        <td>${sub.subject_name || 'N/A'}</td>
                        <td>${sub.subject_code || 'N/A'}</td>
                        <td>${(sub.internal_marks || 0).toFixed(2)}</td>
                        <td>${(sub.external_marks || 0).toFixed(2)}</td>
                        <td>${(sub.total_marks || 0).toFixed(2)}</td>
                        <td>${sub.grade || 'N/A'}</td>
                        <td><span class="grade-badge ${sub.result_status === 'PASS' ? 'pass' : 'fail'}">${sub.result_status || 'N/A'}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        content.appendChild(table);
        
        // Add download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-primary';
        downloadBtn.textContent = '📄 Download Marksheet';
        downloadBtn.style.marginTop = '1rem';
        downloadBtn.onclick = () => downloadMarksheet(semesterId);
        content.appendChild(downloadBtn);
    } catch (error) {
        console.error(error);
        showError('semesterError', 'Failed to load semester details');
    }
}

async function downloadMarksheet(semesterId) {
    try {
        alert('Marksheet download feature coming soon!');
        // Implementation for PDF generation can be added here
    } catch (error) {
        console.error(error);
        alert('Failed to download marksheet');
    }
}

// ==================== PROFILE ====================

async function loadProfileForm() {
    try {
        const response = await fetch(`${API_URL}/student/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load profile');
        
        const profile = await response.json();
        
        document.getElementById('editName').value = profile.name || '';
        document.getElementById('editEmail').value = profile.email || '';
        document.getElementById('editRoll').value = profile.roll_number || '';
        document.getElementById('editDept').value = profile.department || '';
        document.getElementById('editPhone').value = profile.phone_number || '';
        document.getElementById('editDOB').value = profile.date_of_birth || '';
        document.getElementById('editGuardian').value = profile.guardian_name || '';
        document.getElementById('editGuardianPhone').value = profile.guardian_phone || '';
        document.getElementById('editAddress').value = profile.address || '';
    } catch (error) {
        console.error(error);
        showError('profileError', 'Failed to load profile');
    }
}

async function updateProfile() {
    const formData = new FormData();
    formData.append('phoneNumber', document.getElementById('editPhone').value);
    formData.append('dateOfBirth', document.getElementById('editDOB').value);
    formData.append('guardianName', document.getElementById('editGuardian').value);
    formData.append('guardianPhone', document.getElementById('editGuardianPhone').value);
    formData.append('address', document.getElementById('editAddress').value);
    
    const photoFile = document.getElementById('photoUpload').files[0];
    if (photoFile) {
        formData.append('profilePhoto', photoFile);
    }
    
    try {
        const response = await fetch(`${API_URL}/student/profile`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });
        
        if (response.ok) {
            alert('Profile updated successfully');
            loadDashboard();
        } else {
            alert('Failed to update profile');
        }
    } catch (error) {
        console.error(error);
        alert('Network error');
    }
}

// ==================== ATTENDANCE ====================

async function loadAttendance() {
    try {
        const response = await fetch(`${API_URL}/student/dashboard`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load attendance');
        
        const data = await response.json();
        const attendance = data.attendance;
        
        const container = document.getElementById('attendanceList');
        container.innerHTML = '';
        
        const item = document.createElement('div');
        item.className = 'attendance-item';
        item.innerHTML = `
            <h4>Overall Attendance</h4>
            <div class="attendance-bar">
                <div class="attendance-fill" style="width: ${attendance.attendance_percentage}%">${attendance.attendance_percentage}%</div>
            </div>
            <p>Present: ${attendance.classes_present} / ${attendance.total_classes} classes</p>
        `;
        container.appendChild(item);
    } catch (error) {
        console.error(error);
        showError('attendanceError', 'Failed to load attendance');
    }
}

// ==================== DARK MODE ====================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// ==================== INITIALIZATION ====================

window.addEventListener('load', () => {
    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    // Check if logged in
    if (authToken) {
        showDashboard();
    } else {
        document.getElementById('authSection').style.display = 'flex';
        document.getElementById('mainContent').style.display = 'none';
    }
});
