export type EnrollmentStatus = 'Enrolled' | 'Pending' | 'Cancelled';
export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

export interface EnrollmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  program: string;
  yearLevel: string;
  section: string;
  academicYear: string;
  status: EnrollmentStatus;
  dateEnrolled: string;
}

export const ENROLLMENT_STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = {
  Enrolled: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
};

export const ENROLLMENT_RECORDS: EnrollmentRecord[] = [
  { id: 'ENR-00001', studentId: '2025-00001', studentName: 'Andrea Santos', email: 'andrea.santos@student.edu', program: 'BSIT', yearLevel: '1st Year', section: 'A', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 15, 2025' },
  { id: 'ENR-00002', studentId: '2025-00002', studentName: 'Miguel Reyes', email: 'miguel.reyes@student.edu', program: 'BSCS', yearLevel: '2nd Year', section: 'B', academicYear: '2025-2026', status: 'Pending', dateEnrolled: 'Aug 12, 2025' },
  { id: 'ENR-00003', studentId: '2025-00003', studentName: 'Sofia Cruz', email: 'sofia.cruz@student.edu', program: 'BSBA', yearLevel: '3rd Year', section: 'A', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 10, 2025' },
  { id: 'ENR-00004', studentId: '2025-00004', studentName: 'Rafael Bautista', email: 'rafael.bautista@student.edu', program: 'BSIT', yearLevel: '4th Year', section: 'C', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 08, 2025' },
  { id: 'ENR-00005', studentId: '2025-00005', studentName: 'Isabella Ocampo', email: 'isabella.ocampo@student.edu', program: 'BSA', yearLevel: '1st Year', section: 'B', academicYear: '2025-2026', status: 'Cancelled', dateEnrolled: 'Aug 05, 2025' },
  { id: 'ENR-00006', studentId: '2025-00006', studentName: 'Gabriel Garcia', email: 'gabriel.garcia@student.edu', program: 'BSED', yearLevel: '2nd Year', section: 'A', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 04, 2025' },
  { id: 'ENR-00007', studentId: '2025-00007', studentName: 'Camila Mendoza', email: 'camila.mendoza@student.edu', program: 'BSCS', yearLevel: '3rd Year', section: 'D', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 03, 2025' },
  { id: 'ENR-00008', studentId: '2025-00008', studentName: 'Joshua Torres', email: 'joshua.torres@student.edu', program: 'BSIT', yearLevel: '1st Year', section: 'A', academicYear: '2025-2026', status: 'Pending', dateEnrolled: 'Aug 02, 2025' },
  { id: 'ENR-00009', studentId: '2025-00009', studentName: 'Patricia Villanueva', email: 'patricia.villanueva@student.edu', program: 'BSBA', yearLevel: '4th Year', section: 'B', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Aug 01, 2025' },
  { id: 'ENR-00010', studentId: '2025-00010', studentName: 'Nathaniel Aquino', email: 'nathaniel.aquino@student.edu', program: 'BSA', yearLevel: '2nd Year', section: 'C', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 30, 2025' },
  { id: 'ENR-00011', studentId: '2025-00011', studentName: 'Bianca Castillo', email: 'bianca.castillo@student.edu', program: 'BSED', yearLevel: '3rd Year', section: 'A', academicYear: '2025-2026', status: 'Cancelled', dateEnrolled: 'Jul 28, 2025' },
  { id: 'ENR-00012', studentId: '2025-00012', studentName: 'Christian Del Rosario', email: 'christian.delrosario@student.edu', program: 'BSIT', yearLevel: '1st Year', section: 'D', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 27, 2025' },
  { id: 'ENR-00013', studentId: '2025-00013', studentName: 'Danica Ramos', email: 'danica.ramos@student.edu', program: 'BSCS', yearLevel: '4th Year', section: 'B', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 25, 2025' },
  { id: 'ENR-00014', studentId: '2025-00014', studentName: 'Emmanuel Navarro', email: 'emmanuel.navarro@student.edu', program: 'BSBA', yearLevel: '2nd Year', section: 'A', academicYear: '2025-2026', status: 'Pending', dateEnrolled: 'Jul 22, 2025' },
  { id: 'ENR-00015', studentId: '2025-00015', studentName: 'Faith Salazar', email: 'faith.salazar@student.edu', program: 'BSED', yearLevel: '1st Year', section: 'C', academicYear: '2025-2026', status: 'Enrolled', dateEnrolled: 'Jul 20, 2025' },
];