export interface StudentLead {
  name: string;
  role: string;
  section: string;
  category: 'CSE' | 'AIDS' | 'PG';
  phonePlaceholder?: string;
}

export interface ConvenorLead {
  name: string;
  title: string;
  institution: string;
  department: string;
}

export const CONVENORS: ConvenorLead[] = [
  {
    name: 'Dr. Sharmila Sankar',
    title: 'DEAN, SCIMS',
    department: 'School of Computer Information & Mathematical Sciences',
    institution: 'B.S. Abdur Rahman Crescent Institute of Science and Technology',
  },
  {
    name: 'Dr. W. Aisha Banu',
    title: 'HOD, CSE',
    department: 'Department of Computer Science & Engineering',
    institution: 'B.S. Abdur Rahman Crescent Institute of Science and Technology',
  },
];

export const STUDENT_COORDINATORS: StudentLead[] = [
  { name: 'Abdul Mateen Danish', role: 'Section Coordinator', section: 'CSE A', category: 'CSE' },
  { name: 'A. Mohamed Fawaz', role: 'Section Coordinator', section: 'CSE B', category: 'CSE' },
  { name: 'Yusrah Sakina', role: 'Section Coordinator', section: 'CSE C', category: 'CSE' },
  { name: 'Mohamed Ashfaq Kuddus', role: 'Section Coordinator', section: 'CSE D', category: 'CSE' },
  { name: 'Syed Siddique Ahmed', role: 'Domain Lead', section: 'CSE Cyber Security', category: 'CSE' },
  { name: 'Kishore', role: 'Domain Lead', section: 'CSE IoT', category: 'CSE' },
  { name: 'Vijay Hari', role: 'Section Coordinator', section: 'AI&DS A', category: 'AIDS' },
  { name: 'V. Keerthana', role: 'Section Coordinator', section: 'AI&DS B', category: 'AIDS' },
  { name: 'Syed Ishaaq', role: 'Section Coordinator', section: 'AI&DS C', category: 'AIDS' },
  { name: 'N. Joshitha', role: 'Postgraduate Lead', section: 'M.Tech CSE', category: 'PG' },
  { name: 'A. Anbu Mohamed', role: 'Postgraduate Lead', section: 'M.Tech AI&DS', category: 'PG' },
];

export interface FacultyLead {
  name: string;
  title: string;
  department: string;
}

export const FACULTY_COORDINATORS: FacultyLead[] = [
  { name: 'Dr. I. Karthiga', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. A. Snegaa', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. C. Tamilarasi', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. M. S. Usha', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. P. Joy Kiruba', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. P. Usha', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. A. Sulthana Rashya Begam', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. M. Shirin Ayisha Maryam', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Ms. S. Suberiya Begum', title: 'Assistant Professor', department: 'CSE' },
  { name: 'Mr. M. Mohammed Zubair', title: 'Assistant Professor', department: 'CSE' },
];

export interface EventLead {
  name: string;
  event: string;
}

export const TECHNICAL_EVENT_COORDINATORS: EventLead[] = [
  { event: 'Code Break', name: 'Mohamed Ashfaq Kuddus' },
  { event: 'Code Canvas', name: 'Mohammed Aadil' },
  { event: 'Neural Nexus', name: 'Yusrah Sakina' },
  { event: 'Binary Battle', name: 'Jazlin I' },
  { event: 'Game Craft', name: 'Anbu Mohamad' },
  { event: 'Tech Talks', name: 'Madhumitha P' },
  { event: 'Cyber Breach', name: 'Mohamed Fawaz' },
  { event: 'Prompt Pop', name: 'Mohammed Omer Akil' },
];

export const NON_TECHNICAL_EVENT_COORDINATORS: EventLead[] = [
  { event: 'Shutter Verse', name: 'Nandhana Priya S' },
  { event: 'Clue Code', name: 'Md. Ashfaque Ahamed' },
  { event: 'Trashion', name: 'N. Joshitha' },
  { event: 'The Voice Over', name: 'Keerthana V' },
  { event: 'BGMI', name: 'Achish G' },
  { event: 'FIFA', name: 'Nithishwaran' },
  { event: 'Valorant', name: 'Nithish Kumar S' },
  { event: 'Bid Wars', name: 'Syed Siddique Ahmed' },
];
