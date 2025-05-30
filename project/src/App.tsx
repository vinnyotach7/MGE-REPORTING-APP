import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useHistory } from 'react-router-dom';
import { ClipboardList, Users, Building2, LogOut, Calendar, CheckCircle, Home, Clock, Briefcase as BriefcaseBusiness } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  tasks: Task[];
  members: string[];
  manager?: string;
}

interface DailyReport {
  id: string;
  userId: string;
  departmentId: string;
  taskId: string;
  description: string;
  timeSpent: number;
  date: string;
}

interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'present' | 'wfh' | 'leave';
}

interface ReportEntry {
  taskId: string;
  description: string;
  timeSpent: string;
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('departments');
    const parsedDepartments = saved ? JSON.parse(saved) : [];
    return parsedDepartments
      .filter((dept: Department) => dept.name.toLowerCase() !== 'sales')
      .map((dept: Department) => ({
        ...dept,
        tasks: dept.tasks || [],
        members: dept.members || [],
        manager: dept.manager || null
      }));
  });
  
  const [currentUser, setCurrentUser] = useState('');
  const [reports, setReports] = useState<DailyReport[]>(() => {
    const saved = localStorage.getItem('reports');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('leaveRequests');
    return saved ? JSON.parse(saved) : [];
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('holidays');
    return saved ? JSON.parse(saved) : [
      {
        id: crypto.randomUUID(),
        name: "New Year's Day",
        date: "2024-01-01",
        description: "New Year's Day Celebration"
      },
      {
        id: crypto.randomUUID(),
        name: "Independence Day",
        date: "2024-07-04",
        description: "Independence Day Celebration"
      }
    ];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('attendance');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  useEffect(() => {
    localStorage.setItem('holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem('attendance', JSON.stringify(attendance));
  }, [attendance]);

  const AdminDashboard = () => {
    const [newDepartment, setNewDepartment] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [newTask, setNewTask] = useState('');
    const [newMember, setNewMember] = useState('');
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<string>('');
    const [selectedWeek, setSelectedWeek] = useState(format(new Date(), 'yyyy-MM-dd'));

    const allStaffMembers = Array.from(
      new Set(departments.flatMap(dept => dept.members))
    ).sort();

    const weekStart = new Date(selectedWeek);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const staffReports = reports
      .filter(report => {
        const reportDate = new Date(report.date);
        return (!selectedStaff || report.userId === selectedStaff) &&
               reportDate >= weekStart &&
               reportDate <= weekEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleAddDepartment = () => {
      if (newDepartment.trim()) {
        const department: Department = {
          id: crypto.randomUUID(),
          name: newDepartment,
          tasks: [],
          members: []
        };
        setDepartments([...departments, department]);
        setNewDepartment('');
      }
    };

    const handleAddTask = () => {
      if (selectedDepartment && newTask.trim()) {
        setDepartments(departments.map(dept => {
          if (dept.id === selectedDepartment) {
            return {
              ...dept,
              tasks: [...(dept.tasks || []), { id: crypto.randomUUID(), name: newTask }]
            };
          }
          return dept;
        }));
        setNewTask('');
      }
    };

    const handleAddMember = () => {
      if (selectedDepartment && newMember.trim()) {
        setDepartments(departments.map(dept => {
          if (dept.id === selectedDepartment) {
            return {
              ...dept,
              members: [...(dept.members || []), newMember]
            };
          }
          return dept;
        }));
        setNewMember('');
      }
    };

    const handleAssignManager = (departmentId: string, memberId: string) => {
      setDepartments(departments.map(dept => {
        if (dept.id === departmentId) {
          return {
            ...dept,
            manager: memberId
          };
        }
        return dept;
      }));
    };

    const handleUpdateDepartment = () => {
      if (editingDepartment) {
        setDepartments(departments.map(dept =>
          dept.id === editingDepartment.id ? editingDepartment : dept
        ));
        setEditingDepartment(null);
      }
    };

    const handleApproveLeave = (requestId: string, status: 'approved' | 'rejected') => {
      setLeaveRequests(leaveRequests.map(request =>
        request.id === requestId ? { ...request, status } : request
      ));
    };

    const getTaskName = (departmentId: string, taskId: string) => {
      return departments
        .find(dept => dept.id === departmentId)
        ?.tasks.find(task => task.id === taskId)
        ?.name || 'Unknown Task';
    };

    const getDepartmentName = (departmentId: string) => {
      return departments.find(dept => dept.id === departmentId)?.name || 'Unknown Department';
    };

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add Department</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="Department Name"
                className="w-full p-2 border rounded"
              />
              <button
                onClick={handleAddDepartment}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Department
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add Tasks & Members</h2>
            <div className="space-y-4">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>

              <div className="space-y-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="New Task"
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleAddTask}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Add Task
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="New Member"
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={handleAddMember}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Weekly Staff Reports</h2>
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Week Starting</label>
                <input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Staff Member</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Staff Members</option>
                  {allStaffMembers.map(staff => (
                    <option key={staff} value={staff}>{staff}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent (hrs)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffReports.map(report => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(report.date), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{report.userId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getDepartmentName(report.departmentId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getTaskName(report.departmentId, report.taskId)}</td>
                      <td className="px-6 py-4">{report.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{report.timeSpent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map(dept => (
              <div key={dept.id} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">{dept.name}</h3>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Manager:</h4>
                  <select
                    value={dept.manager || ''}
                    onChange={(e) => handleAssignManager(dept.id, e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                  >
                    <option value="">Select Manager</option>
                    {dept.members.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Tasks:</h4>
                  <ul className="list-disc list-inside">
                    {(dept.tasks || []).map(task => (
                      <li key={task.id}>{task.name}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Members:</h4>
                  <ul className="list-disc list-inside">
                    {(dept.members || []).map((member, index) => (
                      <li key={index} className="flex items-center">
                        {member}
                        {dept.manager === member && (
                          <span className="ml-2 text-sm text-blue-600">(Manager)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveRequests.map(request => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{request.userId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {request.startDate} to {request.endDate}
                    </td>
                    <td className="px-6 py-4">{request.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleApproveLeave(request.id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveLeave(request.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const StaffDashboard = () => {
    const [reportEntries, setReportEntries] = useState<ReportEntry[]>(() => 
      Array(6).fill({
        taskId: '',
        description: '',
        timeSpent: ''
      })
    );
    const [leaveStartDate, setLeaveStartDate] = useState('');
    const [leaveEndDate, setLeaveEndDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');

    // Find the user's department
    const userDepartment = departments.find(dept => dept.members.includes(currentUser));
    
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.find(
      record => record.userId === currentUser && record.date === today
    );

    const departmentAttendance = attendance.filter(
      record => record.date === today && userDepartment?.members.includes(record.userId)
    );

    const handleCheckIn = () => {
      const now = new Date();
      const newRecord: AttendanceRecord = {
        id: crypto.randomUUID(),
        userId: currentUser,
        date: today,
        checkIn: now.toLocaleTimeString(),
        checkOut: null,
        status: 'present'
      };
      setAttendance([...attendance, newRecord]);
    };

    const handleCheckOut = () => {
      const now = new Date();
      setAttendance(attendance.map(record => 
        record.userId === currentUser && record.date === today
          ? { ...record, checkOut: now.toLocaleTimeString() }
          : record
      ));
    };

    const handleWFH = () => {
      const now = new Date();
      const newRecord: AttendanceRecord = {
        id: crypto.randomUUID(),
        userId: currentUser,
        date: today,
        checkIn: now.toLocaleTimeString(),
        checkOut: null,
        status: 'wfh'
      };
      setAttendance([...attendance, newRecord]);
    };

    const handleReportEntryChange = (index: number, field: keyof ReportEntry, value: string) => {
      const newEntries = [...reportEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      setReportEntries(newEntries);
    };

    const handleSubmitReport = () => {
      const validEntries = reportEntries.filter(
        entry => entry.taskId && entry.description && entry.timeSpent
      );

      if (validEntries.length > 0 && userDepartment) {
        const newReports = validEntries.map(entry => ({
          id: crypto.randomUUID(),
          userId: currentUser,
          departmentId: userDepartment.id,
          taskId: entry.taskId,
          description: entry.description,
          timeSpent: Number(entry.timeSpent),
          date: new Date().toISOString().split('T')[0]
        }));

        setReports([...reports, ...newReports]);
        setReportEntries(Array(6).fill({
          taskId: '',
          description: '',
          timeSpent: ''
        }));
      }
    };

    const handleSubmitLeave = () => {
      if (leaveStartDate && leaveEndDate && leaveReason) {
        const newLeaveRequest: LeaveRequest = {
          id: crypto.randomUUID(),
          userId: currentUser,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          reason: leaveReason,
          status: 'pending'
        };
        setLeaveRequests([...leaveRequests, newLeaveRequest]);
        setLeaveStartDate('');
        setLeaveEndDate('');
        setLeaveReason('');
      }
    };

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Staff Dashboard</h1>
        
        {/* Attendance Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Today's Attendance</h2>
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleCheckIn}
              disabled={!!todayAttendance}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                !todayAttendance 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 cursor-not-allowed'
              }`}
            >
              <Clock className="h-5 w-5" />
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!todayAttendance || todayAttendance.checkOut}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                todayAttendance && !todayAttendance.checkOut
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 cursor-not-allowed'
              }`}
            >
              <Clock className="h-5 w-5" />
              Check Out
            </button>
            <button
              onClick={handleWFH}
              disabled={!!todayAttendance}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                !todayAttendance
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 cursor-not-allowed'
              }`}
            >
              <Home className="h-5 w-5" />
              WFH
            </button>
          </div>

          {/* Department Status */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Department Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userDepartment?.members.map(member => {
                const memberAttendance = departmentAttendance.find(
                  record => record.userId === member
                );
                const memberLeave = leaveRequests.find(
                  request => 
                    request.userId === member && 
                    request.status === 'approved' &&
                    new Date(request.startDate) <= new Date() &&
                    new Date(request.endDate) >= new Date()
                );

                return (
                  <div key={member} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {member}
                        {userDepartment.manager === member && (
                          <span className="ml-2 text-sm text-blue-600">
                            (Manager)
                          </span>
                        )}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        memberLeave ? 'bg-yellow-100 text-yellow-800' :
                        memberAttendance?.status === 'wfh' ? 'bg-blue-100 text-blue-800' :
                        memberAttendance ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {memberLeave ? 'On Leave' :
                         memberAttendance?.status === 'wfh' ? 'WFH' :
                         memberAttendance ? 'Present' : 'Absent'}
                      </span>
                    </div>
                    {memberAttendance && (
                      <div className="mt-2 text-sm text-gray-600">
                        Check In: {memberAttendance.checkIn}
                        {memberAttendance.checkOut && (
                          <span className="ml-2">
                            Check Out: {memberAttendance.checkOut}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Holidays Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Holidays</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays
              .filter(holiday => new Date(holiday.date) >= new Date())
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(holiday => (
                <div key={holiday.id} className="p-4 border rounded-lg">
                  <h3 className="font-medium text-lg">{holiday.name}</h3>
                  <p className="text-gray-600">
                    {format(new Date(holiday.date), 'MMMM dd, yyyy')}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {holiday.description}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Daily Report Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Daily Report</h2>
          <div className="space-y-4">
            {reportEntries.map((entry, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded">
                <select
                  value={entry.taskId}
                  onChange={(e) => handleReportEntryChange(index, 'taskId', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Task</option>
                  {userDepartment?.tasks.map(task => (
                    <option key={task.id} value={task.id}>{task.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={entry.description}
                  onChange={(e) => handleReportEntryChange(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full p-2 border rounded"
                />

                <input
                  type="number"
                  value={entry.timeSpent}
                  onChange={(e) => handleReportEntryChange(index, 'timeSpent', e.target.value)}
                  placeholder="Time (hours)"
                  className="w-full p-2 border rounded"
                  min="0"
                  step="0.5"
                />
              </div>
            ))}

            <button
              onClick={handleSubmitReport}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
              disabled={!reportEntries.some(entry => 
                entry.taskId && entry.description && entry.timeSpent
              )}
            >
              Submit Daily Report
            </button>
          </div>
        </div>

        {/* Leave Request Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Request Leave</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-1">Start Date</label>
                <input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={4}
                />
              </div>

              <button
                onClick={handleSubmitLeave}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={!leaveStartDate || !leaveEndDate || !leaveReason}
              >
                Submit Leave Request
              </button>
            </div>
          </div>
        </div>

        {/* My Reports Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">My Reports</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (hours)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports
                  .filter(report => report.userId === currentUser)
                  .map(report => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{report.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userDepartment?.tasks.find(task => task.id === report.taskId)?.name}
                      </td>
                      <td className="px-6 py-4">{report.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{report.timeSpent}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const history = useHistory();

    const ADMIN_PASSWORD = 'admin123'; // In a real application, this would be securely stored

    const handleLogin = () => {
      if (username.trim()) {
        if (isAdmin) {
          if (password === ADMIN_PASSWORD) {
            setCurrentUser(username);
            history.push('/dashboard');
          } else {
            alert('Invalid admin password');
          }
        } else {
          setCurrentUser(username);
          history.push('/dashboard');
        }
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in</h2>
          </div>
          <div className="mt-8 space-y-6">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-2 border rounded"
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsAdmin(false);
                  setPassword('');
                }}
                className={`px-4 py-2 rounded ${!isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Staff
              </button>
              <button
                onClick={() => setIsAdmin(true)}
                className={`px-4 py-2 rounded ${isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Admin
              </button>
            </div>
            {isAdmin && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin Password"
                className="w-full p-2 border rounded"
              />
            )}
            <button
              onClick={handleLogin}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {currentUser && (
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <ClipboardList className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link
                      to="/dashboard"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-4">{currentUser}</span>
                  <button
                    onClick={() => {
                      setCurrentUser('');
                      setIsAdmin(false);
                    }}
                    className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500"
                  >
                    <LogOut className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <Switch>
          <Route exact path="/" component={LoginPage} />
          <Route
            path="/dashboard"
            render={() => (
              currentUser ? (isAdmin ? <AdminDashboard /> : <StaffDashboard />) : <LoginPage />
            )}
          />
        </Switch>
      </div>
    </Router>
  );
}

export default App;