export interface Question {
  id: string;
  number: number;
  marks: number;
  text: string;
  subparts?: SubPart[];
  imageUrl?: string;
  hasMarkScheme?: boolean;
  markScheme?: string;
}

export interface SubPart {
  label: string;
  marks: number;
  text: string;
  answer?: string;
}

export interface Paper {
  id: string;
  year: number;
  season: "May/June" | "Oct/Nov" | "Feb/Mar";
  paperNumber: number;
  variant: number;
  topicIds: string[];
  questions: Question[];
}

export interface Topic {
  id: string;
  name: string;
  subtopics?: Topic[];
  questionCount?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  topics: Topic[];
  papers: Paper[];
}

export const mathSubject: Subject = {
  id: "mathematics",
  name: "Mathematics",
  code: "0580",
  topics: [
    {
      id: "1",
      name: "Number",
      questionCount: 48,
      subtopics: [
        { id: "1-1", name: "Types of number", questionCount: 12 },
        { id: "1-2", name: "Fractions, decimals & percentages", questionCount: 18 },
        { id: "1-3", name: "Powers & roots", questionCount: 10 },
        { id: "1-4", name: "Standard form", questionCount: 8 },
      ],
    },
    {
      id: "2",
      name: "Algebra",
      questionCount: 72,
      subtopics: [
        { id: "2-1", name: "Expressions & formulae", questionCount: 20 },
        { id: "2-2", name: "Equations & inequalities", questionCount: 22 },
        { id: "2-3", name: "Sequences", questionCount: 15 },
        { id: "2-4", name: "Graphs of functions", questionCount: 15 },
      ],
    },
    {
      id: "3",
      name: "Coordinate Geometry",
      questionCount: 30,
      subtopics: [
        { id: "3-1", name: "Straight lines", questionCount: 18 },
        { id: "3-2", name: "Curves", questionCount: 12 },
      ],
    },
    {
      id: "4",
      name: "Geometry",
      questionCount: 55,
      subtopics: [
        { id: "4-1", name: "Angles & polygons", questionCount: 20 },
        { id: "4-2", name: "Circles", questionCount: 18 },
        { id: "4-3", name: "Constructions & loci", questionCount: 17 },
      ],
    },
    {
      id: "5",
      name: "Trigonometry",
      questionCount: 40,
      subtopics: [
        { id: "5-1", name: "Right-angled triangles", questionCount: 20 },
        { id: "5-2", name: "Non right-angled triangles", questionCount: 12 },
        { id: "5-3", name: "Trigonometric graphs", questionCount: 8 },
      ],
    },
    {
      id: "6",
      name: "Vectors & Transformations",
      questionCount: 28,
      subtopics: [
        { id: "6-1", name: "Vectors", questionCount: 14 },
        { id: "6-2", name: "Transformations", questionCount: 14 },
      ],
    },
    {
      id: "7",
      name: "Probability & Statistics",
      questionCount: 35,
      subtopics: [
        { id: "7-1", name: "Probability", questionCount: 18 },
        { id: "7-2", name: "Statistics & graphs", questionCount: 17 },
      ],
    },
  ],
  papers: [
    {
      id: "p1",
      year: 2023,
      season: "May/June",
      paperNumber: 2,
      variant: 1,
      topicIds: ["2-1", "2-2", "1-2"],
      questions: [
        {
          id: "q1",
          number: 1,
          marks: 3,
          text: "Solve the equation 3x + 7 = 22.",
          markScheme: "3x = 15\nx = 5",
        },
        {
          id: "q2",
          number: 2,
          marks: 4,
          text: "Expand and simplify (2x + 3)(x − 5).",
          markScheme: "2x² − 10x + 3x − 15\n= 2x² − 7x − 15",
        },
        {
          id: "q3",
          number: 3,
          marks: 5,
          text: "The formula for the surface area of a cylinder is A = 2πr(r + h).\n\n(a) Find A when r = 4 and h = 7, giving your answer correct to 3 significant figures.\n\n(b) Rearrange the formula to make h the subject.",
          subparts: [
            { label: "a", marks: 2, text: "Find A when r = 4 and h = 7", answer: "276 (3 s.f.)" },
            { label: "b", marks: 3, text: "Make h the subject", answer: "h = A/(2πr) − r" },
          ],
        },
        {
          id: "q4",
          number: 4,
          marks: 6,
          text: "Solve the simultaneous equations.\n\n4x + 3y = 24\n2x − y = 2",
          markScheme: "From eq 2: y = 2x − 2\nSubstitute: 4x + 3(2x − 2) = 24\n10x = 30, x = 3\ny = 4",
        },
        {
          id: "q5",
          number: 5,
          marks: 4,
          text: "Write 0.000467 in standard form.",
          markScheme: "4.67 × 10⁻⁴",
        },
      ],
    },
    {
      id: "p2",
      year: 2023,
      season: "Oct/Nov",
      paperNumber: 4,
      variant: 2,
      topicIds: ["5-1", "5-2", "4-2"],
      questions: [
        {
          id: "q6",
          number: 1,
          marks: 4,
          text: "In triangle ABC, angle B = 90°, AB = 8 cm and BC = 15 cm.\n\nFind AC.",
          markScheme: "AC² = 8² + 15² = 64 + 225 = 289\nAC = 17 cm",
        },
        {
          id: "q7",
          number: 2,
          marks: 5,
          text: "A circle has centre O and radius 6 cm. The chord AB has length 10 cm.\n\nFind the perpendicular distance from O to the chord AB.",
          markScheme: "Half chord = 5 cm\nd² = 6² − 5² = 11\nd = √11 ≈ 3.32 cm",
        },
        {
          id: "q8",
          number: 3,
          marks: 6,
          text: "Using the sine rule, find the value of x in triangle PQR where PQ = 12 cm, angle P = 48° and angle Q = 65°.",
          markScheme: "Angle R = 180 − 48 − 65 = 67°\nQR/sin P = PQ/sin R\nQR = 12 × sin 48° / sin 67° = 9.68 cm",
        },
      ],
    },
    {
      id: "p3",
      year: 2022,
      season: "May/June",
      paperNumber: 2,
      variant: 2,
      topicIds: ["7-1", "7-2"],
      questions: [
        {
          id: "q9",
          number: 1,
          marks: 3,
          text: "A bag contains 5 red, 3 blue and 2 green balls. A ball is chosen at random.\n\nFind the probability that the ball is not red.",
          markScheme: "P(not red) = (3 + 2)/10 = 5/10 = 1/2",
        },
        {
          id: "q10",
          number: 2,
          marks: 4,
          text: "The table shows the heights, in cm, of 30 students.\n\n| Height | Frequency |\n|--------|----------|\n| 150–160 | 8 |\n| 160–170 | 12 |\n| 170–180 | 7 |\n| 180–190 | 3 |\n\nCalculate an estimate for the mean height.",
          markScheme: "Mean = (155×8 + 165×12 + 175×7 + 185×3) / 30\n= (1240 + 1980 + 1225 + 555) / 30\n= 5000 / 30\n≈ 166.7 cm",
        },
        {
          id: "q11",
          number: 3,
          marks: 5,
          text: "Two events A and B are independent. P(A) = 0.3 and P(B) = 0.4.\n\n(a) Find P(A and B).\n(b) Find P(A or B).",
          subparts: [
            { label: "a", marks: 2, text: "Find P(A and B)", answer: "P(A and B) = 0.3 × 0.4 = 0.12" },
            { label: "b", marks: 3, text: "Find P(A or B)", answer: "P(A or B) = 0.3 + 0.4 − 0.12 = 0.58" },
          ],
        },
      ],
    },
    {
      id: "p4",
      year: 2022,
      season: "Oct/Nov",
      paperNumber: 2,
      variant: 1,
      topicIds: ["2-3", "2-4"],
      questions: [
        {
          id: "q12",
          number: 1,
          marks: 3,
          text: "The nth term of a sequence is 3n² − 2.\n\nFind the first four terms of this sequence.",
          markScheme: "n=1: 1, n=2: 10, n=3: 25, n=4: 46",
        },
        {
          id: "q13",
          number: 2,
          marks: 4,
          text: "Find the nth term of this sequence.\n\n5, 9, 13, 17, 21, ...",
          markScheme: "Difference = 4, starts at 5\nnth term = 4n + 1",
        },
        {
          id: "q14",
          number: 3,
          marks: 5,
          text: "Sketch the graph of y = x² − 4x + 3, marking clearly the x-intercepts, y-intercept and turning point.",
          markScheme: "x-intercepts: x = 1 and x = 3\ny-intercept: y = 3\nTurning point: (2, −1)",
        },
      ],
    },
    {
      id: "p5",
      year: 2021,
      season: "May/June",
      paperNumber: 4,
      variant: 1,
      topicIds: ["6-1", "6-2"],
      questions: [
        {
          id: "q15",
          number: 1,
          marks: 4,
          text: "Vector a = (3, 2) and vector b = (−1, 4).\n\nFind 2a − b as a column vector.",
          markScheme: "2a = (6, 4)\n2a − b = (6−(−1), 4−4) = (7, 0)",
        },
        {
          id: "q16",
          number: 2,
          marks: 5,
          text: "Describe fully the single transformation that maps triangle A onto triangle B.",
          markScheme: "Rotation of 90° anticlockwise about the origin (0, 0).",
        },
        {
          id: "q17",
          number: 3,
          marks: 6,
          text: "OABC is a parallelogram. OA = a and OC = c.\n\nM is the midpoint of AB. Find OM in terms of a and c.",
          markScheme: "OM = OA + AM\n= a + ½c\n= a + ½c",
        },
      ],
    },
  ],
};
