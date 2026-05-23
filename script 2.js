// Application State
let students = JSON.parse(localStorage.getItem('students')) || [
    { id: 'STU-001', name: 'Ahmed Jama', class: 'CS 2024', attendance: 95, photo: null },
    { id: 'STU-002', name: 'Zahib Qorahey', class: 'CS 2024', attendance: 88, photo: null },
    { id: 'STU-003', name: 'Adsamood', class: 'IT 2024', attendance: 45, photo: null },
    { id: 'STU-004', name: 'Abdulatif', class: 'IT 2024', attendance: 92, photo: null },
    { id: 'STU-005', name: 'Abdirahman Yusuf Qodax', class: 'CS 2024', attendance: 78, photo: null }
];

let attendanceLogs = JSON.parse(localStorage.getItem('attendanceLogs')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize last identified student from latest log
    if (attendanceLogs.length > 0) {
        const latestLog = attendanceLogs[attendanceLogs.length - 1];
        lastIdentifiedStudent = {
            name: latestLog.studentName,
            id: latestLog.studentId,
            date: latestLog.date,
            time: latestLog.time
        };
        updateLastIdentifiedUI();
    }

    updateDashboard();
    renderStudents();
    updateClock();
    displayWelcomeMessage();
    setInterval(updateClock, 1000);
});

// Welcome Message
function displayWelcomeMessage() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const welcomeEl = document.getElementById('welcome-message');
    if (user && user.name && welcomeEl) {
        welcomeEl.textContent = `Welcome ${user.name} to Smart Attendance System`;
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');

    // Update nav active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(sectionId.replace('-', ' '))) {
            item.classList.add('active');
        }
    });

    if (sectionId === 'mark-attendance') {
        startWebcam();
    } else {
        stopWebcam();
    }
}

// Clock
function updateClock() {
    const now = new Date();
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

// Dashboard Stats
function updateDashboard() {
    document.getElementById('total-students').textContent = students.length;

    const today = new Date().toLocaleDateString();
    const presentToday = attendanceLogs.filter(log => log.date === today).length;
    document.getElementById('present-today').textContent = presentToday;

    document.getElementById('absentees-count').textContent = students.length - presentToday;

    const avg = students.reduce((acc, s) => acc + s.attendance, 0) / students.length;
    document.getElementById('avg-attendance').textContent = `${Math.round(avg || 0)}%`;

    renderRecentActivity();
    renderTopAbsentees();
    renderFullReports();
}

function renderFullReports() {
    const tbody = document.getElementById('full-reports-body');
    if (!tbody) return;

    tbody.innerHTML = attendanceLogs.slice().reverse().map(log => `
        <tr>
            <td>${log.studentName}</td>
            <td>${log.studentId}</td>
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td><span class="status status-present">Present</span></td>
        </tr>
    `).join('');
}

// Render Students
function renderStudents(list = students) {
    const tbody = document.getElementById('students-list-body');
    if (!tbody) return;

    tbody.innerHTML = list.map(s => `
        <tr>
            <td><div style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg-glass); display: flex; align-items: center; justify-content: center;">👤</div></td>
            <td>${s.name}</td>
            <td>${s.id}</td>
            <td>${s.class}</td>
            <td>
                <div style="width: 100px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${s.attendance}%; height: 100%; background: ${s.attendance < 50 ? 'var(--accent)' : 'var(--primary)'};"></div>
                </div>
                <small>${s.attendance}%</small>
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn" style="padding: 0.25rem 0.5rem; background: transparent; border: 1px solid var(--border);" onclick="editStudent('${s.id}')">Edit</button>
                    <button class="btn" style="padding: 0.25rem 0.5rem; background: transparent; border: 1px solid var(--border); color: var(--accent);" onclick="deleteStudent('${s.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function searchStudents() {
    const term = document.getElementById('student-search').value.toLowerCase();
    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term) ||
        s.class.toLowerCase().includes(term)
    );
    renderStudents(filtered);
}

function editStudent(id) {
    const s = students.find(st => st.id === id);
    if (!s) return;
    const newName = prompt('Enter new name:', s.name);
    if (newName) {
        s.name = newName;
        localStorage.setItem('students', JSON.stringify(students));
        renderStudents();
        updateDashboard();
    }
}

// Render Activity
function renderRecentActivity() {
    const tbody = document.getElementById('activity-body');
    if (!tbody) return;

    tbody.innerHTML = attendanceLogs.slice(-5).reverse().map(log => `
        <tr>
            <td>${log.studentName}</td>
            <td>${log.studentId}</td>
            <td>${log.time}</td>
            <td><span class="status status-present">Present</span></td>
        </tr>
    `).join('');
}

// Render Absentees (in Reports)
function renderTopAbsentees() {
    const list = document.getElementById('absentee-list');
    if (!list) return;

    // Students with attendance < 75%
    const frequentAbsentees = students
        .filter(s => s.attendance < 75)
        .sort((a, b) => a.attendance - b.attendance);

    if (frequentAbsentees.length === 0) {
        list.innerHTML = '<li style="padding: 1rem; color: var(--text-secondary);">No frequent absentees identified.</li>';
        return;
    }

    list.innerHTML = frequentAbsentees.map(s => `
        <li style="padding: 0.75rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 500;">${s.name}</div>
                <small style="color: var(--text-secondary);">${s.id}</small>
            </div>
            <div style="text-align: right;">
                <span style="color: var(--accent); font-weight: 600;">${s.attendance}%</span>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Critical</div>
            </div>
        </li>
    `).join('');
}

// Generate Summary Report
function generateWeeklySummary() {
    // This would typically involve complex logic, here we simulate a breakdown
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const summary = days.map(day => ({
        day,
        present: Math.floor(Math.random() * students.length),
        total: students.length
    }));

    console.log("Weekly Summary Generated:", summary);
    // In a real app, this would update a chart
}

// Webcam Logic
let stream = null;
async function startWebcam() {
    const video = document.getElementById('video');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        document.getElementById('recognition-status').textContent = "Camera Ready. Point at face.";
    } catch (err) {
        document.getElementById('recognition-status').textContent = "Camera Access Denied.";
        console.error(err);
    }
}

function stopWebcam() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Simulated Attendance Marking
document.getElementById('start-scan-btn').addEventListener('click', () => {
    const status = document.getElementById('recognition-status');
    status.textContent = "Scanning...";

    // Simulate recognition delay
    setTimeout(() => {
        // Randomly pick a student for demo purposes
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        markAttendance(randomStudent.id);
        status.textContent = `Match Found: ${randomStudent.name}!`;

        // Visual feedback
        const videoContainer = document.getElementById('video-container');
        videoContainer.style.borderColor = "#4ade80";
        setTimeout(() => videoContainer.style.borderColor = "var(--primary)", 2000);
    }, 2000);
});

function markAttendance(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const now = new Date();
    const log = {
        studentId: student.id,
        studentName: student.name,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Prevent duplicate attendance for the same day
    const exists = attendanceLogs.some(l => l.studentId === student.id && l.date === log.date);
    if (!exists) {
        attendanceLogs.push(log);
        localStorage.setItem('attendanceLogs', JSON.stringify(attendanceLogs));
    }

    // Update Last Identified Card
    lastIdentifiedStudent = {
        name: student.name,
        id: student.id,
        date: log.date,
        time: log.time
    };
    updateLastIdentifiedUI();

    updateDashboard();
}

function updateLastIdentifiedUI() {
    if (!lastIdentifiedStudent) return;
    const nameEl = document.getElementById('last-identified-name');
    const timeEl = document.getElementById('last-identified-time');
    if (nameEl) nameEl.textContent = lastIdentifiedStudent.name;
    if (timeEl) timeEl.textContent = `Identified at ${lastIdentifiedStudent.time}`;
}

// Modal Logic
function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Add Student
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-student-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('student-name').value;
            const id = document.getElementById('student-id').value;
            const className = document.getElementById('student-class').value;

            students.push({
                id, name, class: className, attendance: 100, photo: null
            });

            localStorage.setItem('students', JSON.stringify(students));
            renderStudents();
            updateDashboard();
            closeModal('add-student-modal');
            e.target.reset();
        });
    }
});

function deleteStudent(id) {
    if (confirm('Are you sure you want to remove this student?')) {
        students = students.filter(s => s.id !== id);
        localStorage.setItem('students', JSON.stringify(students));
        renderStudents();
        updateDashboard();
    }
}

function saveSettings(e) {
    e.preventDefault();
    alert('Settings saved successfully!');
}

let lastIdentifiedStudent = null;

function printLastSlip() {
    if (!lastIdentifiedStudent) {
        // Fallback to latest registration if no scan done since page load
        if (attendanceLogs.length > 0) {
            const latest = attendanceLogs[attendanceLogs.length - 1];
            lastIdentifiedStudent = {
                name: latest.studentName,
                id: latest.studentId,
                date: latest.date,
                time: latest.time
            };
        } else {
            alert('No attendance records found yet.');
            return;
        }
    }

    // Fill the slip template
    document.getElementById('slip-name').textContent = lastIdentifiedStudent.name;
    document.getElementById('slip-id').textContent = lastIdentifiedStudent.id;
    document.getElementById('slip-date').textContent = lastIdentifiedStudent.date;
    document.getElementById('slip-time').textContent = lastIdentifiedStudent.time;

    // Print
    window.print();
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}
