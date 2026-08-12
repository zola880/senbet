/**
 * Compute ranking for a list of students in a class.
 * @param {Array} students - Array of User documents (students)
 * @param {Array} courses - Array of Course documents assigned to the class
 * @param {Object} config - AssessmentConfig document for the class
 * @param {Array} scores - Array of StudentScore documents relevant to the class
 * @returns {Array} sorted ranking data
 */
const computeRanking = (students, courses, config, scores) => {
  const studentMap = {};

  // Initialize student totals
  students.forEach((student) => {
    studentMap[student._id.toString()] = {
      studentId: student._id,
      fullName: student.fullName,
      rollNumber: student.rollNumber,
      courseDetails: {}, // { courseId: { componentName: { score, max, percentage }, totalWeighted } }
      overallTotal: 0,
    };
  });

  // Group scores by student and course, then component
  scores.forEach((score) => {
    const sid = score.student.toString();
    const cid = score.course.toString();
    if (!studentMap[sid]) return; // not in this class? skip
    if (!studentMap[sid].courseDetails[cid]) {
      studentMap[sid].courseDetails[cid] = {};
    }
    studentMap[sid].courseDetails[cid][score.componentName] = {
      scoreObtained: score.scoreObtained,
      maxScore: score.maxScore,
      percentage: (score.scoreObtained / score.maxScore) * 100,
    };
  });

  // For each student, compute course weighted totals and overall
  for (const studentId in studentMap) {
    let overallSum = 0;
    const student = studentMap[studentId];

    // For each course, calculate weighted total using config components
    courses.forEach((course) => {
      const courseId = course._id.toString();
      const courseData = student.courseDetails[courseId] || {};
      let courseWeightedTotal = 0;

      config.components.forEach((component) => {
        const compData = courseData[component.name];
        if (compData) {
          // Use percentage and apply component weightage
          const weighted = (compData.percentage * component.weightage) / 100;
          courseWeightedTotal += weighted;
        }
        // If no score for this component, it contributes 0
      });

      // Store course total (out of 100)
      student.courseDetails[courseId].courseTotal = courseWeightedTotal;
      overallSum += courseWeightedTotal;
    });

    student.overallTotal = overallSum;
  }

  // Normalise overallTotal: divide by the number of courses so the final
  // score stays within [0, 100] regardless of how many courses a class has.
  // (Each courseWeightedTotal is already out of 100 because component
  //  weightages must sum to 100, so dividing by courseCount gives an average.)
  const courseCount = courses.length || 1; // guard against division by zero
  Object.values(studentMap).forEach((s) => {
    s.overallTotal = s.overallTotal / courseCount;
  });

  // Convert to array and sort descending by overallTotal
  const rankingArray = Object.values(studentMap).map((s) => ({
    ...s,
    // optional: include course breakdown for frontend
    courseBreakdown: s.courseDetails,
  }));

  rankingArray.sort((a, b) => b.overallTotal - a.overallTotal);

  // Assign ranks
  rankingArray.forEach((item, index) => {
    item.rank = index + 1;
  });

  return rankingArray;
};

module.exports = computeRanking;