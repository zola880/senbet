import { useState, useEffect } from 'react';
import api from '../../services/api';

// 🌄 You can replace this with your own background image
const BACKGROUND_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSkwpjvGXir0uK3CkxmmOqt18Sy4NHipO-FIDY3IxHjsA&s=10';

const AssessmentConfig = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [config, setConfig] = useState(null);
  const [components, setComponents] = useState([
    { name: '', type: 'exam', weightage: 0, maxScore: 100 }
  ]);

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
      // If no config exists, start with one empty component as example
      setComponents([{ name: '', type: 'exam', weightage: 0, maxScore: 100 }]);
    }
  };

  const addComponent = () => {
    setComponents([...components, { name: '', type: 'exam', weightage: 0, maxScore: 100 }]);
  };

  const updateComponent = (index, field, value) => {
    const updated = [...components];
    updated[index][field] = value;
    setComponents(updated);
  };

  const removeComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  // Calculate total weightage
  const totalWeight = components.reduce((sum, c) => sum + (Number(c.weightage) || 0), 0);
  const isValidWeight = totalWeight === 100;
  const allComponentsNamed = components.every(c => c.name.trim() !== '');

  const handleSave = async () => {
    if (!isValidWeight) {
      alert(`Total weightage must be exactly 100%. Currently it's ${totalWeight}%`);
      return;
    }
    if (!allComponentsNamed) {
      alert('All components must have a name.');
      return;
    }
    try {
      await api.post('/api/v1/assessment-configs', {
        class: selectedClass,
        academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear()+1),
        components,
      });
      alert('Assessment configuration saved!');
      loadConfig(); // reload to get saved data
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving');
    }
  };

  return (
    <div>
      <h2 className="page-title">Assessment Configuration</h2>

      {/* 📘 Explanation Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#fef9f0' }}>
        <h3>📘 What is this?</h3>
        <p style={{ marginBottom: '0.5rem' }}>
          Here you define <strong>how students' final scores are calculated</strong> for a specific class.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
          <li><strong>Component Name</strong> – e.g., "Mid Exam", "Final Exam", "Homework", "Attendance"</li>
          <li><strong>Type</strong> – just a label (Exam, Activity, Attendance, Custom).</li>
          <li><strong>Weight (%)</strong> – how important this component is. The total must equal <strong>100%</strong>.</li>
          <li><strong>Max Score</strong> – the highest possible points for this component (e.g., 100).</li>
        </ul>
        <p>
          <strong>Example:</strong> If you have "Exam" (60%) and "Activity" (40%), a student scoring 80/100 in Exam and 90/100 in Activity gets:  
          <code> (80×0.6) + (90×0.4) = 84% </code> final course score.
        </p>
      </div>

      {/* Class selector */}
      <div className="form-grid">
        <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); loadConfig(); }}>
          <option value="">-- Select Class --</option>
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
        <>
          {/* Weight total indicator */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Total Weightage:</span>
              <span style={{
                fontWeight: 'bold',
                color: isValidWeight ? 'green' : 'red',
                fontSize: '1.2rem'
              }}>
                {totalWeight}%
                {!isValidWeight && totalWeight > 0 && ` (needs ${100 - totalWeight}% more)`}
              </span>
            </div>
            <div style={{ background: '#eee', borderRadius: '10px', height: '10px', marginTop: '0.5rem' }}>
              <div style={{
                width: `${Math.min(totalWeight, 100)}%`,
                background: isValidWeight ? 'green' : '#d4a017',
                height: '100%',
                borderRadius: '10px',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>

          {/* Components list */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Assessment Components for {classes.find(c=>c._id===selectedClass)?.name}</h3>

            {components.map((comp, idx) => (
              <div key={idx} className="form-grid" style={{ marginBottom: '0.8rem', alignItems: 'center' }}>
                <input
                  placeholder='e.g. "Final Exam" or "Homework"'
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
                  placeholder="Weight (e.g. 60)"
                  value={comp.weightage}
                  onChange={e => updateComponent(idx, 'weightage', Number(e.target.value))}
                  min="0"
                  max="100"
                />
                <input
                  type="number"
                  placeholder="Max Score (usually 100)"
                  value={comp.maxScore}
                  onChange={e => updateComponent(idx, 'maxScore', Number(e.target.value))}
                  min="1"
                />
                <button className="btn btn-sm btn-danger" onClick={() => removeComponent(idx)}>
                  ✕
                </button>
              </div>
            ))}

            <button className="btn btn-secondary" onClick={addComponent}>
              + Add Component
            </button>
            <button
              className="btn btn-primary"
              style={{ marginLeft: '1rem' }}
              onClick={handleSave}
              disabled={!isValidWeight || !allComponentsNamed}
            >
              Save Configuration
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AssessmentConfig;