import { useState, useEffect } from 'react';
import api from '../../services/api';

// 🌄 Replace this URL with any image you like (direct link to .jpg/.png)
const BACKGROUND_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5G9JtRJzRGdd5zNzfIBwWqCWcXuiTIeAOUfQKi1MDlVdar1DrbJqNJ6Dg&s=10';

const AssessmentConfig = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [config, setConfig] = useState(null);
  const [components, setComponents] = useState([{ name: '', type: 'exam', weightage: 0 }]);

  useEffect(() => {
    api.get('/api/v1/classes').then(res => setClasses(res.data.data));
  }, []);

  const loadConfig = async () => {
    if (!selectedClass) return;
    try {
      const res = await api.get(`/api/v1/assessment-configs/${selectedClass}`);
      setConfig(res.data.data);
      setComponents(res.data.data.components);
    } catch (err) {
      setConfig(null);
      setComponents([{ name: '', type: 'exam', weightage: 0 }]);
    }
  };

  const addComponent = () => {
    setComponents([...components, { name: '', type: 'exam', weightage: 0 }]);
  };

  const updateComponent = (index, field, value) => {
    const updated = [...components];
    updated[index][field] = value;
    setComponents(updated);
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // The backend will use the default maxScore (100) if not provided – we don't care because it's hidden.
    await api.post('/api/v1/assessment-configs', {
      class: selectedClass,
      academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear()+1),
      components,
    });
    alert('Config saved');
    loadConfig();
  };

  return (
    <div>
      <h2 className="page-title">Assessment Configuration</h2>
      <div className="form-grid">
        <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); loadConfig(); }}>
          <option value="">Select Class</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedClass ? (
        <div
          className="selection-placeholder"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url('${BACKGROUND_IMAGE}')`,
          }}
        >
          <p>Please select a class to configure assessments</p>
        </div>
      ) : (
        <div className="card" style={{marginTop:'1rem'}}>
          <h3>Components for {classes.find(c=>c._id===selectedClass)?.name}</h3>
          {components.map((comp, idx) => (
            <div key={idx} className="form-grid" style={{marginBottom:'0.5rem'}}>
              <input
                placeholder="Component Name (e.g., Exam)"
                value={comp.name}
                onChange={e => updateComponent(idx, 'name', e.target.value)}
              />
              <select value={comp.type} onChange={e => updateComponent(idx, 'type', e.target.value)}>
                <option value="exam">Exam</option>
                <option value="activity">Activity</option>
                <option value="attendance">Attendance</option>
                <option value="custom">Custom</option>
              </select>
              <input
                type="number"
                placeholder="Weight (%)"
                value={comp.weightage}
                onChange={e => updateComponent(idx, 'weightage', Number(e.target.value))}
              />
              <button className="btn btn-sm btn-danger" onClick={() => removeComponent(idx)}>X</button>
            </div>
          ))}
          <button className="btn btn-secondary" onClick={addComponent}>+ Add Component</button>
          <button
            className="btn btn-primary"
            style={{marginLeft:'1rem'}}
            onClick={handleSave}
            disabled={components.some(c=>!c.name || c.weightage<=0)}
          >
            Save Configuration
          </button>
        </div>
      )}
    </div>
  );
};

export default AssessmentConfig;