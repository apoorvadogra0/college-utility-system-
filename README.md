# 🎓 College Utility System

A comprehensive college management system built with HTML, CSS, JavaScript (Frontend), Node.js + Express (Backend), and MySQL (Database).

## ✨ Features

### 👤 User Authentication
- Student registration with email and password
- Secure login with JWT tokens
- Role-based access control (Student, Faculty, Admin)
- Password hashing with bcryptjs

### 📊 Dashboard
- Overview of enrolled courses
- Current attendance percentage
- Current GPA calculation
- Number of active notices

### 📚 Course Management
- View enrolled courses
- Course details (code, instructor, credits, schedule)
- Course descriptions

### 📋 Attendance Tracking
- Track attendance for each course
- Visual attendance percentage bar
- Present/Absent/Leave records
- Attendance statistics

### 📈 Grade Management
- View grades for each course
- Assignment, Midterm, and Final marks
- Total marks calculation
- GPA calculation

### 📢 Notice Board
- College announcements and notices
- Categorized notices (Academic, Announcement, Placement, etc.)
- Latest notices displayed first
- Date-wise sorting

### 🎨 Responsive Design
- Mobile-friendly interface
- Tablet and desktop optimized
- Smooth animations and transitions
- Modern gradient UI

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive design with flexbox and grid
- **JavaScript (ES6+)** - Dynamic frontend logic and API interactions

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

## 📋 Project Structure

```
college-utility-system/
├── index.html           # Main HTML file
├── styles.css          # Styling
├── app.js              # Frontend JavaScript
├── server.js           # Express server
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── database/
│   └── schema.sql      # MySQL database schema
└── README.md           # Documentation
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone https://github.com/apoorvadogra0/college-utility-system-.git
cd college-utility-system-
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup MySQL Database

1. Open MySQL command line or MySQL Workbench
2. Run the schema file:
```bash
mysql -u root -p < database/schema.sql
```
Or copy-paste the contents of `database/schema.sql` in your MySQL client

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`
```bash
cp .env.example .env
```

2. Edit `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=college_utility
```

### Step 5: Start the Server
```bash
npm start
```

The server will start on `http://localhost:3000`

## 🔑 Default Credentials

After running the schema, you can login with:

**Student Account:**
- Email: `priya.sharma@college.com`
- Password: (create your own or register a new account)

Or register a new student account through the registration form.

## 📖 Usage

### Student Portal
1. **Register/Login** - Create account or login with existing credentials
2. **Dashboard** - View overview of courses, attendance, GPA, and notices
3. **Courses** - View all enrolled courses and their details
4. **Attendance** - Track attendance percentage for each course
5. **Grades** - View assignment, midterm, final grades, and GPA
6. **Notices** - Check college announcements and updates

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- SQL injection prevention with prepared statements
- CORS enabled for secure API access
- Authorization middleware for protected routes

## 📊 Database Schema

### Tables
1. **users** - User authentication and profiles
2. **students** - Student information
3. **courses** - Course details
4. **enrollments** - Student-Course relationships
5. **attendance** - Daily attendance records
6. **grades** - Grade information
7. **notices** - College announcements

## 🧪 Testing the API

You can test the API endpoints using Postman or cURL:

### Register
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@college.com",
  "password": "password123",
  "rollNumber": "2024001",
  "department": "CSE"
}
```

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@college.com",
  "password": "password123"
}
```

### Get Courses
```bash
GET http://localhost:3000/api/courses
Authorization: Bearer <token>
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### "Cannot connect to MySQL"
- Make sure MySQL service is running
- Verify credentials in `.env` file
- Check if `college_utility` database exists

### "Port 3000 already in use"
- Change the PORT in `.env` file
- Or kill the process using port 3000

### "CORS errors"
- Make sure frontend is running on `http://localhost:3000`
- Check CORS middleware in `server.js`

## 📞 Support

For issues and questions, please open an issue on GitHub.

## 🎯 Future Enhancements

- Admin dashboard for managing courses and students
- Email notifications for notices and grades
- GPA calculator with detailed analytics
- Timetable visualization
- Assignment submission portal
- Result analysis and performance reports
- Mobile app development
- Real-time notifications

---

**Made with ❤️ by Apoorva Dogra**
