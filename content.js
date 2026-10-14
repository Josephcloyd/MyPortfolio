/*
 * Portfolio content — the single place to update the public site.
 *
 * Everything on index.html, project.html, and resume.html is rendered from this file.
 * Supabase (admin.html) is still used for: uploaded project images/galleries and live URLs
 * (matched by project `id`), certificates, and the contact inbox.
 *
 * Rules for editing:
 * - Leave a field as "" or [] when it is unknown. Empty fields are hidden, never faked.
 * - Images are paths relative to the site root (e.g. "images/lifeplan-dashboard.webp").
 * - Links must be full https:// URLs.
 * - Search for "TODO" to find details that still need confirmation.
 */
window.PORTFOLIO_CONTENT = {
  profile: {
    name: "Joseph Clyde S. Daño",
    shortName: "Joseph Clyde",
    monogram: "JD",
    headline: ["Software Developer", "Systems Builder", "Computer Engineer"],
    // Shown as `role` in the hero code panel.
    editorRole: "Computer Engineer",
    intro:
      "I develop practical software solutions, automate workflows, and build systems that connect technology with real-world needs. My work spans full-stack web development, backend services, AI integrations, and embedded systems.",
    // Words from `intro` that get the accent treatment in the hero.
    introHighlights: ["full-stack web development", "backend services", "AI integrations", "embedded systems"],
    heroTags: ["Next.js", "TypeScript", "Node.js", "Supabase", "Python", "ESP32"],
    availability: "Open to opportunities",
    // Backdrop-removed portrait so it sits directly on the page in both themes.
    photo: "images/profile-cutout.webp",
    // Small square crop used for the hero avatar.
    avatar: "images/avatar.webp",
    photoAlt: "Portrait of Joseph Clyde S. Daño"
  },

  contact: {
    email: "Danojosephclyde@gmail.com",
    phone: "+639614013375",
    phoneDisplay: "+63 961 401 3375",
    location: "Cebu City, Philippines"
  },

  socials: {
    github: "https://github.com/josephcloyd",
    // TODO: add your LinkedIn profile URL. Hidden until set.
    linkedin: ""
  },

  resume: {
    // PDF downloaded by every "Download Resume" button. Replace the file to update it.
    file: "Joseph-Clyde-Dano-Resume.pdf",
    page: "resume.html"
  },

  about: {
    paragraphs: [
      "I'm a technology enthusiast and developer with hands-on experience in software development, backend systems, technical support, automation, and embedded technologies.",
      "I enjoy building applications that solve practical problems, designing systems that improve workflows, and exploring how software and hardware can work together.",
      "My experience includes full-stack development, database integration, AI-assisted automation, website deployment, and microcontroller-based projects.",
      "Beyond programming, I value effective communication, collaboration, continuous improvement, and building technology that is useful, maintainable, and reliable."
    ],
    facts: [
      { label: "Based in", value: "Cebu City, Philippines" },
      { label: "Field", value: "Computer Engineering" },
      { label: "Focus", value: "Full-stack, backend, AI automation, embedded" },
      { label: "Working style", value: "Build, test, document, improve" }
    ]
  },

  experience: [
    {
      company: "Lifewood Data Technology",
      role: "IT and AI Executive Intern",
      period: "May 15 – August 5, 2026",
      type: "Internship",
      relatedProject: "project-lifeplan",
      responsibilities: [
        "Contributed to an automated production planning system.",
        "Developed and integrated backend services.",
        "Worked with web dashboards and databases.",
        "Assisted with system testing and troubleshooting.",
        "Collaborated with team members on software integration and automation workflows."
      ]
    },
    {
      company: "McDonald's",
      role: "Service Crew",
      period: "January – December 2025",
      type: "Part-time",
      responsibilities: [
        "Provided customer service in a fast-paced environment.",
        "Supported daily restaurant operations.",
        "Collaborated with coworkers to maintain efficient service.",
        "Demonstrated communication, adaptability, multitasking, and teamwork."
      ]
    },
    {
      company: "Aldesa",
      role: "Technical Support Representative",
      period: "May – November 2024",
      type: "",
      responsibilities: [
        "Assisted in diagnosing and repairing cameras and sensors.",
        "Helped manage and maintain the related monitoring systems.",
        "Supported day-to-day troubleshooting of hardware and system issues."
      ]
    }
  ],

  /*
   * Projects. `featured: true` renders the large showcase layout.
   * `groups` drive the filter tabs (see projectFilters below).
   * `summary` is the short text on cards; `overview` is the fuller introduction on the case-study page.
   * Case-study fields (overview, problem, solution, responsibilities, architecture, features,
   * challenges, results, lessons) are optional — sections without content are omitted.
   * `image`, `gallery`, `repo`, `demo` can also be supplied from Supabase admin by matching `id`.
   * `illustration` is artwork shown (labelled "Illustration") only until a real `image` is added.
   */
  projectFilters: [
    { id: "all", label: "All" },
    { id: "software", label: "Web & Software" },
    { id: "ai", label: "AI & Automation" },
    { id: "embedded", label: "Embedded & IoT" },
    { id: "logic", label: "Digital Logic" }
  ],

  projects: [
    {
      id: "project-lifeplan",
      illustration: "images/illustrations/lifeplan.svg",
      featured: true,
      title: "LifePlan",
      tagline: "AI-Assisted Production Planning System",
      category: "Full-stack · AI · Automation",
      groups: ["software", "ai"],
      // TODO: confirm status.
      status: "Internship project",
      summary:
        "An AI-assisted production planning platform that turns natural-language requirements into structured production schedules and downloadable Excel workbooks.",
      overview:
        "LifePlan is an AI-assisted production planning platform developed to simplify and automate the creation of structured production schedules. The system allows users to describe their operational requirements through natural language and converts those instructions into organized production plans. By bringing scheduling, workload estimation, and resource planning into a centralized platform, LifePlan reduces repetitive manual processes and provides a more efficient approach to managing production activities.",
      tech: ["Next.js", "TypeScript", "Node.js", "Supabase", "MCP", "ExcelJS", "Ollama", "OpenClaw"],
      highlights: [
        "Natural-language planning requests",
        "Automated Excel workbook generation",
        "Backend API endpoints",
        "Plan history and secure downloads",
        "AI workflows through MCP, Ollama, and OpenClaw"
      ],
      problem:
        "Building production schedules, workload estimates, and resource plans by hand was repetitive and slow, and turning unstructured requirements into consistent plans took too long.",
      solution:
        "The application combines a Next.js dashboard, a TypeScript-based backend, and Supabase for database management and file storage. It uses the Model Context Protocol (MCP), Ollama, and OpenClaw to support AI-assisted planning workflows. ExcelJS is integrated to automatically generate downloadable Excel workbooks containing structured planning information. The platform also includes plan history, backend API endpoints, and secure workbook download functionality, allowing users to access generated plans through the dashboard.",
      responsibilities: [
        "Contributed to the automated production planning system.",
        "Developed and integrated backend services.",
        "Worked with the web dashboard and database layer.",
        "Assisted with system testing and troubleshooting.",
        "Collaborated with the team on software integration and automation workflows."
      ],
      architecture: [
        { name: "Dashboard", detail: "Next.js" },
        { name: "Backend services", detail: "TypeScript APIs" },
        { name: "Data & files", detail: "Supabase database and storage" },
        { name: "Workbook engine", detail: "ExcelJS" },
        { name: "AI layer", detail: "MCP · Ollama · OpenClaw" }
      ],
      features: [
        "Structured production plans from natural-language requirements",
        "Scheduling, workload estimation, and resource planning in one place",
        "Automated Excel workbook generation with ExcelJS",
        "Plan history in the dashboard",
        "Backend API endpoints",
        "Secure workbook downloads",
        "Supabase database and file storage",
        "AI-assisted workflows through MCP, Ollama, and OpenClaw"
      ],
      challenges: [],
      results: "Reduced manual planning steps and produced consistent, exportable outputs for operational review.",
      lessons:
        "Developing LifePlan provided practical experience in full-stack application architecture, backend services, artificial intelligence integration, database operations, and workflow automation. The project demonstrates how natural-language interfaces can connect with conventional business systems to simplify complex operational tasks. It also highlights the importance of designing maintainable software, integrating multiple technologies, and transforming user requirements into functional applications.",
      image: "",
      gallery: [],
      repo: "",
      demo: ""
    },
    {
      id: "project-canoy-law",
      featured: true,
      title: "Canoy Law",
      tagline: "Professional Legal Services Website",
      category: "Web · Responsive Design · Deployment",
      groups: ["software"],
      // TODO: add the live URL to `demo`.
      status: "Deployed",
      summary:
        "A professional website for a legal services firm, focused on clean presentation, accessible navigation, and reliable public deployment.",
      overview:
        "Canoy Law is a professional business website developed to strengthen the digital presence of a legal services organization. The website focuses on presenting firm information and legal services through a clean, organized, and accessible interface. Its design emphasizes professionalism, readability, and straightforward navigation, allowing visitors to explore the firm's services and contact information across different devices.",
      tech: ["Responsive Web Design", "Web Hosting", "Domain & DNS", "SSL", "SEO"],
      highlights: ["Responsive layouts", "Hosting and deployment", "Custom domain and DNS", "SSL and accessibility troubleshooting"],
      problem: "",
      solution:
        "The development process involved creating and refining responsive website layouts, organizing content, and configuring the website for public deployment. Work included custom domain integration, DNS management, hosting configuration, and troubleshooting SSL and accessibility issues. Attention was also given to improving the visual consistency of the website and exploring search engine optimization practices to support its visibility through online search platforms.",
      responsibilities: [
        "Created and refined responsive website layouts.",
        "Organized website content for clear navigation.",
        "Configured hosting, custom domain integration, and DNS.",
        "Troubleshot SSL and accessibility issues.",
        "Improved visual consistency and explored SEO practices."
      ],
      architecture: [],
      features: [
        "Responsive design across devices",
        "Accessible, straightforward navigation",
        "Custom domain and DNS configuration",
        "SSL-secured public deployment",
        "SEO groundwork for search visibility"
      ],
      challenges: [],
      results: "",
      lessons:
        "This project provided experience in client-oriented web development, website deployment, domain infrastructure, and technical troubleshooting. Beyond frontend design, it emphasized the operational responsibilities involved in maintaining a publicly accessible website. Canoy Law demonstrates an ability to work with professional design requirements, configure hosting environments, and address technical problems affecting real-world website accessibility.",
      image: "images/canoy-law.webp",
      gallery: [],
      repo: "",
      demo: ""
    },
    {
      id: "project-pet-feeder",
      illustration: "images/illustrations/pet-feeder.svg",
      title: "Automated Pet Feeder",
      tagline: "Embedded Automation System",
      category: "Embedded · Automation",
      groups: ["embedded"],
      status: "Prototype",
      summary:
        "A hardware and software integration project that dispenses food through electronically controlled mechanisms.",
      overview:
        "The Automated Pet Feeder is a hardware and software integration project designed to explore how automation can assist with routine pet care. The system focuses on the concept of dispensing food through electronically controlled mechanisms, reducing the need for constant manual feeding. It demonstrates how embedded technology can be applied to everyday activities by connecting programmed instructions with physical hardware operations.",
      // TODO: add the specific microcontroller and components used.
      tech: ["Embedded Systems", "Electronics", "Control Logic", "Automation"],
      highlights: ["Hardware-software integration", "Programmed control logic", "Automated dispensing mechanism"],
      problem: "",
      solution:
        "The project involved developing an automated feeding mechanism using electronic components and programmable control logic. Its development explored the interaction between hardware, control signals, and software instructions to operate a physical dispensing system. Particular attention was given to understanding component integration, the sequence of automated operations, and the practical challenges associated with converting a programmed process into a functioning mechanical action.",
      responsibilities: [],
      architecture: [
        { name: "Control logic", detail: "Programmed instructions" },
        { name: "Control signals", detail: "Electronic components" },
        { name: "Mechanism", detail: "Food dispensing" }
      ],
      features: [
        "Electronically controlled food dispensing",
        "Programmable control logic",
        "Sequenced automated operations",
        "Hardware-software communication"
      ],
      challenges: [
        {
          challenge: "Converting a programmed process into a reliable mechanical action.",
          solution: "Focused on component integration and the sequence of automated operations, refining how control signals drive the dispensing mechanism."
        }
      ],
      results: "",
      lessons:
        "The Automated Pet Feeder strengthened practical knowledge of embedded systems, electronics, automation, and hardware-software communication. It provided an opportunity to apply programming concepts beyond conventional computer applications and into physical system control. The project represents an interest in developing accessible, practical automation solutions and understanding how engineering principles can improve simple daily processes.",
      image: "",
      gallery: [],
      repo: "",
      demo: ""
    },
    {
      id: "project-esp32",
      illustration: "images/illustrations/esp32-rfid.svg",
      title: "ESP32 + RFID System",
      tagline: "Microcontroller Integration System",
      category: "IoT · Embedded",
      groups: ["embedded"],
      status: "Prototype",
      summary:
        "An embedded prototype integrating RFID readers with ESP32 and ESP32-CAM boards, focused on reliable module communication and systematic debugging.",
      overview:
        "The ESP32 + RFID System is an embedded development prototype focused on integrating radio-frequency identification technology with ESP32-based microcontrollers. The project explores how identification data can be collected from RFID hardware and processed through programmed microcontroller operations. Its primary objective is to understand communication between electronic modules and demonstrate how identification technology can be incorporated into connected or automated systems.",
      tech: ["ESP32", "ESP32-CAM", "RFID", "Arduino IDE", "UART", "GPIO"],
      highlights: ["ESP32 / ESP32-CAM", "RFID integration", "UART serial communication", "Hardware troubleshooting"],
      problem: "Multiple hardware modules needed stable communication under constrained power and serial connections.",
      solution:
        "Development work involved experimenting with ESP32 and ESP32-CAM boards, RFID reader modules, wiring configurations, and serial communication interfaces. The project also included programming through the Arduino development environment and troubleshooting software compilation, library compatibility, GPIO connections, and communication behavior. Testing centered on establishing reliable interaction between the RFID reader and the microcontroller, with integration challenges forming an important part of the development process.",
      responsibilities: [],
      architecture: [
        { name: "RFID reader", detail: "Identification data" },
        { name: "ESP32 / ESP32-CAM", detail: "Processing and camera" },
        { name: "Serial (UART)", detail: "Communication and debugging" }
      ],
      features: [
        "RFID identification data read by the microcontroller",
        "ESP32 and ESP32-CAM boards",
        "UART serial communication between modules",
        "Wiring and GPIO configuration",
        "Programmed in the Arduino development environment"
      ],
      challenges: [
        {
          challenge: "Compilation errors and library compatibility issues in the Arduino environment.",
          solution: "Isolated library and board-configuration issues and tested changes one at a time."
        },
        {
          challenge: "Unreliable communication between the RFID reader and the microcontroller.",
          solution: "Checked wiring, GPIO assignments, voltage requirements, and serial output step by step, integrating one module at a time."
        }
      ],
      results: "Built a repeatable, step-by-step troubleshooting process for microcontroller and module integration.",
      lessons:
        "This project provided hands-on exposure to embedded programming, UART communication, RFID technology, and electronic system debugging. It highlighted the importance of hardware compatibility, voltage requirements, communication protocols, and systematic troubleshooting when working with microcontrollers. The experience contributes to a broader understanding of IoT development and how physical identification devices interact with software-based systems.",
      image: "",
      gallery: [],
      repo: "",
      demo: ""
    },
    {
      id: "project-alu",
      illustration: "images/illustrations/alu.svg",
      title: "Arithmetic Logic Unit",
      tagline: "Digital Logic and Computer Architecture",
      category: "Digital Electronics · Architecture",
      groups: ["logic"],
      status: "Simulation",
      summary:
        "An arithmetic logic unit designed in CircuitVerse from adders, subtractors, comparators, and multiplexers, tested through simulation.",
      overview:
        "The Arithmetic Logic Unit (ALU) project explores the fundamental digital circuits responsible for arithmetic and logical operations within computer processors. Designed using CircuitVerse, the project focuses on building and understanding logic components such as adders, subtractors, comparators, multiplexers, and binary arithmetic circuits. Its objective is to demonstrate how individual logic gates can be combined into functional digital systems capable of processing binary information.",
      tech: ["CircuitVerse", "Digital Logic", "Boolean Algebra", "Binary Arithmetic", "Truth Tables"],
      highlights: ["Adders and subtractors", "Comparators and multiplexers", "Binary multiplication and division", "Logic simulation"],
      problem: "",
      solution:
        "Development involved designing circuits, constructing truth tables, testing Boolean logic, and examining how multiple arithmetic operations can share output pathways through multiplexers. The project also explored binary multiplication and division, including comparison, subtraction, quotient generation, and remainder calculation. Different circuit components were tested and revised through simulation, while additional work investigated simplifying logic-gate configurations and translating digital designs into physical electronic circuits.",
      responsibilities: [],
      architecture: [
        { name: "Inputs A / B", detail: "Binary operands" },
        { name: "Arithmetic units", detail: "Adders · subtractors" },
        { name: "Comparators", detail: "Magnitude compare" },
        { name: "Multiplexer", detail: "Shared output path" }
      ],
      features: [
        "Adders and subtractors built at the gate level",
        "Comparators for magnitude comparison",
        "Multiplexers sharing one output pathway",
        "Binary multiplication and division with quotient and remainder",
        "Truth tables and Boolean logic testing",
        "Simplified logic-gate configurations"
      ],
      challenges: [],
      results: "",
      lessons:
        "This project strengthened knowledge of digital electronics, binary arithmetic, Boolean algebra, combinational logic, and computer architecture. Rather than relying entirely on predefined arithmetic components, the development process emphasized understanding how calculations are performed at the logic-gate level. The project demonstrates practical problem-solving in digital circuit design and provides a foundation for more advanced work involving processor architecture, hardware optimization, and digital systems engineering.",
      image: "",
      gallery: [],
      repo: "",
      demo: ""
    }
  ],

  /* Smaller builds shown in the compact "More builds" list. Same fields as projects. */
  moreProjects: [
    {
      id: "project-whatsapp",
      illustration: "images/illustrations/chat-planner.svg",
      title: "WhatsApp Production Planner Bot",
      tagline: "Conversational Automation",
      category: "Chatbot · Backend Integration",
      groups: ["ai", "software"],
      status: "Part of LifePlan",
      summary:
        "A WhatsApp bot that lets users submit production requirements by message and receive generated plans and Excel workbook links.",
      overview:
        "The WhatsApp Production Planner Bot is a conversational automation interface developed as part of the LifePlan production planning ecosystem. The bot allows users to submit production requirements through WhatsApp messages instead of interacting exclusively with a web dashboard. By using a familiar messaging platform as an input channel, the system provides an alternative way to initiate planning requests and receive generated production information.",
      tech: ["Node.js", "TypeScript", "MCP", "Supabase"],
      problem: "Planning requests needed to be accessible without opening a separate dashboard.",
      solution:
        "The bot was implemented using Node.js and TypeScript, with integration into the production planning backend and Model Context Protocol architecture. Incoming messages are processed to identify supported planning commands and forward relevant information to the planning service. The system can generate structured production plans, store generated outputs through Supabase, and return links to Excel workbooks through WhatsApp. Development also involved configuring the messaging connection, managing sessions, and improving message-handling reliability.",
      features: [
        "Planning requests submitted through WhatsApp",
        "Recognition of supported planning commands",
        "Plan generation through the LifePlan backend",
        "Generated outputs stored in Supabase",
        "Excel workbook links returned in chat",
        "Session management for the messaging connection"
      ],
      results: "Made the planning workflow available from a familiar mobile channel.",
      lessons:
        "This project demonstrates the integration of conversational interfaces with backend automation and business applications. It provided experience in asynchronous message processing, API communication, chatbot workflows, and connecting messaging services with database-backed software. The project illustrates how everyday communication platforms can be extended into practical interfaces for operational systems, reducing the steps required for users to interact with automated business processes."
    },
    {
      id: "project-hr",
      illustration: "images/illustrations/hr-system.svg",
      title: "HR Employee Management System",
      tagline: "Human Resource Information System",
      category: "Business Software · Database",
      groups: ["software"],
      // TODO: confirm status.
      status: "In development",
      summary:
        "A human resource information system designed to centralize employee records, attendance, leave, and employee requests.",
      overview:
        "The HR Employee Management System is a business application project focused on organizing employee information and supporting common human resource operations. The system is designed to provide a centralized environment for managing personnel records and administrative processes. Its intended functionality includes employee profile management, attendance monitoring, leave administration, and employee-related requests, with an emphasis on improving the organization and accessibility of workplace information.",
      tech: ["Supabase", "PostgreSQL", "Authentication"],
      solution:
        "The project's development scope includes designing employee management interfaces, structuring relational database records, and exploring authentication and access control for administrative workflows. Technologies associated with the project include Supabase and PostgreSQL for data management, alongside web development tools for presenting and interacting with employee information. The overall architecture is intended to support organized employee data, reusable interface components, and secure interactions between frontend applications and backend services.",
      features: [
        "Employee profile management",
        "Attendance monitoring",
        "Leave administration",
        "Employee-related requests",
        "Authentication and access control for admin workflows"
      ],
      lessons:
        "This project explores the challenges of developing administrative software that balances usability, data organization, and system security. It provides opportunities to apply database design, frontend development, authentication concepts, and business-process modeling to a realistic organizational scenario. The HR system reflects an interest in building software that supports internal operations while maintaining structured, accessible, and manageable business information."
    },
    {
      id: "project-guardian-bag",
      illustration: "images/illustrations/guardian-bag.svg",
      title: "Guardian Bag",
      tagline: "IoT Smart Safety Backpack",
      category: "IoT · Research & Development",
      groups: ["embedded"],
      status: "Concept",
      summary:
        "An IoT smart backpack concept combining an ESP32, GPS location reporting, and SIM800L communication for emergency alerts.",
      overview:
        "Guardian Bag is an IoT-based smart backpack concept designed to explore how everyday personal accessories can incorporate safety-oriented technology. The proposed system focuses on combining location monitoring, emergency communication, and embedded electronic components into a portable platform. Its goal is to investigate how connected hardware can provide additional safety capabilities for people traveling, commuting, or participating in outdoor activities.",
      tech: ["ESP32", "GPS", "SIM800L GSM"],
      solution:
        "The proposed design incorporates an ESP32 microcontroller, a GPS module for location information, and a SIM800L GSM module for communication. Intended functionality includes activating emergency alerts, reporting location information, and coordinating interactions between the device's hardware components. The project also considers practical engineering challenges such as power requirements, physical component placement, portability, and the reliability of communication systems in different environments.",
      features: [
        "Emergency alert activation",
        "GPS location reporting",
        "GSM communication through SIM800L",
        "Coordinated ESP32-based hardware control"
      ],
      lessons:
        "Guardian Bag represents an exploration of embedded system design, wireless communication, GPS technology, and personal safety applications. The concept encourages consideration of both the software and physical constraints involved in developing portable IoT devices. Its research and design direction demonstrates how multiple hardware technologies could be integrated into a practical product while providing a foundation for future prototyping, testing, and system improvement."
    },
    {
      id: "project-rfid-attendance",
      illustration: "images/illustrations/rfid-attendance.svg",
      title: "RFID Attendance System",
      tagline: "Automated Identification and Recording",
      category: "Embedded · Identification",
      groups: ["embedded"],
      status: "Concept",
      summary:
        "A contactless attendance concept that reads RFID cards with an ESP8266 and RDM6300 reader and turns scans into attendance records.",
      overview:
        "The RFID Attendance System is an embedded application concept designed to explore automated attendance recording through contactless identification technology. The system aims to reduce reliance on manual attendance procedures by allowing individuals to identify themselves using RFID cards or tags. Its intended workflow involves collecting an RFID identifier, processing it through a microcontroller, and associating the identification event with a corresponding attendance record.",
      tech: ["ESP8266", "RDM6300", "RFID", "Serial Communication"],
      problem: "Manual attendance collection is slow and difficult to keep consistent.",
      solution:
        "The proposed system uses an ESP8266 microcontroller and an RDM6300 RFID reader to demonstrate hardware-based identification and data processing. Its design includes reading identification information through serial communication, validating scanned identifiers, and organizing attendance events for subsequent record management. Development considerations include reliable communication between components, accurate data handling, hardware compatibility, and the possibility of integrating the identification process with a database-backed application.",
      features: [
        "Contactless RFID card and tag identification",
        "Serial communication between reader and microcontroller",
        "Validation of scanned identifiers",
        "Attendance events organized for record management"
      ],
      lessons:
        "This project explores the application of microcontroller programming, RFID communication, and automation to an administrative task. It highlights the relationship between physical identification devices and digital record-management systems while introducing considerations such as accuracy, repeat scanning, and data organization. The concept provides a practical foundation for future work involving attendance platforms, access-control systems, and connected identification technologies."
    },
    {
      id: "project-student-management",
      illustration: "images/illustrations/student-management.svg",
      title: "Student Management System",
      tagline: "Academic Record Management Application",
      category: "Web · Database Systems",
      groups: ["software"],
      // TODO: the PHP/MySQL version still needs verifying; set a status once confirmed.
      status: "",
      summary:
        "A record-management project for storing, searching, and updating student information through structured CRUD workflows.",
      overview:
        "The Student Management System is a database-oriented application project focused on organizing and managing student information through structured software workflows. The project explores how student records can be stored, retrieved, searched, and updated more efficiently than through manual record-keeping methods. Its goal is to demonstrate essential information management principles while providing a clear interface for common academic data operations.",
      tech: ["PHP", "MySQL", "HTML", "CSS", "JavaScript", "Python"],
      solution:
        "The proposed web application uses PHP and MySQL for server-side processing and relational data storage, with HTML, CSS, and JavaScript supporting the user interface. Related programming work also included developing Python-based student record exercises involving dictionaries, data structures, grade calculations, searching, input validation, and file handling.",
      features: [
        "Create, read, update, and delete student records",
        "Search and retrieval",
        "Input validation",
        "Grade calculations and file handling (Python exercises)"
      ],
      lessons:
        "This project provides a foundation in CRUD operations, data validation, database organization, and basic application architecture. It connects fundamental programming skills with practical information management requirements, demonstrating how structured software can simplify repetitive administrative tasks. The project also supports further learning in backend development, user interface design, database connectivity, and the development of maintainable web-based management systems."
    }
  ],

  /*
   * Tech stack. `icon` is a key from brand-icons.js; items without one show a monogram.
   */
  techStack: [
    {
      id: "languages",
      label: "Languages",
      items: [
        { name: "Python", icon: "python" },
        { name: "JavaScript", icon: "javascript" },
        { name: "TypeScript", icon: "typescript" },
        { name: "PHP", icon: "php" },
        { name: "SQL", mono: "SQL" },
        { name: "HTML", icon: "html5" },
        { name: "CSS", icon: "css3" }
      ]
    },
    {
      id: "frontend",
      label: "Frontend",
      items: [
        { name: "React", icon: "react" },
        { name: "Next.js", icon: "nextdotjs" },
        { name: "Responsive Web Design", mono: "RWD" }
      ]
    },
    {
      id: "backend",
      label: "Backend",
      items: [
        { name: "Node.js", icon: "nodedotjs" },
        { name: "Express.js", icon: "express" },
        { name: "REST APIs", mono: "API" },
        { name: "MCP", mono: "MCP" }
      ]
    },
    {
      id: "databases",
      label: "Databases",
      items: [
        { name: "Supabase", icon: "supabase" },
        { name: "PostgreSQL", icon: "postgresql" }
      ]
    },
    {
      id: "ai",
      label: "AI & Automation",
      items: [
        { name: "Ollama", icon: "ollama" },
        { name: "OpenClaw", mono: "OC" },
        { name: "AI-assisted Workflows", mono: "AI" }
      ]
    },
    {
      id: "hardware",
      label: "Hardware & Embedded",
      items: [
        { name: "ESP32", icon: "espressif" },
        { name: "ESP32-CAM", icon: "espressif" },
        { name: "RFID", mono: "RFID" },
        { name: "IoT", mono: "IoT" },
        { name: "Digital Logic", mono: "1/0" }
      ]
    },
    {
      id: "support",
      label: "Technical Support",
      items: [
        { name: "Website Deployment", mono: "DEP" },
        { name: "Web Hosting", mono: "WEB" },
        { name: "Domain & DNS Configuration", mono: "DNS" },
        { name: "SSL Troubleshooting", mono: "SSL" }
      ]
    },
    {
      id: "tools",
      label: "Tools",
      items: [
        { name: "Visual Studio Code", mono: "VSC" },
        { name: "Git", icon: "git" },
        { name: "GitHub", icon: "github" },
        { name: "Vercel", icon: "vercel" },
        { name: "PowerShell", mono: "PS" }
      ]
    }
  ],

  /* Shown on resume.html only. */
  education: [
    { title: "BS Computer Engineering", place: "University of Cebu – Main Campus", note: "In progress" }
  ]
};
