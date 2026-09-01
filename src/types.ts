export interface ProjectPlan02Item {
  id: string;
  project_name: string;      // โครงการ: ชื่อโครงการ + รายละเอียดสังเขป
  objective: string;         // วัตถุประสงค์: วัตถุประสงค์ของโครงการ
  target: string;            // เป้าหมาย ผลผลิต: ข้อความระบุขนาด/ปริมาณงาน
  budget_2571: number;       // งบประมาณ พ.ศ. 2571
  budget_2572: number;       // งบประมาณ พ.ศ. 2572
  budget_2573: number;       // งบประมาณ พ.ศ. 2573
  budget_2574: number;       // งบประมาณ พ.ศ. 2574
  budget_2575: number;       // งบประมาณ พ.ศ. 2575
  expected_outcome: string;  // ผลที่คาดว่าจะได้รับ: ข้อความผลประโยชน์
  department: string;        // หน่วยงานรับผิดชอบหลัก
}

export type ProjectFormData = Omit<ProjectPlan02Item, 'id'>;

export const LOCAL_STORAGE_KEY = 'plan02_projects_data_v1';

export const DEPARTMENTS = [
  'สำนักปลัด',
  'กองช่าง',
  'กองการศึกษา ศาสนาและวัฒนธรรม',
  'กองสาธารณสุขและสิ่งแวดล้อม',
  'กองคลัง',
  'กองสวัสดิการสังคม',
  'กองยุทธศาสตร์และงบประมาณ'
] as const;
