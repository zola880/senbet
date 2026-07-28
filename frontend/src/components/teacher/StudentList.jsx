import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';

const StudentList = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  useEffect(() => {
    // get teacher's assignments, then fetch unique students from those classes
    api.get(`/api/v1/assignments/teacher/${user._id}`).then(res => {
      const classIds = [...new Set(res.data.data.map(a=>a.class._id))];
      Promise.all(classIds.map(id => api.get(`/api/v1/users?role=student&class=${id}`))).then(responses => {
        const all = responses.flatMap(r=>r.data.data);
        setStudents(all);
      });
    });
  }, [user._id]);
  return (
    <div>
      <h2 className="page-title">My Students</h2>
      <div className="table-container">
        <table>
          <thead><tr><th>Name</th><th>Roll No</th><th>Class</th></tr></thead>
          <tbody>{students.map(s=><tr key={s._id}><td>{s.fullName}</td><td>{s.rollNumber}</td><td>{s.class?.name}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
};
export default StudentList;