import { Router } from 'express';
import { getOne } from '../../db/sqlite.js';

// ميدل وير بسيط (يمكن استبداله بـ authToken الحقيقي لاحقًا)
const auth = (_req, _res, next) => next();

// محاولات استخراج معرّف وأسماء بمرونة
const getId = (item) =>
  item?.id ??
  item?.ID ??
  item?.Stage_ID ??
  item?.Grade_ID ??
  item?.Class_ID ??
  item?.stageId ??
  item?.gradeId ??
  item?.classId ??
  item?.code ??
  item?.Code ??
  null;

const getStageId = (item) => item?.stage_id ?? item?.Stage_ID ?? item?.stageId ?? item?.StageId ?? null;
const getGradeId = (item) => item?.grade_id ?? item?.Grade_ID ?? item?.gradeId ?? item?.GradeId ?? null;

const getName = (item) =>
  item?.name ??
  item?.Name ??
  item?.Stage_Name ??
  item?.Grade_Name ??
  item?.Class_Name ??
  item?.title ??
  '';

const parseSafe = (row) => {
  if (!row?.data) return [];
  try {
    const parsed = JSON.parse(row.data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const router = Router();

/**
 * GET /academic/structure/:schoolCode
 * يعيد هيكل المراحل → الصفوف → الفصول في طلب واحد
 */
router.get('/:schoolCode', auth, (req, res) => {
  const { schoolCode } = req.params;

  const stagesRow = getOne('SELECT data FROM academic_stages WHERE schoolCode = ?', [schoolCode]);
  const gradesRow = getOne('SELECT data FROM academic_grades WHERE schoolCode = ?', [schoolCode]);
  const classesRow = getOne('SELECT data FROM academic_classes WHERE schoolCode = ?', [schoolCode]);

  const stages = parseSafe(stagesRow);
  const grades = parseSafe(gradesRow);
  const classes = parseSafe(classesRow);

  const result = stages.map((stage) => {
    const stageId = getId(stage);
    return {
      id: stageId,
      name: getName(stage),
      grades: grades
        .filter((g) => getStageId(g) === stageId)
        .map((grade) => {
          const gradeId = getId(grade);
          return {
            id: gradeId,
            name: getName(grade),
            classes: classes
              .filter((c) => getGradeId(c) === gradeId)
              .map((c) => ({
                id: getId(c),
                name: getName(c)
              }))
          };
        })
    };
  });

  return res.json(result);
});

export default router;
