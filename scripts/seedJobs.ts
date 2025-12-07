// scripts/seedJobs.ts
import { drizzle } from "drizzle-orm/mysql2";
import { jobs } from "../drizzle/schema";

const sampleJobs = [
  {
    externalId: "job-001",
    title: "Senior Full Stack Engineer",
    companyName: "TechCorp Inc.",
    companyLogoUrl: null,
    city: "San Francisco",
    country: "USA",
    latitude: "37.7749",
    longitude: "-122.4194",
    salaryMin: 150000,
    salaryMax: 200000,
    currency: "USD",
    workMode: "hybrid" as const,
    employmentType: "full-time",
    summary: "Join our team to build cutting-edge web applications using React, Node.js, and cloud technologies.",
    description: "We're looking for an experienced full-stack engineer to join our growing team. You'll work on building scalable web applications, collaborating with designers and product managers, and mentoring junior developers. Requirements: 5+ years of experience with JavaScript/TypeScript, React, Node.js, and SQL databases. Experience with AWS or GCP is a plus.",
    perks: { remote: true, healthInsurance: true, stockOptions: true },
    applyUrl: "https://example.com/apply/job-001",
    source: "internal",
  },
  {
    externalId: "job-002",
    title: "Frontend Developer",
    companyName: "Design Studio",
    companyLogoUrl: null,
    city: "New York",
    country: "USA",
    latitude: "40.7128",
    longitude: "-74.0060",
    salaryMin: 100000,
    salaryMax: 140000,
    currency: "USD",
    workMode: "remote" as const,
    employmentType: "full-time",
    summary: "Create beautiful, responsive user interfaces with React and modern CSS frameworks.",
    description: "We're seeking a talented frontend developer passionate about creating exceptional user experiences. You'll work closely with our design team to implement pixel-perfect interfaces and optimize performance. Requirements: 3+ years of React experience, strong CSS skills, experience with Tailwind or similar frameworks.",
    perks: { remote: true, flexibleHours: true, learningBudget: true },
    applyUrl: "https://example.com/apply/job-002",
    source: "internal",
  },
  {
    externalId: "job-003",
    title: "Backend Engineer - Python",
    companyName: "DataFlow Solutions",
    companyLogoUrl: null,
    city: "Austin",
    country: "USA",
    latitude: "30.2672",
    longitude: "-97.7431",
    salaryMin: 120000,
    salaryMax: 160000,
    currency: "USD",
    workMode: "onsite" as const,
    employmentType: "full-time",
    summary: "Build robust APIs and data pipelines using Python, FastAPI, and PostgreSQL.",
    description: "Join our backend team to develop high-performance APIs and data processing systems. You'll work with large datasets, optimize database queries, and ensure system reliability. Requirements: 4+ years of Python experience, strong knowledge of SQL, experience with FastAPI or Django, familiarity with Docker and Kubernetes.",
    perks: { healthInsurance: true, gymMembership: true, paidTimeOff: true },
    applyUrl: "https://example.com/apply/job-003",
    source: "internal",
  },
  {
    externalId: "job-004",
    title: "DevOps Engineer",
    companyName: "CloudScale Inc.",
    companyLogoUrl: null,
    city: "Seattle",
    country: "USA",
    latitude: "47.6062",
    longitude: "-122.3321",
    salaryMin: 130000,
    salaryMax: 180000,
    currency: "USD",
    workMode: "hybrid" as const,
    employmentType: "full-time",
    summary: "Manage cloud infrastructure and CI/CD pipelines for our growing platform.",
    description: "We're looking for a DevOps engineer to help scale our infrastructure and improve deployment processes. You'll work with AWS, Kubernetes, Terraform, and GitHub Actions. Requirements: 3+ years of DevOps experience, strong knowledge of AWS services, experience with infrastructure as code, scripting skills in Python or Bash.",
    perks: { remote: true, stockOptions: true, conferenceBudget: true },
    applyUrl: "https://example.com/apply/job-004",
    source: "internal",
  },
  {
    externalId: "job-005",
    title: "Product Designer",
    companyName: "Creative Labs",
    companyLogoUrl: null,
    city: "Los Angeles",
    country: "USA",
    latitude: "34.0522",
    longitude: "-118.2437",
    salaryMin: 110000,
    salaryMax: 150000,
    currency: "USD",
    workMode: "remote" as const,
    employmentType: "full-time",
    summary: "Design intuitive user experiences for our mobile and web applications.",
    description: "We're seeking a product designer to join our design team. You'll conduct user research, create wireframes and prototypes, and work closely with engineers to bring designs to life. Requirements: 3+ years of product design experience, proficiency in Figma, strong portfolio demonstrating UX/UI skills, experience with design systems.",
    perks: { remote: true, flexibleHours: true, designTools: true },
    applyUrl: "https://example.com/apply/job-005",
    source: "internal",
  },
  {
    externalId: "job-006",
    title: "Mobile Developer - React Native",
    companyName: "AppWorks",
    companyLogoUrl: null,
    city: "Boston",
    country: "USA",
    latitude: "42.3601",
    longitude: "-71.0589",
    salaryMin: 115000,
    salaryMax: 155000,
    currency: "USD",
    workMode: "hybrid" as const,
    employmentType: "full-time",
    summary: "Build cross-platform mobile applications using React Native and TypeScript.",
    description: "Join our mobile team to develop innovative apps for iOS and Android. You'll work on new features, optimize performance, and ensure a great user experience across devices. Requirements: 3+ years of React Native experience, knowledge of native iOS/Android development, experience with app store deployment.",
    perks: { healthInsurance: true, stockOptions: true, paidTimeOff: true },
    applyUrl: "https://example.com/apply/job-006",
    source: "internal",
  },
  {
    externalId: "job-007",
    title: "Data Scientist",
    companyName: "Analytics Pro",
    companyLogoUrl: null,
    city: "Chicago",
    country: "USA",
    latitude: "41.8781",
    longitude: "-87.6298",
    salaryMin: 125000,
    salaryMax: 170000,
    currency: "USD",
    workMode: "remote" as const,
    employmentType: "full-time",
    summary: "Apply machine learning and statistical analysis to solve business problems.",
    description: "We're looking for a data scientist to help us extract insights from large datasets and build predictive models. You'll work with Python, SQL, and various ML frameworks. Requirements: 4+ years of data science experience, strong knowledge of statistics and ML algorithms, experience with Python (pandas, scikit-learn, TensorFlow), SQL proficiency.",
    perks: { remote: true, learningBudget: true, conferenceBudget: true },
    applyUrl: "https://example.com/apply/job-007",
    source: "internal",
  },
  {
    externalId: "job-008",
    title: "Engineering Manager",
    companyName: "Growth Ventures",
    companyLogoUrl: null,
    city: "Denver",
    country: "USA",
    latitude: "39.7392",
    longitude: "-104.9903",
    salaryMin: 160000,
    salaryMax: 210000,
    currency: "USD",
    workMode: "hybrid" as const,
    employmentType: "full-time",
    summary: "Lead a team of engineers building our next-generation platform.",
    description: "We're seeking an experienced engineering manager to lead our backend team. You'll be responsible for team growth, technical direction, and delivery of key projects. Requirements: 7+ years of software engineering experience, 2+ years of management experience, strong technical background, excellent communication skills.",
    perks: { stockOptions: true, healthInsurance: true, paidTimeOff: true },
    applyUrl: "https://example.com/apply/job-008",
    source: "internal",
  },
];

async function seedJobs() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("Seeding jobs...");

  try {
    for (const job of sampleJobs) {
      await db.insert(jobs).values(job);
      console.log(`✓ Added: ${job.title} at ${job.companyName}`);
    }

    console.log(`\n✅ Successfully seeded ${sampleJobs.length} jobs!`);
  } catch (error) {
    console.error("Error seeding jobs:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedJobs();
