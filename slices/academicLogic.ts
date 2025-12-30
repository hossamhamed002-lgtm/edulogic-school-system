const getItemYearId = (item: { Academic_Year_ID?: string; Year_ID?: string } | null | undefined) =>
  item?.Academic_Year_ID || item?.Year_ID || '';

const cloneYearStructure = (prev: any, sourceYearId?: string, targetYearId?: string) => {
  if (!sourceYearId || !targetYearId) return prev;

  const hasTargetData =
    (prev.stages || []).some((stage: any) => getItemYearId(stage) === targetYearId)
    || (prev.grades || []).some((grade: any) => getItemYearId(grade) === targetYearId)
    || (prev.classes || []).some((klass: any) => getItemYearId(klass) === targetYearId)
    || (prev.feeItems || []).some((item: any) => getItemYearId(item) === targetYearId)
    || (prev.feeStructure || []).some((structure: any) => getItemYearId(structure) === targetYearId);

  if (hasTargetData) return prev;

  const stamp = Date.now();

  const sourceStages = (prev.stages || []).filter((stage: any) => getItemYearId(stage) === sourceYearId);
  const stageIdMap = new Map<string, string>();
  const clonedStages = sourceStages.map((stage: any, index: number) => {
    const newId = `STG-${stamp}-${index}`;
    stageIdMap.set(stage.Stage_ID, newId);
    return {
      ...stage,
      Stage_ID: newId,
      Academic_Year_ID: targetYearId
    };
  });

  const sourceGrades = (prev.grades || []).filter((grade: any) => getItemYearId(grade) === sourceYearId);
  const gradeIdMap = new Map<string, string>();
  const clonedGrades = sourceGrades.map((grade: any, index: number) => {
    const newId = `GRD-${stamp}-${index}`;
    gradeIdMap.set(grade.Grade_ID, newId);
    return {
      ...grade,
      Grade_ID: newId,
      Stage_ID: stageIdMap.get(grade.Stage_ID) || grade.Stage_ID,
      Academic_Year_ID: targetYearId
    };
  });

  const sourceClasses = (prev.classes || []).filter((klass: any) => getItemYearId(klass) === sourceYearId);
  const clonedClasses = sourceClasses.map((klass: any, index: number) => {
    const newId = `CLS-${stamp}-${index}`;
    return {
      ...klass,
      Class_ID: newId,
      Grade_ID: gradeIdMap.get(klass.Grade_ID) || klass.Grade_ID,
      Year_ID: targetYearId,
      Academic_Year_ID: targetYearId
    };
  });

  const sourceFeeItems = (prev.feeItems || []).filter((item: any) => getItemYearId(item) === sourceYearId);
  const feeItemIdMap = new Map<string, string>();
  const clonedFeeItems = sourceFeeItems.map((item: any, index: number) => {
    const newId = `FEE-${stamp}-${index}`;
    feeItemIdMap.set(item.Fee_ID, newId);
    return {
      ...item,
      Fee_ID: newId,
      Academic_Year_ID: targetYearId
    };
  });

  const sourceFeeStructure = (prev.feeStructure || []).filter((structure: any) => getItemYearId(structure) === sourceYearId);
  const clonedFeeStructure = sourceFeeStructure.map((structure: any, index: number) => ({
    ...structure,
    Structure_ID: `STR-${stamp}-${index}`,
    Grade_ID: gradeIdMap.get(structure.Grade_ID) || structure.Grade_ID,
    Fee_ID: feeItemIdMap.get(structure.Fee_ID) || structure.Fee_ID,
    Year_ID: targetYearId,
    Academic_Year_ID: targetYearId
  }));

  return {
    ...prev,
    stages: [...(prev.stages || []), ...clonedStages],
    grades: [...(prev.grades || []), ...clonedGrades],
    classes: [...(prev.classes || []), ...clonedClasses],
    feeItems: [...(prev.feeItems || []), ...clonedFeeItems],
    feeStructure: [...(prev.feeStructure || []), ...clonedFeeStructure]
  };
};

export const getAcademicActions = (setDb: any, activeSchool: any, logAction: any, getActiveYearId: () => string) => ({
  // إضافة عام دراسي
  addYear: (name: string, start: string, end: string) => {
    const id = `YEAR-${Date.now()}`;
    setDb((prev: any) => ({
      ...prev,
      years: [...(prev.years || []), { Year_ID: id, School_ID: activeSchool.School_ID, Year_Name: name, Start_Date: start, End_Date: end, Is_Active: false }]
    }));
    logAction({ Action_Ar: `إضافة عام دراسي: ${name}`, Action_Type: 'add', Record_ID: id, Page_Name_Ar: 'الإعدادات العامة' });
    return id;
  },
  updateYear: (id: string, data: any) => setDb((prev: any) => ({
    ...prev,
    years: prev.years.map((y: any) => y.Year_ID === id ? { ...y, ...data } : y)
  })),
  deleteYear: (id: string) => setDb((prev: any) => ({
    ...prev,
    years: prev.years.filter((y: any) => y.Year_ID !== id)
  })),
  toggleYearStatus: (id: string) => setDb((prev: any) => {
    const target = prev.years.find((y: any) => y.Year_ID === id);
    if (!target) return prev;

    const isActivating = !target.Is_Active;
    const previousActiveYear = prev.years.find((y: any) => y.Is_Active && y.Year_ID !== id);

    const years = prev.years.map((y: any) => ({
      ...y,
      Is_Active: y.Year_ID === id ? isActivating : (isActivating ? false : y.Is_Active)
    }));

    let nextState = { ...prev, years };
    if (isActivating) {
      nextState = cloneYearStructure(nextState, previousActiveYear?.Year_ID, id);
    }

    return nextState;
  }),

  // إضافة مرحلة تعليمية
  addStage: (name: string) => {
    const id = `STG-${Date.now().toString().slice(-4)}`;
    const yearId = getActiveYearId();
    setDb((prev: any) => {
      const resolvedYearId = yearId || prev.years.find((y: any) => y.Is_Active)?.Year_ID || prev.years?.[0]?.Year_ID || '';
      return {
        ...prev,
        stages: [...(prev.stages || []), { Stage_ID: id, Stage_Name: name, Academic_Year_ID: resolvedYearId }]
      };
    });
    logAction({ Action_Ar: `????? ?????: ${name}`, Action_Type: 'add', Record_ID: id, Page_Name_Ar: '????????? ??????' });
    return id;
  },
  updateStage: (id: string, name: string) => setDb((prev: any) => ({
    ...prev,
    stages: (prev.stages || []).map((stg: any) => stg.Stage_ID === id ? { ...stg, Stage_Name: name } : stg)
  })),
  deleteStage: (id: string) => setDb((prev: any) => ({
    ...prev,
    stages: (prev.stages || []).filter((stg: any) => stg.Stage_ID !== id)
  })),

  // إضافة صف
  addGrade: (stageId: string, name: string) => {
    const id = `GRD-${Date.now()}`;
    const yearId = getActiveYearId();
    setDb((prev: any) => {
      const resolvedYearId = yearId || prev.years.find((y: any) => y.Is_Active)?.Year_ID || prev.years?.[0]?.Year_ID || '';
      return {
        ...prev,
        grades: [...(prev.grades || []), { Grade_ID: id, Stage_ID: stageId, Grade_Name: name, Academic_Year_ID: resolvedYearId }]
      };
    });
    logAction({ Action_Ar: `????? ??: ${name}`, Action_Type: 'add', Record_ID: id, Page_Name_Ar: '????????? ??????' });
    return id;
  },
  updateGrade: (id: string, name: string) => setDb((prev: any) => ({
    ...prev,
    grades: prev.grades.map((g: any) => g.Grade_ID === id ? { ...g, Grade_Name: name } : g)
  })),
  deleteGrade: (id: string) => setDb((prev: any) => ({
    ...prev,
    grades: prev.grades.filter((g: any) => g.Grade_ID !== id)
  })),

  // إضافة فصل
  addClass: (data: any) => {
    const yearId = data.Year_ID || getActiveYearId();
    const id = `CLS-${Date.now()}`;
    setDb((prev: any) => {
      const resolvedYearId = yearId || prev.years.find((y: any) => y.Is_Active)?.Year_ID || prev.years?.[0]?.Year_ID || '';
      return {
        ...prev,
        classes: [
          ...(prev.classes || []),
          { ...data, Class_ID: id, Year_ID: resolvedYearId, Academic_Year_ID: resolvedYearId }
        ]
      };
    });
    return id;
  },
  updateClass: (id: string, data: any) => setDb((prev: any) => ({
    ...prev,
    classes: prev.classes.map((c: any) => c.Class_ID === id ? { ...c, ...data } : c)
  })),
  deleteClass: (id: string) => setDb((prev: any) => ({
    ...prev,
    classes: prev.classes.filter((c: any) => c.Class_ID !== id)
  }))
});
