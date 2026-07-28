import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import AuthContext from '../../context/AuthContext';

const MyCourses = () => {
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  useEffect(() => { api.get(`/api/v1/assignments/teacher/${user._id}`).then(r=>setAssignments(r.data.data)); }, [user._id]);
  return (
    <div>
      <h2 className="page-title">My Courses</h2>
      <div className="table-container">
        <table>
          <thead><tr><th>Course</th><th>Class</th></tr></thead>
          <tbody>
            {assignments.map(a=><tr key={a._id}><td>{a.course?.name}</td><td>{a.class?.name}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default MyCourses;