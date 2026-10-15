export interface DepartmentConfig {
  name: string;
  shortName: string;
  programs: string[];
}

export const DEPARTMENTS: Record<string, DepartmentConfig> = {
  'College of Computer Studies': {
    name: 'College of Computer Studies',
    shortName: 'CCS',
    programs: ['BSIT', 'BSCS'],
  },
  'College of Business': {
    name: 'College of Business',
    shortName: 'COB',
    programs: ['BSBA', 'BSA'],
  },
  'College of Education': {
    name: 'College of Education',
    shortName: 'COED',
    programs: ['BSED'],
  },
  'College of Engineering': {
    name: 'College of Engineering',
    shortName: 'COE',
    programs: ['BSCE', 'BSEE', 'BSME'],
  },
  'College of Arts and Sciences': {
    name: 'College of Arts and Sciences',
    shortName: 'CAS',
    programs: ['ABCOMM', 'BSPSY', 'BSBIO'],
  },
  'College of Nursing': {
    name: 'College of Nursing',
    shortName: 'CON',
    programs: ['BSN'],
  },
  'College of Criminology': {
    name: 'College of Criminology',
    shortName: 'COC',
    programs: ['BSCrim'],
  },
  'College of Hospitality Management': {
    name: 'College of Hospitality Management',
    shortName: 'CHM',
    programs: ['BSHM', 'BSTM'],
  },
  "President's Office": {
    name: "President's Office",
    shortName: 'PO',
    programs: [],
  },
  'Office of the Registrar': {
    name: 'Office of the Registrar',
    shortName: 'REG',
    programs: [],
  },
  'Management Information Office': {
    name: 'Management Information Office',
    shortName: 'MIO',
    programs: [],
  },
};

export const DEPARTMENT_OPTIONS = Object.keys(DEPARTMENTS);

/**
 * Get the department config based on department name.
 * Returns a fallback config if not found — yung admin needs to add the department
 * to DEPARTMENTS map above para mag-work yung filtering.
 */
export function getDepartmentConfig(departmentName: string | undefined): DepartmentConfig {
  if (!departmentName) {
    return DEPARTMENTS['College of Computer Studies'];
  }

  const existing = DEPARTMENTS[departmentName];
  if (existing) return existing;

  // Fallback: create config from name with empty programs
  return {
    name: departmentName,
    shortName: departmentName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4),
    programs: [],
  };
}