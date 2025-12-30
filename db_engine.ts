
// المفتاح الثابت والنهائي - لن يتغير أبداً لضمان الاستقرار
export const DB_KEY = 'EDULOGIC_ULTRA_PERSISTENT_DB';

const buildScopedKey = (key: string, namespace?: string) =>
  namespace ? `${key}__${namespace}` : key;

// مخزن ذاكرة بديل لمنع أي كتابة على المتصفح
const memoryStore = new Map<string, string>();
const sessionMemoryStore = new Map<string, string>();

const mergeDeep = (target: any, source: any) => {
  if (!source) return target;
  const output = { ...target };
  
  Object.keys(source).forEach(key => {
    if (Array.isArray(source[key])) {
      // إذا كانت المصفوفة في التخزين تحتوي بيانات، لا تستبدلها أبداً ببيانات الكود الفارغة
      if (source[key].length > 0) {
        output[key] = source[key];
      } else if (!output[key]) {
        output[key] = [];
      }
    } else if (source[key] !== null && typeof source[key] === 'object') {
      output[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  });
  return output;
};

export const saveToStorage = (data: any, namespace?: string) => {
  try {
    const serializedData = JSON.stringify(data);
    const scopedKey = buildScopedKey(DB_KEY, namespace);
    memoryStore.set(scopedKey, serializedData);
    // نسخة احتياطية إضافية داخل الذاكرة فقط
    sessionMemoryStore.set(buildScopedKey(DB_KEY + '_SESSION_BACKUP', namespace), serializedData);
    return true;
  } catch (e) {
    return false;
  }
};


export const loadFromStorageKey = <T>(key: string, fallback: T, namespace?: string): T => {
  const scopedKey = buildScopedKey(key, namespace);
  const raw = memoryStore.get(scopedKey);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
};

export const saveToStorageKey = (key: string, data: unknown, namespace?: string) => {
  try {
    memoryStore.set(buildScopedKey(key, namespace), JSON.stringify(data));
  } catch (e) {
    // Ignore write failures (quota, serialization).
  }
};

export const loadFromStorage = (initialState: any, namespace?: string) => {
  // 1. محاولة التحميل من المفتاح الرئيسي
  const scopedKey = buildScopedKey(DB_KEY, namespace);
  let saved = memoryStore.get(scopedKey);

  // 2. المحاولة الأخيرة من نسخة الجلسة (داخل الذاكرة)
  if (!saved) saved = sessionMemoryStore.get(buildScopedKey(DB_KEY + '_SESSION_BACKUP', namespace));

  if (!saved) return initialState;
  
  try {
    const parsed = JSON.parse(saved);
    return mergeDeep(initialState, parsed);
  } catch (e) {
    return initialState;
  }
};

export const getSchoolLogoByCode = (schoolCode: string) => {
  const normalized = schoolCode.trim().toUpperCase();
  if (!normalized) return null;
  const scoped = loadFromStorage({ schools: [] }, normalized);
  const school = scoped.schools?.[0];
  return school?.Logo || null;
};

export const exportDatabase = (data: any) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `edulogic_backup_${date}.json`;
  link.click();
};

export const importDatabase = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.schools) resolve(data);
        else reject("Invalid Data");
      } catch (err) {
        reject("Parse Error");
      }
    };
    reader.readAsText(file);
  });
};
