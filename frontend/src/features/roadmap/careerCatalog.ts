export interface CareerOption {
  id: string;
  slug: string;
  title: string;
  category: CareerCategory;
  shortDesc: string;
  effortHours: number;
  popular?: boolean;
  skills: string[];
  stages: {
    title: string;
    skills: string[];
    effortHours: number;
  }[];
}

export type CareerCategory =
  | 'Software & Web'
  | 'AI & Data Science'
  | 'Cloud & DevOps'
  | 'Cybersecurity'
  | 'Mobile & Multiplatform'
  | 'Game Dev & 3D'
  | 'UI/UX & Product Design'
  | 'Product & Agile Leadership'
  | 'QA & Reliability'
  | 'FinTech & Web3'
  | 'Hardware & Robotics'
  | 'Enterprise & Applied Tech';

export const careerCategories: { id: string; label: string }[] = [
  {
    "id": "all",
    "label": "All (200+ Careers)"
  },
  {
    "id": "Software & Web",
    "label": "Software & Web"
  },
  {
    "id": "AI & Data Science",
    "label": "AI & Data"
  },
  {
    "id": "Cloud & DevOps",
    "label": "Cloud & DevOps"
  },
  {
    "id": "Cybersecurity",
    "label": "Cybersecurity"
  },
  {
    "id": "Mobile & Multiplatform",
    "label": "Mobile"
  },
  {
    "id": "Game Dev & 3D",
    "label": "Game & 3D"
  },
  {
    "id": "UI/UX & Product Design",
    "label": "UI/UX Design"
  },
  {
    "id": "Product & Agile Leadership",
    "label": "Product & Mgmt"
  },
  {
    "id": "QA & Reliability",
    "label": "QA & Testing"
  },
  {
    "id": "FinTech & Web3",
    "label": "FinTech & Web3"
  },
  {
    "id": "Hardware & Robotics",
    "label": "Hardware & Robotics"
  },
  {
    "id": "Enterprise & Applied Tech",
    "label": "Enterprise & Applied"
  }
];

export const comprehensiveCareerCatalog: CareerOption[] = [
  {
    "id": "c_1_full-stack-engineer",
    "slug": "full-stack-engineer",
    "title": "Full Stack Engineer",
    "category": "Software & Web",
    "shortDesc": "Build end-to-end scalable web applications, REST/GraphQL APIs, and database architectures.",
    "effortHours": 140,
    "popular": true,
    "skills": [
      "TypeScript",
      "React 19",
      "Node.js",
      "PostgreSQL",
      "Supabase",
      "Docker"
    ],
    "stages": [
      {
        "title": "Phase 1: Full Core Fundamentals & Tooling",
        "skills": [
          "TypeScript",
          "React 19",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "React 19",
          "Node.js",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Node.js",
          "PostgreSQL",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "TypeScript",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_2_frontend-engineer",
    "slug": "frontend-engineer",
    "title": "Frontend Engineer",
    "category": "Software & Web",
    "shortDesc": "Create high-performance user interfaces, animations, and responsive web platforms.",
    "effortHours": 115,
    "popular": true,
    "skills": [
      "React",
      "Next.js",
      "TypeScript",
      "CSS Grid",
      "Tailwind",
      "Performance Optimization"
    ],
    "stages": [
      {
        "title": "Phase 1: Frontend Core Fundamentals & Tooling",
        "skills": [
          "React",
          "Next.js",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Next.js",
          "TypeScript",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "TypeScript",
          "CSS Grid",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "React",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_3_backend-specialist",
    "slug": "backend-specialist",
    "title": "Backend Specialist",
    "category": "Software & Web",
    "shortDesc": "Architect high-throughput server systems, caching layers, and relational data models.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "Go",
      "Node.js",
      "PostgreSQL",
      "Redis",
      "Kafka",
      "Docker"
    ],
    "stages": [
      {
        "title": "Phase 1: Backend Core Fundamentals & Tooling",
        "skills": [
          "Go",
          "Node.js",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Node.js",
          "PostgreSQL",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "PostgreSQL",
          "Redis",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Go",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_4_next-js-full-stack-specialist",
    "slug": "next-js-full-stack-specialist",
    "title": "Next.js Full Stack Specialist",
    "category": "Software & Web",
    "shortDesc": "Master Server Components, Server Actions, Edge Caching, and Prisma/Drizzle ORM.",
    "effortHours": 120,
    "popular": true,
    "skills": [
      "Next.js 15",
      "React Server Components",
      "Server Actions",
      "Drizzle ORM",
      "Tailwind",
      "Vercel"
    ],
    "stages": [
      {
        "title": "Phase 1: Next.js Core Fundamentals & Tooling",
        "skills": [
          "Next.js 15",
          "React Server Components",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "React Server Components",
          "Server Actions",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Server Actions",
          "Drizzle ORM",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Next.js 15",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_5_vue-js-nuxt-3-developer",
    "slug": "vue-js-nuxt-3-developer",
    "title": "Vue.js & Nuxt 3 Developer",
    "category": "Software & Web",
    "shortDesc": "Build elegant, reactive enterprise portals with Vue 3 Composition API and Nuxt 3.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Vue 3",
      "Nuxt 3",
      "Pinia",
      "TypeScript",
      "Nitro Engine",
      "Tailwind CSS"
    ],
    "stages": [
      {
        "title": "Phase 1: Vue.js Core Fundamentals & Tooling",
        "skills": [
          "Vue 3",
          "Nuxt 3",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Nuxt 3",
          "Pinia",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Pinia",
          "TypeScript",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Vue 3",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_6_angular-enterprise-architect",
    "slug": "angular-enterprise-architect",
    "title": "Angular Enterprise Architect",
    "category": "Software & Web",
    "shortDesc": "Architect large-scale enterprise portals with standalone components, RxJS, and NgRx.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Angular 18",
      "RxJS",
      "NgRx",
      "TypeScript",
      "Signals",
      "Microfrontends"
    ],
    "stages": [
      {
        "title": "Phase 1: Angular Core Fundamentals & Tooling",
        "skills": [
          "Angular 18",
          "RxJS",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "RxJS",
          "NgRx",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "NgRx",
          "TypeScript",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Angular 18",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_7_sveltekit-modern-web-developer",
    "slug": "sveltekit-modern-web-developer",
    "title": "SvelteKit Modern Web Developer",
    "category": "Software & Web",
    "shortDesc": "Deliver zero-runtime, compiler-first reactive web applications with Svelte 5 and SvelteKit.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "Svelte 5",
      "SvelteKit",
      "Runes",
      "TypeScript",
      "Tailwind CSS",
      "Vite"
    ],
    "stages": [
      {
        "title": "Phase 1: SvelteKit Core Fundamentals & Tooling",
        "skills": [
          "Svelte 5",
          "SvelteKit",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "SvelteKit",
          "Runes",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Runes",
          "TypeScript",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Svelte 5",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_8_python-software-engineer",
    "slug": "python-software-engineer",
    "title": "Python Software Engineer",
    "category": "Software & Web",
    "shortDesc": "Build clean web services, automation scripts, and server backends with Python ecosystem.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Python 3.12",
      "FastAPI",
      "Django",
      "SQLAlchemy",
      "PyTest",
      "Asyncio"
    ],
    "stages": [
      {
        "title": "Phase 1: Python Core Fundamentals & Tooling",
        "skills": [
          "Python 3.12",
          "FastAPI",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "FastAPI",
          "Django",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Django",
          "SQLAlchemy",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Python 3.12",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_9_java-enterprise-developer",
    "slug": "java-enterprise-developer",
    "title": "Java Enterprise Developer",
    "category": "Software & Web",
    "shortDesc": "Construct resilient enterprise services, Spring Boot microservices, and secure transactional pipelines.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "Java 21",
      "Spring Boot 3",
      "Hibernate",
      "Microservices",
      "PostgreSQL",
      "Docker"
    ],
    "stages": [
      {
        "title": "Phase 1: Java Core Fundamentals & Tooling",
        "skills": [
          "Java 21",
          "Spring Boot 3",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Spring Boot 3",
          "Hibernate",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Hibernate",
          "Microservices",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Java 21",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_10_go-systems-engineer",
    "slug": "go-systems-engineer",
    "title": "Go Systems Engineer",
    "category": "Software & Web",
    "shortDesc": "Design lightning-fast microservices, networking tools, and low-latency concurrent systems.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "Go",
      "Goroutines",
      "gRPC",
      "Protobuf",
      "PostgreSQL",
      "Docker"
    ],
    "stages": [
      {
        "title": "Phase 1: Go Core Fundamentals & Tooling",
        "skills": [
          "Go",
          "Goroutines",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Goroutines",
          "gRPC",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "gRPC",
          "Protobuf",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Go",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_11_rust-systems-programmer",
    "slug": "rust-systems-programmer",
    "title": "Rust Systems Programmer",
    "category": "Software & Web",
    "shortDesc": "Master memory safety without garbage collection for high-performance servers and tools.",
    "effortHours": 155,
    "popular": true,
    "skills": [
      "Rust",
      "Borrow Checker",
      "Tokio",
      "Axum",
      "WebAssembly",
      "Cargo"
    ],
    "stages": [
      {
        "title": "Phase 1: Rust Core Fundamentals & Tooling",
        "skills": [
          "Rust",
          "Borrow Checker",
          "Environment Setup"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Borrow Checker",
          "Tokio",
          "Best Practices"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Tokio",
          "Axum",
          "Performance Tuning"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Rust",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_12_c-net-cloud-architect",
    "slug": "c-net-cloud-architect",
    "title": "C# / .NET Cloud Architect",
    "category": "Software & Web",
    "shortDesc": "Engineer enterprise grade ASP.NET Core backends, cloud microservices, and entity models.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "C# 12",
      ".NET 8",
      "ASP.NET Core",
      "EF Core",
      "SQL Server",
      "Azure"
    ],
    "stages": [
      {
        "title": "Phase 1: C# Core Fundamentals & Tooling",
        "skills": [
          "C# 12",
          ".NET 8",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          ".NET 8",
          "ASP.NET Core",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "ASP.NET Core",
          "EF Core",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "C# 12",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_13_php-laravel-specialist",
    "slug": "php-laravel-specialist",
    "title": "PHP & Laravel Specialist",
    "category": "Software & Web",
    "shortDesc": "Deliver rapid, robust web applications using Laravel 11, Livewire, and modern PHP 8.3.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "PHP 8.3",
      "Laravel 11",
      "Inertia.js",
      "Livewire 3",
      "MySQL",
      "Tailwind"
    ],
    "stages": [
      {
        "title": "Phase 1: PHP Core Fundamentals & Tooling",
        "skills": [
          "PHP 8.3",
          "Laravel 11",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Laravel 11",
          "Inertia.js",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Inertia.js",
          "Livewire 3",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PHP 8.3",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_14_ruby-on-rails-developer",
    "slug": "ruby-on-rails-developer",
    "title": "Ruby on Rails Developer",
    "category": "Software & Web",
    "shortDesc": "Build full-featured SaaS web products with developer joy using Rails 7, Hotwire, and Turbo.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Ruby 3.3",
      "Rails 7",
      "Hotwire Turbo",
      "Stimulus",
      "PostgreSQL",
      "Sidekiq"
    ],
    "stages": [
      {
        "title": "Phase 1: Ruby Core Fundamentals & Tooling",
        "skills": [
          "Ruby 3.3",
          "Rails 7",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Rails 7",
          "Hotwire Turbo",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Hotwire Turbo",
          "Stimulus",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Ruby 3.3",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_15_elixir-phoenix-developer",
    "slug": "elixir-phoenix-developer",
    "title": "Elixir & Phoenix Developer",
    "category": "Software & Web",
    "shortDesc": "Harness the BEAM virtual machine for millions of concurrent connections with Phoenix LiveView.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Elixir",
      "Phoenix LiveView",
      "Erlang OTP",
      "Ecto",
      "PostgreSQL",
      "WebSockets"
    ],
    "stages": [
      {
        "title": "Phase 1: Elixir Core Fundamentals & Tooling",
        "skills": [
          "Elixir",
          "Phoenix LiveView",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Phoenix LiveView",
          "Erlang OTP",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Erlang OTP",
          "Ecto",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Elixir",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_16_api-microservices-architect",
    "slug": "api-microservices-architect",
    "title": "API & Microservices Architect",
    "category": "Software & Web",
    "shortDesc": "Design resilient distributed contracts, API gateways, and event-driven microservices.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "REST OpenAPI",
      "gRPC",
      "GraphQL Federation",
      "Envoy Gateway",
      "Kafka",
      "Docker"
    ],
    "stages": [
      {
        "title": "Phase 1: API Core Fundamentals & Tooling",
        "skills": [
          "REST OpenAPI",
          "gRPC",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "gRPC",
          "GraphQL Federation",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "GraphQL Federation",
          "Envoy Gateway",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "REST OpenAPI",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_17_webassembly-low-level-web-developer",
    "slug": "webassembly-low-level-web-developer",
    "title": "WebAssembly & Low-Level Web Developer",
    "category": "Software & Web",
    "shortDesc": "Run near-native C/Rust code in the browser for CAD, audio DSP, and high-performance computing.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Rust",
      "WebAssembly (Wasm)",
      "Emscripten",
      "Web Workers",
      "SharedArrayBuffer",
      "Canvas API"
    ],
    "stages": [
      {
        "title": "Phase 1: WebAssembly Core Fundamentals & Tooling",
        "skills": [
          "Rust",
          "WebAssembly (Wasm)",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "WebAssembly (Wasm)",
          "Emscripten",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Emscripten",
          "Web Workers",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Rust",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_18_graphql-systems-engineer",
    "slug": "graphql-systems-engineer",
    "title": "GraphQL Systems Engineer",
    "category": "Software & Web",
    "shortDesc": "Architect federated data graphs, Apollo routers, and schema-first client interfaces.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "GraphQL",
      "Apollo Federation",
      "GraphOS",
      "Schema Design",
      "DataLoader",
      "TypeScript"
    ],
    "stages": [
      {
        "title": "Phase 1: GraphQL Core Fundamentals & Tooling",
        "skills": [
          "GraphQL",
          "Apollo Federation",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Apollo Federation",
          "GraphOS",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "GraphOS",
          "Schema Design",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "GraphQL",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_19_serverless-application-engineer",
    "slug": "serverless-application-engineer",
    "title": "Serverless Application Engineer",
    "category": "Software & Web",
    "shortDesc": "Engineer auto-scaling, event-driven web platforms using Cloudflare Workers, Lambda, and SST.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "AWS Lambda",
      "Cloudflare Workers",
      "SST / Serverless Framework",
      "DynamoDB",
      "EventBridge"
    ],
    "stages": [
      {
        "title": "Phase 1: Serverless Core Fundamentals & Tooling",
        "skills": [
          "AWS Lambda",
          "Cloudflare Workers",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Cloudflare Workers",
          "SST / Serverless Framework",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "SST / Serverless Framework",
          "DynamoDB",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "AWS Lambda",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_20_jamstack-headless-cms-developer",
    "slug": "jamstack-headless-cms-developer",
    "title": "Jamstack & Headless CMS Developer",
    "category": "Software & Web",
    "shortDesc": "Create blazingly fast content hubs with Astro, Next.js, and headless GraphQL backends.",
    "effortHours": 95,
    "popular": false,
    "skills": [
      "Astro",
      "Sanity.io",
      "Contentful",
      "GraphQL",
      "Tailwind CSS",
      "Vercel / Netlify"
    ],
    "stages": [
      {
        "title": "Phase 1: Jamstack Core Fundamentals & Tooling",
        "skills": [
          "Astro",
          "Sanity.io",
          "Environment Setup"
        ],
        "effortHours": 21
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Sanity.io",
          "Contentful",
          "Best Practices"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Contentful",
          "GraphQL",
          "Performance Tuning"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Astro",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 20
      }
    ]
  },
  {
    "id": "c_21_remix-web-standards-specialist",
    "slug": "remix-web-standards-specialist",
    "title": "Remix & Web Standards Specialist",
    "category": "Software & Web",
    "shortDesc": "Leverage native web fetch, progressive enhancement, and nested routes for zero-bundle feel.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "Remix.run",
      "React Router v7",
      "Web Standards (Request/Response)",
      "Optimistic UI",
      "SQLite"
    ],
    "stages": [
      {
        "title": "Phase 1: Remix Core Fundamentals & Tooling",
        "skills": [
          "Remix.run",
          "React Router v7",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "React Router v7",
          "Web Standards (Request/Response)",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Web Standards (Request/Response)",
          "Optimistic UI",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Remix.run",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_22_realtime-websocket-engineer",
    "slug": "realtime-websocket-engineer",
    "title": "Realtime WebSocket Engineer",
    "category": "Software & Web",
    "shortDesc": "Construct low-latency multiplayer collaborative canvases, chat hubs, and live streaming tools.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "WebSockets",
      "WebRTC",
      "Socket.io",
      "Redis Pub/Sub",
      "CRDTs (Yjs)",
      "Node.js"
    ],
    "stages": [
      {
        "title": "Phase 1: Realtime Core Fundamentals & Tooling",
        "skills": [
          "WebSockets",
          "WebRTC",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "WebRTC",
          "Socket.io",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Socket.io",
          "Redis Pub/Sub",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "WebSockets",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_23_scalable-database-engineer",
    "slug": "scalable-database-engineer",
    "title": "Scalable Database Engineer",
    "category": "Software & Web",
    "shortDesc": "Optimize complex query plans, partition sharding, and high-availability clustered databases.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "PostgreSQL Internals",
      "Vitess / Citus",
      "Database Indexing",
      "Replication",
      "Connection Pooling"
    ],
    "stages": [
      {
        "title": "Phase 1: Scalable Core Fundamentals & Tooling",
        "skills": [
          "PostgreSQL Internals",
          "Vitess / Citus",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Vitess / Citus",
          "Database Indexing",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Database Indexing",
          "Replication",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PostgreSQL Internals",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_24_search-engine-specialist",
    "slug": "search-engine-specialist",
    "title": "Search Engine Specialist",
    "category": "Software & Web",
    "shortDesc": "Deliver sub-10ms search experiences, faceted filtering, and semantic search indexing.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "Elasticsearch",
      "OpenSearch",
      "Meilisearch",
      "Inverted Indexing",
      "BM25 Scoring",
      "Logstash"
    ],
    "stages": [
      {
        "title": "Phase 1: Search Core Fundamentals & Tooling",
        "skills": [
          "Elasticsearch",
          "OpenSearch",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "OpenSearch",
          "Meilisearch",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Meilisearch",
          "Inverted Indexing",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Elasticsearch",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_25_ai-application-engineer",
    "slug": "ai-application-engineer",
    "title": "AI Application Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Integrate LLMs, prompt pipelines, vector retrieval, and autonomous agents into web applications.",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "LangChain",
      "LlamaIndex",
      "OpenAI / Claude API",
      "pgvector",
      "Next.js",
      "Python"
    ],
    "stages": [
      {
        "title": "Phase 1: AI Core Fundamentals & Tooling",
        "skills": [
          "LangChain",
          "LlamaIndex",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "LlamaIndex",
          "OpenAI / Claude API",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "OpenAI / Claude API",
          "pgvector",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "LangChain",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_26_machine-learning-engineer",
    "slug": "machine-learning-engineer",
    "title": "Machine Learning Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Train, evaluate, and productionize predictive machine learning models at scale.",
    "effortHours": 150,
    "popular": true,
    "skills": [
      "PyTorch",
      "Scikit-Learn",
      "Feature Engineering",
      "MLflow",
      "Docker",
      "FastAPI"
    ],
    "stages": [
      {
        "title": "Phase 1: Machine Core Fundamentals & Tooling",
        "skills": [
          "PyTorch",
          "Scikit-Learn",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Scikit-Learn",
          "Feature Engineering",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Feature Engineering",
          "MLflow",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PyTorch",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_27_data-scientist",
    "slug": "data-scientist",
    "title": "Data Scientist",
    "category": "AI & Data Science",
    "shortDesc": "Extract actionable business insights through statistical inference, hypothesis testing, and machine learning.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "Python",
      "Pandas",
      "Statistical Modeling",
      "A/B Testing",
      "Seaborn",
      "SQL"
    ],
    "stages": [
      {
        "title": "Phase 1: Data Core Fundamentals & Tooling",
        "skills": [
          "Python",
          "Pandas",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Pandas",
          "Statistical Modeling",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Statistical Modeling",
          "A/B Testing",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Python",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_28_data-engineer",
    "slug": "data-engineer",
    "title": "Data Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Design fault-tolerant batch and streaming data pipelines, lakehouses, and analytics warehouses.",
    "effortHours": 145,
    "popular": true,
    "skills": [
      "Apache Spark",
      "Kafka",
      "Airflow",
      "Snowflake",
      "dbt",
      "SQL"
    ],
    "stages": [
      {
        "title": "Phase 1: Data Core Fundamentals & Tooling",
        "skills": [
          "Apache Spark",
          "Kafka",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Kafka",
          "Airflow",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Airflow",
          "Snowflake",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Apache Spark",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_29_prompt-engineer-context-architect",
    "slug": "prompt-engineer-context-architect",
    "title": "Prompt Engineer & Context Architect",
    "category": "AI & Data Science",
    "shortDesc": "Craft structured few-shot prompts, evaluate output reliability, and design context window strategies.",
    "effortHours": 95,
    "popular": true,
    "skills": [
      "Prompt Chaining",
      "Chain-of-Thought",
      "Prompt Evaluation Frameworks",
      "DSPy",
      "Few-Shot Learning"
    ],
    "stages": [
      {
        "title": "Phase 1: Prompt Core Fundamentals & Tooling",
        "skills": [
          "Prompt Chaining",
          "Chain-of-Thought",
          "Environment Setup"
        ],
        "effortHours": 21
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Chain-of-Thought",
          "Prompt Evaluation Frameworks",
          "Best Practices"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Prompt Evaluation Frameworks",
          "DSPy",
          "Performance Tuning"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Prompt Chaining",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 20
      }
    ]
  },
  {
    "id": "c_30_llm-fine-tuning-specialist",
    "slug": "llm-fine-tuning-specialist",
    "title": "LLM Fine-Tuning Specialist",
    "category": "AI & Data Science",
    "shortDesc": "Fine-tune open-weights models (Llama 3, Mistral) using LoRA, QLoRA, and alignment techniques.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "HuggingFace",
      "LoRA / QLoRA",
      "Axolotl",
      "PEFT",
      "DPO / RLHF",
      "PyTorch"
    ],
    "stages": [
      {
        "title": "Phase 1: LLM Core Fundamentals & Tooling",
        "skills": [
          "HuggingFace",
          "LoRA / QLoRA",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "LoRA / QLoRA",
          "Axolotl",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Axolotl",
          "PEFT",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "HuggingFace",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_31_vector-db-rag-architect",
    "slug": "vector-db-rag-architect",
    "title": "Vector DB & RAG Architect",
    "category": "AI & Data Science",
    "shortDesc": "Build high-recall Retrieval-Augmented Generation systems with hybrid vector and keyword search.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "Pinecone",
      "Qdrant",
      "Milvus",
      "pgvector",
      "Embedding Models",
      "Chunking Strategies"
    ],
    "stages": [
      {
        "title": "Phase 1: Vector Core Fundamentals & Tooling",
        "skills": [
          "Pinecone",
          "Qdrant",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Qdrant",
          "Milvus",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Milvus",
          "pgvector",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Pinecone",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_32_computer-vision-engineer",
    "slug": "computer-vision-engineer",
    "title": "Computer Vision Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Build image detection, object tracking, and spatial segmentation models for real-world vision.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "OpenCV",
      "YOLOv10",
      "PyTorch",
      "Image Segmentation",
      "TensorRT",
      "CUDA"
    ],
    "stages": [
      {
        "title": "Phase 1: Computer Core Fundamentals & Tooling",
        "skills": [
          "OpenCV",
          "YOLOv10",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "YOLOv10",
          "PyTorch",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "PyTorch",
          "Image Segmentation",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "OpenCV",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_33_natural-language-processing-specialist",
    "slug": "natural-language-processing-specialist",
    "title": "Natural Language Processing Specialist",
    "category": "AI & Data Science",
    "shortDesc": "Develop tokenizers, sentiment models, named entity extractors, and multilingual language models.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Transformers",
      "spaCy",
      "BERT",
      "Tokenization",
      "HuggingFace",
      "PyTorch"
    ],
    "stages": [
      {
        "title": "Phase 1: Natural Core Fundamentals & Tooling",
        "skills": [
          "Transformers",
          "spaCy",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "spaCy",
          "BERT",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "BERT",
          "Tokenization",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Transformers",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_34_mlops-platform-engineer",
    "slug": "mlops-platform-engineer",
    "title": "MLOps Platform Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Automate model deployment, continuous evaluation, drift detection, and GPU cluster scheduling.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Kubeflow",
      "Triton Inference Server",
      "MLflow",
      "Kubernetes",
      "BentoML",
      "Prometheus"
    ],
    "stages": [
      {
        "title": "Phase 1: MLOps Core Fundamentals & Tooling",
        "skills": [
          "Kubeflow",
          "Triton Inference Server",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Triton Inference Server",
          "MLflow",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "MLflow",
          "Kubernetes",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Kubeflow",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_35_analytics-engineer",
    "slug": "analytics-engineer",
    "title": "Analytics Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Transform raw database tables into clean, tested data marts using dbt and modern warehouses.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "dbt",
      "SQL",
      "BigQuery / Snowflake",
      "Data Modeling (Kimball)",
      "Data Quality Testing"
    ],
    "stages": [
      {
        "title": "Phase 1: Analytics Core Fundamentals & Tooling",
        "skills": [
          "dbt",
          "SQL",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "SQL",
          "BigQuery / Snowflake",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "BigQuery / Snowflake",
          "Data Modeling (Kimball)",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "dbt",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_36_business-intelligence-developer",
    "slug": "business-intelligence-developer",
    "title": "Business Intelligence Developer",
    "category": "AI & Data Science",
    "shortDesc": "Build interactive executive KPI dashboards, data semantic models, and reporting pipelines.",
    "effortHours": 100,
    "popular": false,
    "skills": [
      "Power BI / Tableau",
      "DAX / SQL",
      "Data Warehousing",
      "Data Modeling",
      "KPI Metrics"
    ],
    "stages": [
      {
        "title": "Phase 1: Business Core Fundamentals & Tooling",
        "skills": [
          "Power BI / Tableau",
          "DAX / SQL",
          "Environment Setup"
        ],
        "effortHours": 22
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "DAX / SQL",
          "Data Warehousing",
          "Best Practices"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Data Warehousing",
          "Data Modeling",
          "Performance Tuning"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Power BI / Tableau",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 22
      }
    ]
  },
  {
    "id": "c_37_deep-learning-research-engineer",
    "slug": "deep-learning-research-engineer",
    "title": "Deep Learning Research Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Implement cutting-edge research papers in neural network architectures, attention, and diffusion.",
    "effortHours": 160,
    "popular": false,
    "skills": [
      "PyTorch Internals",
      "CUDA Programming",
      "Transformer Math",
      "Diffusion Models",
      "JAX"
    ],
    "stages": [
      {
        "title": "Phase 1: Deep Core Fundamentals & Tooling",
        "skills": [
          "PyTorch Internals",
          "CUDA Programming",
          "Environment Setup"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "CUDA Programming",
          "Transformer Math",
          "Best Practices"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Transformer Math",
          "Diffusion Models",
          "Performance Tuning"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PyTorch Internals",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_38_speech-audio-ai-specialist",
    "slug": "speech-audio-ai-specialist",
    "title": "Speech & Audio AI Specialist",
    "category": "AI & Data Science",
    "shortDesc": "Build automatic speech recognition (Whisper), text-to-speech, and audio generative models.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Whisper",
      "Audio Spectrograms",
      "TTS Models",
      "Librosa",
      "PyTorch",
      "WebRTC Audio"
    ],
    "stages": [
      {
        "title": "Phase 1: Speech Core Fundamentals & Tooling",
        "skills": [
          "Whisper",
          "Audio Spectrograms",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Audio Spectrograms",
          "TTS Models",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "TTS Models",
          "Librosa",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Whisper",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_39_autonomous-systems-slam-engineer",
    "slug": "autonomous-systems-slam-engineer",
    "title": "Autonomous Systems & SLAM Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Develop simultaneous localization and mapping (SLAM), path planning, and sensor fusion models.",
    "effortHours": 155,
    "popular": false,
    "skills": [
      "SLAM Algorithms",
      "Kalman Filters",
      "Point Cloud Library",
      "ROS 2",
      "C++",
      "Python"
    ],
    "stages": [
      {
        "title": "Phase 1: Autonomous Core Fundamentals & Tooling",
        "skills": [
          "SLAM Algorithms",
          "Kalman Filters",
          "Environment Setup"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Kalman Filters",
          "Point Cloud Library",
          "Best Practices"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Point Cloud Library",
          "ROS 2",
          "Performance Tuning"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "SLAM Algorithms",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_40_graph-data-knowledge-graph-engineer",
    "slug": "graph-data-knowledge-graph-engineer",
    "title": "Graph Data & Knowledge Graph Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Model complex networked relationships, semantic ontologies, and Graph Neural Networks (GNNs).",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Neo4j",
      "Cypher Query Language",
      "RDF / OWL",
      "Graph Neural Networks",
      "PyTorch Geometric"
    ],
    "stages": [
      {
        "title": "Phase 1: Graph Core Fundamentals & Tooling",
        "skills": [
          "Neo4j",
          "Cypher Query Language",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Cypher Query Language",
          "RDF / OWL",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "RDF / OWL",
          "Graph Neural Networks",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Neo4j",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_41_big-data-infrastructure-architect",
    "slug": "big-data-infrastructure-architect",
    "title": "Big Data Infrastructure Architect",
    "category": "AI & Data Science",
    "shortDesc": "Scale petabyte-scale streaming systems, Apache Flink clusters, and Delta/Iceberg tables.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "Apache Flink",
      "Apache Iceberg",
      "Hadoop / Spark",
      "Trino / Presto",
      "Kafka Streaming"
    ],
    "stages": [
      {
        "title": "Phase 1: Big Core Fundamentals & Tooling",
        "skills": [
          "Apache Flink",
          "Apache Iceberg",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Apache Iceberg",
          "Hadoop / Spark",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Hadoop / Spark",
          "Trino / Presto",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Apache Flink",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_42_ai-safety-red-teaming-specialist",
    "slug": "ai-safety-red-teaming-specialist",
    "title": "AI Safety & Red Teaming Specialist",
    "category": "AI & Data Science",
    "shortDesc": "Probe LLMs for hallucinations, prompt injections, safety jailbreaks, and compliance guardrails.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "Adversarial Prompting",
      "Guardrails AI",
      "NeMo Guardrails",
      "Toxicity Classifiers",
      "Model Governance"
    ],
    "stages": [
      {
        "title": "Phase 1: AI Core Fundamentals & Tooling",
        "skills": [
          "Adversarial Prompting",
          "Guardrails AI",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Guardrails AI",
          "NeMo Guardrails",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "NeMo Guardrails",
          "Toxicity Classifiers",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Adversarial Prompting",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_43_generative-3d-nerf-engineer",
    "slug": "generative-3d-nerf-engineer",
    "title": "Generative 3D & NeRF Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Synthesize 3D scenes from 2D images using Gaussian Splatting and Neural Radiance Fields.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "3D Gaussian Splatting",
      "NeRFs",
      "PyTorch3D",
      "CUDA",
      "Point Clouds",
      "Blender"
    ],
    "stages": [
      {
        "title": "Phase 1: Generative Core Fundamentals & Tooling",
        "skills": [
          "3D Gaussian Splatting",
          "NeRFs",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "NeRFs",
          "PyTorch3D",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "PyTorch3D",
          "CUDA",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "3D Gaussian Splatting",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_44_quantitative-ai-modeling-specialist",
    "slug": "quantitative-ai-modeling-specialist",
    "title": "Quantitative AI Modeling Specialist",
    "category": "AI & Data Science",
    "shortDesc": "Deploy deep recurrent and attention models for time-series forecasting and algorithmic signal generation.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "Time Series Forecasting",
      "Temporal Fusion Transformers",
      "Backtesting",
      "NumPy",
      "Financial Metrics"
    ],
    "stages": [
      {
        "title": "Phase 1: Quantitative Core Fundamentals & Tooling",
        "skills": [
          "Time Series Forecasting",
          "Temporal Fusion Transformers",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Temporal Fusion Transformers",
          "Backtesting",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Backtesting",
          "NumPy",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Time Series Forecasting",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_45_recommendation-systems-engineer",
    "slug": "recommendation-systems-engineer",
    "title": "Recommendation Systems Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Design high-speed candidate generation and ranking models for e-commerce and media feeds.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Two-Tower Models",
      "Matrix Factorization",
      "Approximate Nearest Neighbor (ANN)",
      "Redis",
      "Python"
    ],
    "stages": [
      {
        "title": "Phase 1: Recommendation Core Fundamentals & Tooling",
        "skills": [
          "Two-Tower Models",
          "Matrix Factorization",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Matrix Factorization",
          "Approximate Nearest Neighbor (ANN)",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Approximate Nearest Neighbor (ANN)",
          "Redis",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Two-Tower Models",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_46_edge-ai-embedded-ml-engineer",
    "slug": "edge-ai-embedded-ml-engineer",
    "title": "Edge AI & Embedded ML Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Quantize and compile neural networks to run on microcontrollers, phones, and edge accelerators.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "TensorFlow Lite Micro",
      "ONNX Runtime",
      "Model Quantization (INT8)",
      "CoreML",
      "C++"
    ],
    "stages": [
      {
        "title": "Phase 1: Edge Core Fundamentals & Tooling",
        "skills": [
          "TensorFlow Lite Micro",
          "ONNX Runtime",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "ONNX Runtime",
          "Model Quantization (INT8)",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Model Quantization (INT8)",
          "CoreML",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "TensorFlow Lite Micro",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_47_data-quality-governance-engineer",
    "slug": "data-quality-governance-engineer",
    "title": "Data Quality & Governance Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Implement data lineage, automated anomaly alerts, and enterprise catalog governance.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Great Expectations",
      "Monte Carlo",
      "OpenMetadata",
      "Data Lineage",
      "SQL Auditing"
    ],
    "stages": [
      {
        "title": "Phase 1: Data Core Fundamentals & Tooling",
        "skills": [
          "Great Expectations",
          "Monte Carlo",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Monte Carlo",
          "OpenMetadata",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "OpenMetadata",
          "Data Lineage",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Great Expectations",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_48_synthetic-data-simulation-engineer",
    "slug": "synthetic-data-simulation-engineer",
    "title": "Synthetic Data & Simulation Engineer",
    "category": "AI & Data Science",
    "shortDesc": "Generate privacy-preserving artificial datasets and simulations to train robust AI models.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Differential Privacy",
      "GANs / Diffusion",
      "Unreal Engine Sim",
      "SDV (Synthetic Data Vault)"
    ],
    "stages": [
      {
        "title": "Phase 1: Synthetic Core Fundamentals & Tooling",
        "skills": [
          "Differential Privacy",
          "GANs / Diffusion",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "GANs / Diffusion",
          "Unreal Engine Sim",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Unreal Engine Sim",
          "SDV (Synthetic Data Vault)",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Differential Privacy",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_49_devops-engineer",
    "slug": "devops-engineer",
    "title": "DevOps Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Automate build pipelines, infrastructure provisioning, and cloud delivery systems.",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "Docker",
      "Kubernetes",
      "GitHub Actions",
      "Terraform",
      "Linux",
      "AWS"
    ],
    "stages": [
      {
        "title": "Phase 1: DevOps Core Fundamentals & Tooling",
        "skills": [
          "Docker",
          "Kubernetes",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Kubernetes",
          "GitHub Actions",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "GitHub Actions",
          "Terraform",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Docker",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_50_site-reliability-engineer-sre",
    "slug": "site-reliability-engineer-sre",
    "title": "Site Reliability Engineer (SRE)",
    "category": "Cloud & DevOps",
    "shortDesc": "Engineer 99.99% system availability, automated incident recovery, and SLO error budgets.",
    "effortHours": 140,
    "popular": true,
    "skills": [
      "Prometheus",
      "Grafana",
      "SLO / SLI Design",
      "Incident Postmortems",
      "Go / Python",
      "Linux"
    ],
    "stages": [
      {
        "title": "Phase 1: Site Core Fundamentals & Tooling",
        "skills": [
          "Prometheus",
          "Grafana",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Grafana",
          "SLO / SLI Design",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "SLO / SLI Design",
          "Incident Postmortems",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Prometheus",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_51_cloud-solutions-architect-aws",
    "slug": "cloud-solutions-architect-aws",
    "title": "Cloud Solutions Architect (AWS)",
    "category": "Cloud & DevOps",
    "shortDesc": "Architect secure, cost-effective, and fault-tolerant enterprise architectures on Amazon Web Services.",
    "effortHours": 145,
    "popular": true,
    "skills": [
      "AWS Solutions Architecture",
      "VPC Networking",
      "IAM Security",
      "ECS / EKS",
      "RDS / DynamoDB"
    ],
    "stages": [
      {
        "title": "Phase 1: Cloud Core Fundamentals & Tooling",
        "skills": [
          "AWS Solutions Architecture",
          "VPC Networking",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "VPC Networking",
          "IAM Security",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "IAM Security",
          "ECS / EKS",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "AWS Solutions Architecture",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_52_cloud-solutions-architect-azure",
    "slug": "cloud-solutions-architect-azure",
    "title": "Cloud Solutions Architect (Azure)",
    "category": "Cloud & DevOps",
    "shortDesc": "Design enterprise cloud migrations, hybrid Active Directory, and Azure Kubernetes solutions.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Azure Resource Manager",
      "Entra ID (Azure AD)",
      "Azure Kubernetes (AKS)",
      "Bicep / Terraform"
    ],
    "stages": [
      {
        "title": "Phase 1: Cloud Core Fundamentals & Tooling",
        "skills": [
          "Azure Resource Manager",
          "Entra ID (Azure AD)",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Entra ID (Azure AD)",
          "Azure Kubernetes (AKS)",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Azure Kubernetes (AKS)",
          "Bicep / Terraform",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Azure Resource Manager",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_53_cloud-solutions-architect-gcp",
    "slug": "cloud-solutions-architect-gcp",
    "title": "Cloud Solutions Architect (GCP)",
    "category": "Cloud & DevOps",
    "shortDesc": "Leverage Google Cloud for massive data analytics, GKE clusters, and global networking.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Google Kubernetes Engine (GKE)",
      "BigQuery",
      "Cloud Run",
      "VPC Service Controls",
      "Terraform"
    ],
    "stages": [
      {
        "title": "Phase 1: Cloud Core Fundamentals & Tooling",
        "skills": [
          "Google Kubernetes Engine (GKE)",
          "BigQuery",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "BigQuery",
          "Cloud Run",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Cloud Run",
          "VPC Service Controls",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Google Kubernetes Engine (GKE)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_54_kubernetes-container-administrator",
    "slug": "kubernetes-container-administrator",
    "title": "Kubernetes & Container Administrator",
    "category": "Cloud & DevOps",
    "shortDesc": "Master multi-cluster orchestrations, Helm deployments, service meshes, and CNI networking.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Kubernetes (CKA)",
      "Helm Charts",
      "Cilium CNI",
      "Ingress NGINX",
      "StatefulSets",
      "Security Policies"
    ],
    "stages": [
      {
        "title": "Phase 1: Kubernetes Core Fundamentals & Tooling",
        "skills": [
          "Kubernetes (CKA)",
          "Helm Charts",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Helm Charts",
          "Cilium CNI",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Cilium CNI",
          "Ingress NGINX",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Kubernetes (CKA)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_55_platform-engineer",
    "slug": "platform-engineer",
    "title": "Platform Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Build Internal Developer Platforms (IDP) with self-service developer portals and automated golden paths.",
    "effortHours": 140,
    "popular": true,
    "skills": [
      "Internal Developer Platforms",
      "Backstage.io",
      "Crossplane",
      "ArgoCD",
      "Terraform",
      "Go"
    ],
    "stages": [
      {
        "title": "Phase 1: Platform Core Fundamentals & Tooling",
        "skills": [
          "Internal Developer Platforms",
          "Backstage.io",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Backstage.io",
          "Crossplane",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Crossplane",
          "ArgoCD",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Internal Developer Platforms",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_56_infrastructure-as-code-specialist",
    "slug": "infrastructure-as-code-specialist",
    "title": "Infrastructure as Code Specialist",
    "category": "Cloud & DevOps",
    "shortDesc": "Manage planetary-scale declarative infrastructure using modular Terraform, OpenTofu, and Pulumi.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "Terraform",
      "OpenTofu",
      "Pulumi (TypeScript)",
      "Terragrunt",
      "State Management",
      "Policy as Code"
    ],
    "stages": [
      {
        "title": "Phase 1: Infrastructure Core Fundamentals & Tooling",
        "skills": [
          "Terraform",
          "OpenTofu",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "OpenTofu",
          "Pulumi (TypeScript)",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Pulumi (TypeScript)",
          "Terragrunt",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Terraform",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_57_finops-cloud-cost-optimization-engineer",
    "slug": "finops-cloud-cost-optimization-engineer",
    "title": "FinOps & Cloud Cost Optimization Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Analyze cloud spend telemetry, optimize reservation commitments, and reduce cloud bills by 40%.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "FinOps Framework",
      "AWS Cost Explorer",
      "Kubecost",
      "Infracost",
      "Rightsizing",
      "Spot Instances"
    ],
    "stages": [
      {
        "title": "Phase 1: FinOps Core Fundamentals & Tooling",
        "skills": [
          "FinOps Framework",
          "AWS Cost Explorer",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "AWS Cost Explorer",
          "Kubecost",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Kubecost",
          "Infracost",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "FinOps Framework",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_58_ci-cd-release-automation-engineer",
    "slug": "ci-cd-release-automation-engineer",
    "title": "CI/CD & Release Automation Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Architect zero-touch deployment pipelines, canary releases, and automated compliance gates.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "GitHub Actions",
      "GitLab CI",
      "Argo Rollouts",
      "Semantic Versioning",
      "Artifact Registries"
    ],
    "stages": [
      {
        "title": "Phase 1: CI/CD Core Fundamentals & Tooling",
        "skills": [
          "GitHub Actions",
          "GitLab CI",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "GitLab CI",
          "Argo Rollouts",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Argo Rollouts",
          "Semantic Versioning",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "GitHub Actions",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_59_observability-monitoring-engineer",
    "slug": "observability-monitoring-engineer",
    "title": "Observability & Monitoring Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Unify metrics, logs, and distributed traces into a single pane of glass for real-time telemetry.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "OpenTelemetry (OTel)",
      "Datadog / Dynatrace",
      "Prometheus & Grafana",
      "Jaeger Tracing",
      "Loki"
    ],
    "stages": [
      {
        "title": "Phase 1: Observability Core Fundamentals & Tooling",
        "skills": [
          "OpenTelemetry (OTel)",
          "Datadog / Dynatrace",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Datadog / Dynatrace",
          "Prometheus & Grafana",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Prometheus & Grafana",
          "Jaeger Tracing",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "OpenTelemetry (OTel)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_60_linux-systems-kernel-administrator",
    "slug": "linux-systems-kernel-administrator",
    "title": "Linux Systems & Kernel Administrator",
    "category": "Cloud & DevOps",
    "shortDesc": "Master Linux kernel tuning, eBPF telemetry, memory management, and systemd automation.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Linux Kernel Internals",
      "eBPF / BCC",
      "Systemd Services",
      "Bash / Python",
      "TCP/IP Tuning"
    ],
    "stages": [
      {
        "title": "Phase 1: Linux Core Fundamentals & Tooling",
        "skills": [
          "Linux Kernel Internals",
          "eBPF / BCC",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "eBPF / BCC",
          "Systemd Services",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Systemd Services",
          "Bash / Python",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Linux Kernel Internals",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_61_chaos-engineer",
    "slug": "chaos-engineer",
    "title": "Chaos Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Proactively inject network latency, server terminations, and disk failures to harden resilient systems.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Chaos Mesh",
      "Gremlin",
      "LitmusChaos",
      "Resilience Testing",
      "Blast Radius Mitigation"
    ],
    "stages": [
      {
        "title": "Phase 1: Chaos Core Fundamentals & Tooling",
        "skills": [
          "Chaos Mesh",
          "Gremlin",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Gremlin",
          "LitmusChaos",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "LitmusChaos",
          "Resilience Testing",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Chaos Mesh",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_62_serverless-edge-cloud-architect",
    "slug": "serverless-edge-cloud-architect",
    "title": "Serverless & Edge Cloud Architect",
    "category": "Cloud & DevOps",
    "shortDesc": "Run code at hundreds of points of presence worldwide with near-zero cold starts.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Cloudflare Workers",
      "AWS Lambda@Edge",
      "Fastly Compute",
      "Edge KV Stores",
      "Wasm at Edge"
    ],
    "stages": [
      {
        "title": "Phase 1: Serverless Core Fundamentals & Tooling",
        "skills": [
          "Cloudflare Workers",
          "AWS Lambda@Edge",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "AWS Lambda@Edge",
          "Fastly Compute",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Fastly Compute",
          "Edge KV Stores",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Cloudflare Workers",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_63_multi-cloud-infrastructure-engineer",
    "slug": "multi-cloud-infrastructure-engineer",
    "title": "Multi-Cloud Infrastructure Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Unify workloads across AWS, GCP, and Azure with cross-cloud VPNs and global load balancing.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Multi-Cloud Networking",
      "Cloudflare Magic WAN",
      "Crossplane",
      "Unified IAM",
      "Terraform"
    ],
    "stages": [
      {
        "title": "Phase 1: Multi-Cloud Core Fundamentals & Tooling",
        "skills": [
          "Multi-Cloud Networking",
          "Cloudflare Magic WAN",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Cloudflare Magic WAN",
          "Crossplane",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Crossplane",
          "Unified IAM",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Multi-Cloud Networking",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_64_service-mesh-specialist",
    "slug": "service-mesh-specialist",
    "title": "Service Mesh Specialist",
    "category": "Cloud & DevOps",
    "shortDesc": "Enforce mutual TLS (mTLS), traffic shaping, and dynamic routing across distributed microservices.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Istio",
      "Linkerd",
      "Envoy Proxy",
      "mTLS Cryptography",
      "Traffic Canary Routing"
    ],
    "stages": [
      {
        "title": "Phase 1: Service Core Fundamentals & Tooling",
        "skills": [
          "Istio",
          "Linkerd",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Linkerd",
          "Envoy Proxy",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Envoy Proxy",
          "mTLS Cryptography",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Istio",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_65_storage-backup-reliability-engineer",
    "slug": "storage-backup-reliability-engineer",
    "title": "Storage & Backup Reliability Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Ensure petabyte disaster recovery, object storage redundancy, and zero data loss SLAs.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "Ceph Storage",
      "MinIO",
      "AWS S3 Glacier",
      "Velero K8s Backup",
      "Disaster Recovery Drills"
    ],
    "stages": [
      {
        "title": "Phase 1: Storage Core Fundamentals & Tooling",
        "skills": [
          "Ceph Storage",
          "MinIO",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "MinIO",
          "AWS S3 Glacier",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "AWS S3 Glacier",
          "Velero K8s Backup",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Ceph Storage",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_66_data-center-hybrid-cloud-engineer",
    "slug": "data-center-hybrid-cloud-engineer",
    "title": "Data Center & Hybrid Cloud Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Bridge on-premise hardware racks with public cloud clusters using OpenStack and AWS Outposts.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "VMware vSphere",
      "OpenStack",
      "BGP Routing",
      "IPMI / Hardware Telemetry",
      "AWS DirectConnect"
    ],
    "stages": [
      {
        "title": "Phase 1: Data Core Fundamentals & Tooling",
        "skills": [
          "VMware vSphere",
          "OpenStack",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "OpenStack",
          "BGP Routing",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "BGP Routing",
          "IPMI / Hardware Telemetry",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "VMware vSphere",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_67_network-virtualization-engineer",
    "slug": "network-virtualization-engineer",
    "title": "Network Virtualization Engineer",
    "category": "Cloud & DevOps",
    "shortDesc": "Design software-defined networks (SDN), WireGuard overlay meshes, and low-latency transit gateways.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Software Defined Networking (SDN)",
      "WireGuard",
      "Cilium eBPF",
      "AWS Transit Gateway",
      "BGP"
    ],
    "stages": [
      {
        "title": "Phase 1: Network Core Fundamentals & Tooling",
        "skills": [
          "Software Defined Networking (SDN)",
          "WireGuard",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "WireGuard",
          "Cilium eBPF",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Cilium eBPF",
          "AWS Transit Gateway",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Software Defined Networking (SDN)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_68_green-cloud-sustainability-architect",
    "slug": "green-cloud-sustainability-architect",
    "title": "Green Cloud & Sustainability Architect",
    "category": "Cloud & DevOps",
    "shortDesc": "Schedule compute workloads to renewable energy time-windows and minimize server carbon footprints.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "Carbon-Aware Computing",
      "Kepler (K8s Energy Metrics)",
      "Resource Rightsizing",
      "Green Metrics"
    ],
    "stages": [
      {
        "title": "Phase 1: Green Core Fundamentals & Tooling",
        "skills": [
          "Carbon-Aware Computing",
          "Kepler (K8s Energy Metrics)",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Kepler (K8s Energy Metrics)",
          "Resource Rightsizing",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Resource Rightsizing",
          "Green Metrics",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Carbon-Aware Computing",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_69_soc-security-analyst",
    "slug": "soc-security-analyst",
    "title": "SOC Security Analyst",
    "category": "Cybersecurity",
    "shortDesc": "Monitor real-time threat telemetry, triage intrusion alerts, and neutralize security incidents.",
    "effortHours": 120,
    "popular": true,
    "skills": [
      "SIEM (Splunk / Elastic)",
      "Alert Triage",
      "Log Analysis",
      "Wireshark",
      "MITRE ATT&CK"
    ],
    "stages": [
      {
        "title": "Phase 1: SOC Core Fundamentals & Tooling",
        "skills": [
          "SIEM (Splunk / Elastic)",
          "Alert Triage",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Alert Triage",
          "Log Analysis",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Log Analysis",
          "Wireshark",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "SIEM (Splunk / Elastic)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_70_penetration-tester-ethical-hacker",
    "slug": "penetration-tester-ethical-hacker",
    "title": "Penetration Tester (Ethical Hacker)",
    "category": "Cybersecurity",
    "shortDesc": "Simulate adversary attacks to identify and exploit vulnerabilities in web, network, and cloud targets.",
    "effortHours": 145,
    "popular": true,
    "skills": [
      "Kali Linux",
      "Burp Suite Pro",
      "Metasploit",
      "Nmap",
      "Web Exploitation",
      "Privilege Escalation"
    ],
    "stages": [
      {
        "title": "Phase 1: Penetration Core Fundamentals & Tooling",
        "skills": [
          "Kali Linux",
          "Burp Suite Pro",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Burp Suite Pro",
          "Metasploit",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Metasploit",
          "Nmap",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Kali Linux",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_71_application-security-appsec-engineer",
    "slug": "application-security-appsec-engineer",
    "title": "Application Security (AppSec) Engineer",
    "category": "Cybersecurity",
    "shortDesc": "Embed automated vulnerability scanning, threat modeling, and secure code audits into software dev.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "OWASP Top 10",
      "SAST / DAST",
      "Threat Modeling (STRIDE)",
      "Secure Code Review",
      "Snyk"
    ],
    "stages": [
      {
        "title": "Phase 1: Application Core Fundamentals & Tooling",
        "skills": [
          "OWASP Top 10",
          "SAST / DAST",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "SAST / DAST",
          "Threat Modeling (STRIDE)",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Threat Modeling (STRIDE)",
          "Secure Code Review",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "OWASP Top 10",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_72_cloud-security-architect",
    "slug": "cloud-security-architect",
    "title": "Cloud Security Architect",
    "category": "Cybersecurity",
    "shortDesc": "Harden cloud accounts against misconfigurations, privilege escalations, and lateral movement.",
    "effortHours": 140,
    "popular": true,
    "skills": [
      "Cloud Security Posture (CSPM)",
      "AWS GuardDuty",
      "IAM Least Privilege",
      "Wiz / Prisma Cloud"
    ],
    "stages": [
      {
        "title": "Phase 1: Cloud Core Fundamentals & Tooling",
        "skills": [
          "Cloud Security Posture (CSPM)",
          "AWS GuardDuty",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "AWS GuardDuty",
          "IAM Least Privilege",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "IAM Least Privilege",
          "Wiz / Prisma Cloud",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Cloud Security Posture (CSPM)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_73_incident-response-forensics-specialist",
    "slug": "incident-response-forensics-specialist",
    "title": "Incident Response & Forensics Specialist",
    "category": "Cybersecurity",
    "shortDesc": "Conduct deep forensic investigations into ransomware breaches, live memory dumps, and disk images.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Digital Forensics",
      "Memory Analysis (Volatility)",
      "Autopsy / FTK",
      "Timeline Reconstruction"
    ],
    "stages": [
      {
        "title": "Phase 1: Incident Core Fundamentals & Tooling",
        "skills": [
          "Digital Forensics",
          "Memory Analysis (Volatility)",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Memory Analysis (Volatility)",
          "Autopsy / FTK",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Autopsy / FTK",
          "Timeline Reconstruction",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Digital Forensics",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_74_devsecops-engineer",
    "slug": "devsecops-engineer",
    "title": "DevSecOps Engineer",
    "category": "Cybersecurity",
    "shortDesc": "Integrate security scanners, container image signing, and secret scanning directly into CI/CD.",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "Trivy Container Scanner",
      "Cosign Image Signing",
      "GitGuardian Secret Scans",
      "Policy as Code (OPA)"
    ],
    "stages": [
      {
        "title": "Phase 1: DevSecOps Core Fundamentals & Tooling",
        "skills": [
          "Trivy Container Scanner",
          "Cosign Image Signing",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Cosign Image Signing",
          "GitGuardian Secret Scans",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "GitGuardian Secret Scans",
          "Policy as Code (OPA)",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Trivy Container Scanner",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_75_malware-analyst-reverse-engineer",
    "slug": "malware-analyst-reverse-engineer",
    "title": "Malware Analyst & Reverse Engineer",
    "category": "Cybersecurity",
    "shortDesc": "Dissect malicious binaries, analyze command & control protocols, and reverse engineer obfuscated code.",
    "effortHours": 155,
    "popular": false,
    "skills": [
      "Ghidra / IDA Pro",
      "x86/x64 Assembly",
      "Dynamic Sandboxing",
      "PE File Headers",
      "YARA Rules"
    ],
    "stages": [
      {
        "title": "Phase 1: Malware Core Fundamentals & Tooling",
        "skills": [
          "Ghidra / IDA Pro",
          "x86/x64 Assembly",
          "Environment Setup"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "x86/x64 Assembly",
          "Dynamic Sandboxing",
          "Best Practices"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Dynamic Sandboxing",
          "PE File Headers",
          "Performance Tuning"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Ghidra / IDA Pro",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_76_identity-access-management-iam-specialist",
    "slug": "identity-access-management-iam-specialist",
    "title": "Identity & Access Management (IAM) Specialist",
    "category": "Cybersecurity",
    "shortDesc": "Architect single sign-on (SSO), OAuth2 / OIDC authentication flows, and privileged access security.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Okta / Keycloak",
      "OAuth2 & OIDC",
      "SAML 2.0",
      "Passkeys / FIDO2",
      "Zero Trust IAM"
    ],
    "stages": [
      {
        "title": "Phase 1: Identity Core Fundamentals & Tooling",
        "skills": [
          "Okta / Keycloak",
          "OAuth2 & OIDC",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "OAuth2 & OIDC",
          "SAML 2.0",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "SAML 2.0",
          "Passkeys / FIDO2",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Okta / Keycloak",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_77_threat-intelligence-analyst",
    "slug": "threat-intelligence-analyst",
    "title": "Threat Intelligence Analyst",
    "category": "Cybersecurity",
    "shortDesc": "Track advanced persistent threat (APT) actors, correlate threat feeds, and publish threat briefings.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Threat Feeds (STIX/TAXII)",
      "MISP Platform",
      "OSINT Investigation",
      "Adversary Profiling"
    ],
    "stages": [
      {
        "title": "Phase 1: Threat Core Fundamentals & Tooling",
        "skills": [
          "Threat Feeds (STIX/TAXII)",
          "MISP Platform",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "MISP Platform",
          "OSINT Investigation",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "OSINT Investigation",
          "Adversary Profiling",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Threat Feeds (STIX/TAXII)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_78_network-security-firewall-engineer",
    "slug": "network-security-firewall-engineer",
    "title": "Network Security & Firewall Engineer",
    "category": "Cybersecurity",
    "shortDesc": "Deploy next-gen firewalls, intrusion prevention systems, and encrypted VPN tunnels.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Palo Alto / Fortinet",
      "Suricata / Snort IPS",
      "IPsec & SSL VPNs",
      "Network Microsegmentation"
    ],
    "stages": [
      {
        "title": "Phase 1: Network Core Fundamentals & Tooling",
        "skills": [
          "Palo Alto / Fortinet",
          "Suricata / Snort IPS",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Suricata / Snort IPS",
          "IPsec & SSL VPNs",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "IPsec & SSL VPNs",
          "Network Microsegmentation",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Palo Alto / Fortinet",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_79_cryptography-pki-engineer",
    "slug": "cryptography-pki-engineer",
    "title": "Cryptography & PKI Engineer",
    "category": "Cybersecurity",
    "shortDesc": "Implement end-to-end encryption, digital certificate lifecycles, and post-quantum cryptographic algorithms.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "Public Key Infrastructure (PKI)",
      "TLS Protocols",
      "Elliptic Curve Cryptography",
      "Hardware Security Modules (HSM)"
    ],
    "stages": [
      {
        "title": "Phase 1: Cryptography Core Fundamentals & Tooling",
        "skills": [
          "Public Key Infrastructure (PKI)",
          "TLS Protocols",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "TLS Protocols",
          "Elliptic Curve Cryptography",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Elliptic Curve Cryptography",
          "Hardware Security Modules (HSM)",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Public Key Infrastructure (PKI)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_80_governance-risk-compliance-grc-specialist",
    "slug": "governance-risk-compliance-grc-specialist",
    "title": "Governance, Risk & Compliance (GRC) Specialist",
    "category": "Cybersecurity",
    "shortDesc": "Guide enterprise certifications for SOC 2 Type II, ISO 27001, HIPAA, and GDPR audits.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "SOC 2 Compliance",
      "ISO/IEC 27001",
      "HIPAA / GDPR",
      "Risk Assessments",
      "Audit Evidence Collection"
    ],
    "stages": [
      {
        "title": "Phase 1: Governance, Core Fundamentals & Tooling",
        "skills": [
          "SOC 2 Compliance",
          "ISO/IEC 27001",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "ISO/IEC 27001",
          "HIPAA / GDPR",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "HIPAA / GDPR",
          "Risk Assessments",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "SOC 2 Compliance",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_81_bug-bounty-hunter-vulnerability-researcher",
    "slug": "bug-bounty-hunter-vulnerability-researcher",
    "title": "Bug Bounty Hunter & Vulnerability Researcher",
    "category": "Cybersecurity",
    "shortDesc": "Discover 0-day security flaws in major platforms and earn rewards via HackerOne and Bugcrowd.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Subdomain Reconnaissance",
      "Business Logic Flaws",
      "CSRF / SSRF Exploits",
      "Report Writing"
    ],
    "stages": [
      {
        "title": "Phase 1: Bug Core Fundamentals & Tooling",
        "skills": [
          "Subdomain Reconnaissance",
          "Business Logic Flaws",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Business Logic Flaws",
          "CSRF / SSRF Exploits",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "CSRF / SSRF Exploits",
          "Report Writing",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Subdomain Reconnaissance",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_82_zero-trust-security-architect",
    "slug": "zero-trust-security-architect",
    "title": "Zero Trust Security Architect",
    "category": "Cybersecurity",
    "shortDesc": "Implement BeyondCorp architectures where no user or device is trusted by default inside the perimeter.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Zero Trust Network Access (ZTNA)",
      "Device Posture Checks",
      "Microsegmentation",
      "Continuous Auth"
    ],
    "stages": [
      {
        "title": "Phase 1: Zero Core Fundamentals & Tooling",
        "skills": [
          "Zero Trust Network Access (ZTNA)",
          "Device Posture Checks",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Device Posture Checks",
          "Microsegmentation",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Microsegmentation",
          "Continuous Auth",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Zero Trust Network Access (ZTNA)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_83_red-team-operator",
    "slug": "red-team-operator",
    "title": "Red Team Operator",
    "category": "Cybersecurity",
    "shortDesc": "Execute multi-month covert campaigns simulating nation-state attackers to test corporate resilience.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "Cobalt Strike / Sliver",
      "Active Directory Exploitation",
      "Evasion Techniques",
      "Phishing Simulations"
    ],
    "stages": [
      {
        "title": "Phase 1: Red Core Fundamentals & Tooling",
        "skills": [
          "Cobalt Strike / Sliver",
          "Active Directory Exploitation",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Active Directory Exploitation",
          "Evasion Techniques",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Evasion Techniques",
          "Phishing Simulations",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Cobalt Strike / Sliver",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_84_blue-team-defensive-engineer",
    "slug": "blue-team-defensive-engineer",
    "title": "Blue Team Defensive Engineer",
    "category": "Cybersecurity",
    "shortDesc": "Craft high-fidelity detection rules, deploy endpoint detection (EDR), and harden core infrastructure.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "CrowdStrike / Defender EDR",
      "Sigma Rules",
      "Sysmon Telemetry",
      "Host Hardening (CIS Benchmarks)"
    ],
    "stages": [
      {
        "title": "Phase 1: Blue Core Fundamentals & Tooling",
        "skills": [
          "CrowdStrike / Defender EDR",
          "Sigma Rules",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Sigma Rules",
          "Sysmon Telemetry",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Sysmon Telemetry",
          "Host Hardening (CIS Benchmarks)",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "CrowdStrike / Defender EDR",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_85_security-operations-automation-soar-engineer",
    "slug": "security-operations-automation-soar-engineer",
    "title": "Security Operations Automation (SOAR) Engineer",
    "category": "Cybersecurity",
    "shortDesc": "Automate repetitive incident response workflows, playbook triggers, and IP blocking scripts.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "Cortex XSOAR",
      "Tines / Shuffle",
      "Python API Automation",
      "Threat Enrichment Scripts"
    ],
    "stages": [
      {
        "title": "Phase 1: Security Core Fundamentals & Tooling",
        "skills": [
          "Cortex XSOAR",
          "Tines / Shuffle",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Tines / Shuffle",
          "Python API Automation",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Python API Automation",
          "Threat Enrichment Scripts",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Cortex XSOAR",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_86_mobile-security-specialist",
    "slug": "mobile-security-specialist",
    "title": "Mobile Security Specialist",
    "category": "Cybersecurity",
    "shortDesc": "Audit iOS and Android apps for insecure storage, jailbreak detection bypasses, and API token leaks.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Frida Dynamic Instrumentation",
      "MobSF",
      "APK Decompilation (JADX)",
      "Keychain / Keystore Audits"
    ],
    "stages": [
      {
        "title": "Phase 1: Mobile Core Fundamentals & Tooling",
        "skills": [
          "Frida Dynamic Instrumentation",
          "MobSF",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "MobSF",
          "APK Decompilation (JADX)",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "APK Decompilation (JADX)",
          "Keychain / Keystore Audits",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Frida Dynamic Instrumentation",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_87_iot-firmware-security-researcher",
    "slug": "iot-firmware-security-researcher",
    "title": "IoT & Firmware Security Researcher",
    "category": "Cybersecurity",
    "shortDesc": "Extract firmware chips via UART/JTAG, unpack flash memory, and uncover hardware backdoors.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "Binwalk",
      "UART / JTAG Hardware Probing",
      "Firmware Emulation (QEMU)",
      "Hardware Glitching"
    ],
    "stages": [
      {
        "title": "Phase 1: IoT Core Fundamentals & Tooling",
        "skills": [
          "Binwalk",
          "UART / JTAG Hardware Probing",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "UART / JTAG Hardware Probing",
          "Firmware Emulation (QEMU)",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Firmware Emulation (QEMU)",
          "Hardware Glitching",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Binwalk",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_88_digital-forensics-incident-response-dfir-lead",
    "slug": "digital-forensics-incident-response-dfir-lead",
    "title": "Digital Forensics & Incident Response (DFIR) Lead",
    "category": "Cybersecurity",
    "shortDesc": "Lead crisis rooms during active enterprise ransomware events, ensuring legal preservation of evidence.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "Chain of Custody",
      "EnCase / FTK",
      "Ransomware Negotiation Protocol",
      "Executive Crisis Comm"
    ],
    "stages": [
      {
        "title": "Phase 1: Digital Core Fundamentals & Tooling",
        "skills": [
          "Chain of Custody",
          "EnCase / FTK",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "EnCase / FTK",
          "Ransomware Negotiation Protocol",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Ransomware Negotiation Protocol",
          "Executive Crisis Comm",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Chain of Custody",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_89_ios-developer-swift-swiftui",
    "slug": "ios-developer-swift-swiftui",
    "title": "iOS Developer (Swift & SwiftUI)",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Build fluid native iOS applications using modern Swift 6, SwiftUI, SwiftData, and Instruments.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "Swift 6",
      "SwiftUI",
      "Combine / Concurrency",
      "SwiftData",
      "Xcode Instruments",
      "App Store Deploy"
    ],
    "stages": [
      {
        "title": "Phase 1: iOS Core Fundamentals & Tooling",
        "skills": [
          "Swift 6",
          "SwiftUI",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "SwiftUI",
          "Combine / Concurrency",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Combine / Concurrency",
          "SwiftData",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Swift 6",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_90_android-developer-kotlin-jetpack",
    "slug": "android-developer-kotlin-jetpack",
    "title": "Android Developer (Kotlin & Jetpack)",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Create robust Android apps with modern Jetpack Compose, Kotlin Coroutines, and Clean Architecture.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "Kotlin",
      "Jetpack Compose",
      "Coroutines & Flow",
      "Room Database",
      "Hilt / Koin",
      "Material Design 3"
    ],
    "stages": [
      {
        "title": "Phase 1: Android Core Fundamentals & Tooling",
        "skills": [
          "Kotlin",
          "Jetpack Compose",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Jetpack Compose",
          "Coroutines & Flow",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Coroutines & Flow",
          "Room Database",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Kotlin",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_91_flutter-cross-platform-engineer",
    "slug": "flutter-cross-platform-engineer",
    "title": "Flutter Cross-Platform Engineer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Deliver stunning 60fps mobile, web, and desktop apps from a single Dart codebase.",
    "effortHours": 120,
    "popular": true,
    "skills": [
      "Flutter",
      "Dart",
      "Riverpod / Bloc",
      "CustomPainter",
      "Platform Channels",
      "Animations"
    ],
    "stages": [
      {
        "title": "Phase 1: Flutter Core Fundamentals & Tooling",
        "skills": [
          "Flutter",
          "Dart",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Dart",
          "Riverpod / Bloc",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Riverpod / Bloc",
          "CustomPainter",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Flutter",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_92_react-native-mobile-developer",
    "slug": "react-native-mobile-developer",
    "title": "React Native Mobile Developer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Leverage React ecosystem to build high-performance iOS and Android applications with Expo.",
    "effortHours": 115,
    "popular": true,
    "skills": [
      "React Native",
      "Expo",
      "TypeScript",
      "Reanimated 3",
      "Native Module Bridges",
      "Fastlane"
    ],
    "stages": [
      {
        "title": "Phase 1: React Core Fundamentals & Tooling",
        "skills": [
          "React Native",
          "Expo",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Expo",
          "TypeScript",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "TypeScript",
          "Reanimated 3",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "React Native",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_93_kotlin-multiplatform-kmp-architect",
    "slug": "kotlin-multiplatform-kmp-architect",
    "title": "Kotlin Multiplatform (KMP) Architect",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Share 80% of business logic across iOS and Android while retaining 100% native UI fidelity.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Kotlin Multiplatform (KMP)",
      "Compose Multiplatform",
      "Ktor Client",
      "SQLDelight",
      "Swift Interop"
    ],
    "stages": [
      {
        "title": "Phase 1: Kotlin Core Fundamentals & Tooling",
        "skills": [
          "Kotlin Multiplatform (KMP)",
          "Compose Multiplatform",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Compose Multiplatform",
          "Ktor Client",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Ktor Client",
          "SQLDelight",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Kotlin Multiplatform (KMP)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_94_mobile-devops-release-engineer",
    "slug": "mobile-devops-release-engineer",
    "title": "Mobile DevOps & Release Engineer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Automate build signing, beta distribution with TestFlight, and Google Play phased rollouts.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Fastlane",
      "Bitrise / GitHub Actions",
      "App Store Connect API",
      "Google Play Developer API",
      "CodePush"
    ],
    "stages": [
      {
        "title": "Phase 1: Mobile Core Fundamentals & Tooling",
        "skills": [
          "Fastlane",
          "Bitrise / GitHub Actions",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Bitrise / GitHub Actions",
          "App Store Connect API",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "App Store Connect API",
          "Google Play Developer API",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Fastlane",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_95_apple-vision-pro-visionos-developer",
    "slug": "apple-vision-pro-visionos-developer",
    "title": "Apple Vision Pro & visionOS Developer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Pioneer spatial computing apps with 3D floating windows, RealityKit volumes, and immersive spaces.",
    "effortHours": 140,
    "popular": true,
    "skills": [
      "visionOS",
      "SwiftUI Spatial",
      "RealityKit",
      "ARKit",
      "3D Hand Gestures",
      "Spatial Audio"
    ],
    "stages": [
      {
        "title": "Phase 1: Apple Core Fundamentals & Tooling",
        "skills": [
          "visionOS",
          "SwiftUI Spatial",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "SwiftUI Spatial",
          "RealityKit",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "RealityKit",
          "ARKit",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "visionOS",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_96_wearable-apps-developer",
    "slug": "wearable-apps-developer",
    "title": "Wearable Apps Developer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Design battery-efficient complications, workout tracking, and glanceable UI for Apple Watch and Wear OS.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "watchOS / WidgetKit",
      "Wear OS Compose",
      "HealthKit API",
      "Sensor Telemetry",
      "Low Power UI"
    ],
    "stages": [
      {
        "title": "Phase 1: Wearable Core Fundamentals & Tooling",
        "skills": [
          "watchOS / WidgetKit",
          "Wear OS Compose",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Wear OS Compose",
          "HealthKit API",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "HealthKit API",
          "Sensor Telemetry",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "watchOS / WidgetKit",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_97_mobile-security-hardening-engineer",
    "slug": "mobile-security-hardening-engineer",
    "title": "Mobile Security & Hardening Engineer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Protect apps against code tampering, API token sniffing, and jailbroken device environments.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "DexGuard / ProGuard",
      "Certificate Pinning",
      "Jailbreak & Root Detection",
      "Biometric Auth"
    ],
    "stages": [
      {
        "title": "Phase 1: Mobile Core Fundamentals & Tooling",
        "skills": [
          "DexGuard / ProGuard",
          "Certificate Pinning",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Certificate Pinning",
          "Jailbreak & Root Detection",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Jailbreak & Root Detection",
          "Biometric Auth",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "DexGuard / ProGuard",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_98_cross-platform-performance-engineer",
    "slug": "cross-platform-performance-engineer",
    "title": "Cross-Platform Performance Engineer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Eliminate UI thread stutter, reduce app launch times, and optimize memory allocations on mobile.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Systrace / Perfetto",
      "Xcode Instruments Allocations",
      "Jank Benchmarking",
      "Hermes Engine Tuning"
    ],
    "stages": [
      {
        "title": "Phase 1: Cross-Platform Core Fundamentals & Tooling",
        "skills": [
          "Systrace / Perfetto",
          "Xcode Instruments Allocations",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Xcode Instruments Allocations",
          "Jank Benchmarking",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Jank Benchmarking",
          "Hermes Engine Tuning",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Systrace / Perfetto",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_99_offline-first-mobile-architect",
    "slug": "offline-first-mobile-architect",
    "title": "Offline-First Mobile Architect",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Build resilient apps that work seamlessly without cell service and resolve complex sync conflicts.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "WatermelonDB",
      "PowerSync",
      "SQLite",
      "Conflict Resolution (CRDTs)",
      "Background Sync Tasks"
    ],
    "stages": [
      {
        "title": "Phase 1: Offline-First Core Fundamentals & Tooling",
        "skills": [
          "WatermelonDB",
          "PowerSync",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "PowerSync",
          "SQLite",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "SQLite",
          "Conflict Resolution (CRDTs)",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "WatermelonDB",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_100_mobile-game-developer-unity-mobile",
    "slug": "mobile-game-developer-unity-mobile",
    "title": "Mobile Game Developer (Unity Mobile)",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Create casual and mid-core mobile games with touch gestures, in-app purchases, and mobile ads.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Unity C#",
      "Touch Controls",
      "In-App Purchasing (IAP)",
      "AdMob Integration",
      "Mobile Shaders"
    ],
    "stages": [
      {
        "title": "Phase 1: Mobile Core Fundamentals & Tooling",
        "skills": [
          "Unity C#",
          "Touch Controls",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Touch Controls",
          "In-App Purchasing (IAP)",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "In-App Purchasing (IAP)",
          "AdMob Integration",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Unity C#",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_101_augmented-reality-ar-mobile-engineer",
    "slug": "augmented-reality-ar-mobile-engineer",
    "title": "Augmented Reality (AR) Mobile Engineer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Overlay interactive digital holograms onto physical spaces using ARKit and ARCore.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "ARKit",
      "ARCore",
      "Plane Detection",
      "LiDAR Depth Sensing",
      "SceneKit / RealityKit"
    ],
    "stages": [
      {
        "title": "Phase 1: Augmented Core Fundamentals & Tooling",
        "skills": [
          "ARKit",
          "ARCore",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "ARCore",
          "Plane Detection",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Plane Detection",
          "LiDAR Depth Sensing",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "ARKit",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_102_audio-streaming-mobile-engineer",
    "slug": "audio-streaming-mobile-engineer",
    "title": "Audio & Streaming Mobile Engineer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Build background audio players, low-latency live streaming, and voice chat applications.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "AVAudioEngine",
      "ExoPlayer / Media3",
      "WebRTC Mobile",
      "HLS Streaming",
      "Audio Buffers"
    ],
    "stages": [
      {
        "title": "Phase 1: Audio Core Fundamentals & Tooling",
        "skills": [
          "AVAudioEngine",
          "ExoPlayer / Media3",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "ExoPlayer / Media3",
          "WebRTC Mobile",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "WebRTC Mobile",
          "HLS Streaming",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "AVAudioEngine",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_103_embedded-android-aosp-engineer",
    "slug": "embedded-android-aosp-engineer",
    "title": "Embedded Android & AOSP Engineer",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Customize Android Open Source Project (AOSP) for automotive infotainment, kiosks, and custom hardware.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "AOSP Build System",
      "Hardware Abstraction Layer (HAL)",
      "Android NDK",
      "C++",
      "SELinux for Android"
    ],
    "stages": [
      {
        "title": "Phase 1: Embedded Core Fundamentals & Tooling",
        "skills": [
          "AOSP Build System",
          "Hardware Abstraction Layer (HAL)",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Hardware Abstraction Layer (HAL)",
          "Android NDK",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Android NDK",
          "C++",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "AOSP Build System",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_104_enterprise-mobile-device-mdm-specialist",
    "slug": "enterprise-mobile-device-mdm-specialist",
    "title": "Enterprise Mobile Device (MDM) Specialist",
    "category": "Mobile & Multiplatform",
    "shortDesc": "Deploy and secure fleets of corporate mobile devices using Microsoft Intune and Apple Business Manager.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "Microsoft Intune",
      "Apple Business Manager",
      "Knox Mobile Enrollment",
      "Zero-Touch Provisioning"
    ],
    "stages": [
      {
        "title": "Phase 1: Enterprise Core Fundamentals & Tooling",
        "skills": [
          "Microsoft Intune",
          "Apple Business Manager",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Apple Business Manager",
          "Knox Mobile Enrollment",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Knox Mobile Enrollment",
          "Zero-Touch Provisioning",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Microsoft Intune",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_105_unity-game-developer",
    "slug": "unity-game-developer",
    "title": "Unity Game Developer",
    "category": "Game Dev & 3D",
    "shortDesc": "Craft compelling 2D and 3D games using Unity, C#, DOTS, and universal render pipelines.",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "Unity Engine",
      "C#",
      "DOTS / ECS",
      "Cinemachine",
      "Physics Simulation",
      "URP / HDRP"
    ],
    "stages": [
      {
        "title": "Phase 1: Unity Core Fundamentals & Tooling",
        "skills": [
          "Unity Engine",
          "C#",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "C#",
          "DOTS / ECS",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "DOTS / ECS",
          "Cinemachine",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Unity Engine",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_106_unreal-engine-5-developer",
    "slug": "unreal-engine-5-developer",
    "title": "Unreal Engine 5 Developer",
    "category": "Game Dev & 3D",
    "shortDesc": "Harness photorealistic graphics, Lumen global illumination, Nanite meshes, and C++ in UE5.",
    "effortHours": 155,
    "popular": true,
    "skills": [
      "Unreal Engine 5",
      "C++",
      "Blueprints",
      "Lumen & Nanite",
      "Gameplay Framework",
      "Profiling"
    ],
    "stages": [
      {
        "title": "Phase 1: Unreal Core Fundamentals & Tooling",
        "skills": [
          "Unreal Engine 5",
          "C++",
          "Environment Setup"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "C++",
          "Blueprints",
          "Best Practices"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Blueprints",
          "Lumen & Nanite",
          "Performance Tuning"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Unreal Engine 5",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_107_gameplay-programmer",
    "slug": "gameplay-programmer",
    "title": "Gameplay Programmer",
    "category": "Game Dev & 3D",
    "shortDesc": "Implement character locomotion, combat mechanics, weapon systems, and responsive game feel.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "State Machines",
      "Animation Blending",
      "Player Controllers",
      "Combat Math",
      "Game Feel Tuning"
    ],
    "stages": [
      {
        "title": "Phase 1: Gameplay Core Fundamentals & Tooling",
        "skills": [
          "State Machines",
          "Animation Blending",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Animation Blending",
          "Player Controllers",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Player Controllers",
          "Combat Math",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "State Machines",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_108_3d-technical-artist",
    "slug": "3d-technical-artist",
    "title": "3D Technical Artist",
    "category": "Game Dev & 3D",
    "shortDesc": "Bridge 3D artistry and software engineering with custom Python pipeline tools, rigging, and shaders.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Blender / Maya",
      "Python Scripting",
      "Character Rigging",
      "Shader Creation",
      "Art Pipeline Tools"
    ],
    "stages": [
      {
        "title": "Phase 1: 3D Core Fundamentals & Tooling",
        "skills": [
          "Blender / Maya",
          "Python Scripting",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Python Scripting",
          "Character Rigging",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Character Rigging",
          "Shader Creation",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Blender / Maya",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_109_shader-graphics-programmer",
    "slug": "shader-graphics-programmer",
    "title": "Shader & Graphics Programmer",
    "category": "Game Dev & 3D",
    "shortDesc": "Write custom GPU shaders for water caustic reflections, volumetric clouds, and post-processing.",
    "effortHours": 150,
    "popular": true,
    "skills": [
      "HLSL / GLSL",
      "Compute Shaders",
      "Ray Tracing",
      "Physically Based Rendering (PBR)",
      "RenderDoc"
    ],
    "stages": [
      {
        "title": "Phase 1: Shader Core Fundamentals & Tooling",
        "skills": [
          "HLSL / GLSL",
          "Compute Shaders",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Compute Shaders",
          "Ray Tracing",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Ray Tracing",
          "Physically Based Rendering (PBR)",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "HLSL / GLSL",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_110_virtual-reality-vr-xr-developer",
    "slug": "virtual-reality-vr-xr-developer",
    "title": "Virtual Reality (VR) / XR Developer",
    "category": "Game Dev & 3D",
    "shortDesc": "Develop immersive VR experiences with spatial motion controllers and 6DOF head tracking.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "OpenXR",
      "Meta Quest SDK",
      "Spatial Tracking",
      "VR Ergonomics & Locomotion",
      "Unity / Unreal"
    ],
    "stages": [
      {
        "title": "Phase 1: Virtual Core Fundamentals & Tooling",
        "skills": [
          "OpenXR",
          "Meta Quest SDK",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Meta Quest SDK",
          "Spatial Tracking",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Spatial Tracking",
          "VR Ergonomics & Locomotion",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "OpenXR",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_111_multiplayer-network-programmer",
    "slug": "multiplayer-network-programmer",
    "title": "Multiplayer Network Programmer",
    "category": "Game Dev & 3D",
    "shortDesc": "Engineer client-side prediction, server reconciliation, and lag compensation for online games.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "Netcode for GameObjects",
      "Photon Fusion",
      "Client Prediction & Reconciliation",
      "UDP Sockets"
    ],
    "stages": [
      {
        "title": "Phase 1: Multiplayer Core Fundamentals & Tooling",
        "skills": [
          "Netcode for GameObjects",
          "Photon Fusion",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Photon Fusion",
          "Client Prediction & Reconciliation",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Client Prediction & Reconciliation",
          "UDP Sockets",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Netcode for GameObjects",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_112_webgl-three-js-3d-developer",
    "slug": "webgl-three-js-3d-developer",
    "title": "WebGL & Three.js 3D Developer",
    "category": "Game Dev & 3D",
    "shortDesc": "Build interactive 3D product configurators, digital galleries, and browser worlds with React Three Fiber.",
    "effortHours": 120,
    "popular": true,
    "skills": [
      "Three.js",
      "React Three Fiber (R3F)",
      "WebGPU",
      "GLTF / GLB Optimization",
      "Post-Processing"
    ],
    "stages": [
      {
        "title": "Phase 1: WebGL Core Fundamentals & Tooling",
        "skills": [
          "Three.js",
          "React Three Fiber (R3F)",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "React Three Fiber (R3F)",
          "WebGPU",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "WebGPU",
          "GLTF / GLB Optimization",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Three.js",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_113_godot-engine-indie-developer",
    "slug": "godot-engine-indie-developer",
    "title": "Godot Engine Indie Developer",
    "category": "Game Dev & 3D",
    "shortDesc": "Develop lightweight 2D and 3D indie titles with fast iteration using Godot 4 and GDScript.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Godot 4",
      "GDScript",
      "2D Tilemaps",
      "Node Hierarchy Architecture",
      "Indie Publishing"
    ],
    "stages": [
      {
        "title": "Phase 1: Godot Core Fundamentals & Tooling",
        "skills": [
          "Godot 4",
          "GDScript",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "GDScript",
          "2D Tilemaps",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "2D Tilemaps",
          "Node Hierarchy Architecture",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Godot 4",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_114_game-audio-engineer-sound-designer",
    "slug": "game-audio-engineer-sound-designer",
    "title": "Game Audio Engineer & Sound Designer",
    "category": "Game Dev & 3D",
    "shortDesc": "Implement interactive adaptive music triggers, 3D spatial attenuation, and dynamic sound effects.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "FMOD Studio",
      "Wwise",
      "Interactive Audio Systems",
      "Spatial Audio Reverb",
      "DAW Foley"
    ],
    "stages": [
      {
        "title": "Phase 1: Game Core Fundamentals & Tooling",
        "skills": [
          "FMOD Studio",
          "Wwise",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Wwise",
          "Interactive Audio Systems",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Interactive Audio Systems",
          "Spatial Audio Reverb",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "FMOD Studio",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_115_3d-environment-world-artist",
    "slug": "3d-environment-world-artist",
    "title": "3D Environment & World Artist",
    "category": "Game Dev & 3D",
    "shortDesc": "Sculpt realistic natural terrains, modular architecture, and set dressing for open-world games.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Blender / ZBrush",
      "Substance Painter",
      "Modular Asset Kits",
      "Lighting & Atmospheric Fog"
    ],
    "stages": [
      {
        "title": "Phase 1: 3D Core Fundamentals & Tooling",
        "skills": [
          "Blender / ZBrush",
          "Substance Painter",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Substance Painter",
          "Modular Asset Kits",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Modular Asset Kits",
          "Lighting & Atmospheric Fog",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Blender / ZBrush",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_116_game-ai-programmer",
    "slug": "game-ai-programmer",
    "title": "Game AI Programmer",
    "category": "Game Dev & 3D",
    "shortDesc": "Program enemy patrol behaviors, cover systems, and boss encounter patterns using behavior trees.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Behavior Trees",
      "NavMesh Pathfinding",
      "Utility AI Systems",
      "Perception Sensors",
      "GOAP"
    ],
    "stages": [
      {
        "title": "Phase 1: Game Core Fundamentals & Tooling",
        "skills": [
          "Behavior Trees",
          "NavMesh Pathfinding",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "NavMesh Pathfinding",
          "Utility AI Systems",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Utility AI Systems",
          "Perception Sensors",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Behavior Trees",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_117_game-physics-programmer",
    "slug": "game-physics-programmer",
    "title": "Game Physics Programmer",
    "category": "Game Dev & 3D",
    "shortDesc": "Craft custom vehicle physics, destruction simulation, and rigid-body ragdoll systems.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "Rigid Body Mechanics",
      "Collision Detection Algorithms",
      "Vehicle Wheel Physics",
      "Cloth Simulation"
    ],
    "stages": [
      {
        "title": "Phase 1: Game Core Fundamentals & Tooling",
        "skills": [
          "Rigid Body Mechanics",
          "Collision Detection Algorithms",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Collision Detection Algorithms",
          "Vehicle Wheel Physics",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Vehicle Wheel Physics",
          "Cloth Simulation",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Rigid Body Mechanics",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_118_mobile-game-performance-optimizer",
    "slug": "mobile-game-performance-optimizer",
    "title": "Mobile Game Performance Optimizer",
    "category": "Game Dev & 3D",
    "shortDesc": "Optimize mobile games to sustain 60fps on mid-tier phones with minimal thermal throttling.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Draw Call Batching",
      "Texture Compression (ASTC)",
      "LOD Systems",
      "Memory Garbage Collection"
    ],
    "stages": [
      {
        "title": "Phase 1: Mobile Core Fundamentals & Tooling",
        "skills": [
          "Draw Call Batching",
          "Texture Compression (ASTC)",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Texture Compression (ASTC)",
          "LOD Systems",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "LOD Systems",
          "Memory Garbage Collection",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Draw Call Batching",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_119_vfx-particle-artist",
    "slug": "vfx-particle-artist",
    "title": "VFX & Particle Artist",
    "category": "Game Dev & 3D",
    "shortDesc": "Create spell magic, explosions, and environmental weather systems using particle simulation graphs.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Unreal Niagara",
      "Unity VFX Graph",
      "Fluid Simulation",
      "Sprite Sheet Generation"
    ],
    "stages": [
      {
        "title": "Phase 1: VFX Core Fundamentals & Tooling",
        "skills": [
          "Unreal Niagara",
          "Unity VFX Graph",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Unity VFX Graph",
          "Fluid Simulation",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Fluid Simulation",
          "Sprite Sheet Generation",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Unreal Niagara",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_120_procedural-generation-engineer",
    "slug": "procedural-generation-engineer",
    "title": "Procedural Generation Engineer",
    "category": "Game Dev & 3D",
    "shortDesc": "Write algorithmic terrain generators, endless dungeon layouts, and procedural foliage placement.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Perlin / Simplex Noise",
      "Wave Function Collapse (WFC)",
      "Cellular Automata",
      "Voronoi Diagrams"
    ],
    "stages": [
      {
        "title": "Phase 1: Procedural Core Fundamentals & Tooling",
        "skills": [
          "Perlin / Simplex Noise",
          "Wave Function Collapse (WFC)",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Wave Function Collapse (WFC)",
          "Cellular Automata",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Cellular Automata",
          "Voronoi Diagrams",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Perlin / Simplex Noise",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_121_product-designer",
    "slug": "product-designer",
    "title": "Product Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Drive user-centered product discovery, wireframing, high-fidelity prototypes, and design sprints.",
    "effortHours": 115,
    "popular": true,
    "skills": [
      "Figma Mastery",
      "User Journey Mapping",
      "Design Sprints",
      "High-Fidelity Prototyping",
      "Design Systems"
    ],
    "stages": [
      {
        "title": "Phase 1: Product Core Fundamentals & Tooling",
        "skills": [
          "Figma Mastery",
          "User Journey Mapping",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "User Journey Mapping",
          "Design Sprints",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Design Sprints",
          "High-Fidelity Prototyping",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Figma Mastery",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_122_ui-designer",
    "slug": "ui-designer",
    "title": "UI Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Craft visual design systems, color palettes, sleek dark modes, and pixel-perfect layouts.",
    "effortHours": 105,
    "popular": true,
    "skills": [
      "Visual Hierarchy",
      "Typography Systems",
      "Color Theory",
      "Iconography",
      "Responsive Grids"
    ],
    "stages": [
      {
        "title": "Phase 1: UI Core Fundamentals & Tooling",
        "skills": [
          "Visual Hierarchy",
          "Typography Systems",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Typography Systems",
          "Color Theory",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Color Theory",
          "Iconography",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Visual Hierarchy",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_123_ux-researcher",
    "slug": "ux-researcher",
    "title": "UX Researcher",
    "category": "UI/UX & Product Design",
    "shortDesc": "Uncover user pain points through user interviews, usability testing sessions, and tree testing.",
    "effortHours": 110,
    "popular": true,
    "skills": [
      "User Interviews",
      "Usability Testing",
      "Card Sorting",
      "Surveys & Persona Synthesis",
      "Dovetail"
    ],
    "stages": [
      {
        "title": "Phase 1: UX Core Fundamentals & Tooling",
        "skills": [
          "User Interviews",
          "Usability Testing",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Usability Testing",
          "Card Sorting",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Card Sorting",
          "Surveys & Persona Synthesis",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "User Interviews",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_124_design-systems-lead",
    "slug": "design-systems-lead",
    "title": "Design Systems Lead",
    "category": "UI/UX & Product Design",
    "shortDesc": "Architect scalable Figma component libraries, multi-brand design tokens, and engineering parity.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "Figma Variables & Modes",
      "Design Tokens (W3C)",
      "Component Architecture",
      "Accessibility Audits"
    ],
    "stages": [
      {
        "title": "Phase 1: Design Core Fundamentals & Tooling",
        "skills": [
          "Figma Variables & Modes",
          "Design Tokens (W3C)",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Design Tokens (W3C)",
          "Component Architecture",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Component Architecture",
          "Accessibility Audits",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Figma Variables & Modes",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_125_interaction-motion-designer",
    "slug": "interaction-motion-designer",
    "title": "Interaction & Motion Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Bring static screens to life with fluid spring transitions, micro-interactions, and Lottie animations.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Framer",
      "After Effects / Lottie",
      "Spring Physics Curves",
      "Micro-Interactions",
      "Principle"
    ],
    "stages": [
      {
        "title": "Phase 1: Interaction Core Fundamentals & Tooling",
        "skills": [
          "Framer",
          "After Effects / Lottie",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "After Effects / Lottie",
          "Spring Physics Curves",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Spring Physics Curves",
          "Micro-Interactions",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Framer",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_126_ux-writer-content-designer",
    "slug": "ux-writer-content-designer",
    "title": "UX Writer & Content Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Shape intuitive user journeys with clear microcopy, onboarding tooltips, and contextual error states.",
    "effortHours": 95,
    "popular": false,
    "skills": [
      "Microcopy UX Writing",
      "Information Architecture",
      "Voice & Tone Guidelines",
      "Content Audits"
    ],
    "stages": [
      {
        "title": "Phase 1: UX Core Fundamentals & Tooling",
        "skills": [
          "Microcopy UX Writing",
          "Information Architecture",
          "Environment Setup"
        ],
        "effortHours": 21
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Information Architecture",
          "Voice & Tone Guidelines",
          "Best Practices"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Voice & Tone Guidelines",
          "Content Audits",
          "Performance Tuning"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Microcopy UX Writing",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 20
      }
    ]
  },
  {
    "id": "c_127_accessibility-a11y-specialist",
    "slug": "accessibility-a11y-specialist",
    "title": "Accessibility (A11y) Specialist",
    "category": "UI/UX & Product Design",
    "shortDesc": "Ensure digital products comply with WCAG 2.2 AA standards, screen readers, and keyboard navigation.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "WCAG 2.2 Standards",
      "Screen Reader Auditing",
      "Color Contrast Compliance",
      "ARIA Attributes"
    ],
    "stages": [
      {
        "title": "Phase 1: Accessibility Core Fundamentals & Tooling",
        "skills": [
          "WCAG 2.2 Standards",
          "Screen Reader Auditing",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Screen Reader Auditing",
          "Color Contrast Compliance",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Color Contrast Compliance",
          "ARIA Attributes",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "WCAG 2.2 Standards",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_128_spatial-ui-3d-interface-designer",
    "slug": "spatial-ui-3d-interface-designer",
    "title": "Spatial UI & 3D Interface Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Design user interfaces for spatial computing, AR glass displays, and floating depth hierarchies.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Spatial UI Guidelines",
      "Depth & Glassmorphism",
      "Eye & Gesture Ergonomics",
      "Spline 3D / Figma"
    ],
    "stages": [
      {
        "title": "Phase 1: Spatial Core Fundamentals & Tooling",
        "skills": [
          "Spatial UI Guidelines",
          "Depth & Glassmorphism",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Depth & Glassmorphism",
          "Eye & Gesture Ergonomics",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Eye & Gesture Ergonomics",
          "Spline 3D / Figma",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Spatial UI Guidelines",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_129_design-operations-designops-manager",
    "slug": "design-operations-designops-manager",
    "title": "Design Operations (DesignOps) Manager",
    "category": "UI/UX & Product Design",
    "shortDesc": "Streamline designer-developer handoff, design team workflows, and version management.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "Design Team Workflow",
      "Figma Organization",
      "Handoff Automation",
      "Tooling Optimization"
    ],
    "stages": [
      {
        "title": "Phase 1: Design Core Fundamentals & Tooling",
        "skills": [
          "Design Team Workflow",
          "Figma Organization",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Figma Organization",
          "Handoff Automation",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Handoff Automation",
          "Tooling Optimization",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Design Team Workflow",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_130_service-designer",
    "slug": "service-designer",
    "title": "Service Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Map complex end-to-end multi-channel service blueprints across digital, physical, and staff touchpoints.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Service Blueprinting",
      "Stakeholder Ecosystem Maps",
      "Touchpoint Journey Mapping",
      "Miro / FigJam"
    ],
    "stages": [
      {
        "title": "Phase 1: Service Core Fundamentals & Tooling",
        "skills": [
          "Service Blueprinting",
          "Stakeholder Ecosystem Maps",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Stakeholder Ecosystem Maps",
          "Touchpoint Journey Mapping",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Touchpoint Journey Mapping",
          "Miro / FigJam",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Service Blueprinting",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_131_brand-digital-identity-designer",
    "slug": "brand-digital-identity-designer",
    "title": "Brand & Digital Identity Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Build cohesive brand guidelines, vector logos, custom illustration systems, and marketing collateral.",
    "effortHours": 100,
    "popular": false,
    "skills": [
      "Vector Illustration",
      "Brand Guidelines",
      "Logo Design",
      "Typography Pairings",
      "Illustrator"
    ],
    "stages": [
      {
        "title": "Phase 1: Brand Core Fundamentals & Tooling",
        "skills": [
          "Vector Illustration",
          "Brand Guidelines",
          "Environment Setup"
        ],
        "effortHours": 22
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Brand Guidelines",
          "Logo Design",
          "Best Practices"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Logo Design",
          "Typography Pairings",
          "Performance Tuning"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Vector Illustration",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 22
      }
    ]
  },
  {
    "id": "c_132_data-visualization-ui-designer",
    "slug": "data-visualization-ui-designer",
    "title": "Data Visualization UI Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Transform dense financial and operational datasets into scannable, interactive visual charts.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Chart UX Ergonomics",
      "Information Dashboard Design",
      "Color Scale Mapping",
      "D3.js Principles"
    ],
    "stages": [
      {
        "title": "Phase 1: Data Core Fundamentals & Tooling",
        "skills": [
          "Chart UX Ergonomics",
          "Information Dashboard Design",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Information Dashboard Design",
          "Color Scale Mapping",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Color Scale Mapping",
          "D3.js Principles",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Chart UX Ergonomics",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_133_growth-conversion-cro-designer",
    "slug": "growth-conversion-cro-designer",
    "title": "Growth & Conversion (CRO) Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Design high-converting checkout funnels, landing page variants, and iterative A/B test experiments.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "Conversion Rate Optimization",
      "Landing Page UX",
      "A/B Test Design",
      "Behavior Analytics (Hotjar)"
    ],
    "stages": [
      {
        "title": "Phase 1: Growth Core Fundamentals & Tooling",
        "skills": [
          "Conversion Rate Optimization",
          "Landing Page UX",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Landing Page UX",
          "A/B Test Design",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "A/B Test Design",
          "Behavior Analytics (Hotjar)",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Conversion Rate Optimization",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_134_mobile-app-ux-specialist",
    "slug": "mobile-app-ux-specialist",
    "title": "Mobile App UX Specialist",
    "category": "UI/UX & Product Design",
    "shortDesc": "Master thumb-friendly navigation, iOS Human Interface Guidelines, and Material Design patterns.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "iOS HIG",
      "Material 3 Patterns",
      "Touch Target Sizing",
      "Bottom Sheet Ergonomics"
    ],
    "stages": [
      {
        "title": "Phase 1: Mobile Core Fundamentals & Tooling",
        "skills": [
          "iOS HIG",
          "Material 3 Patterns",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Material 3 Patterns",
          "Touch Target Sizing",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Touch Target Sizing",
          "Bottom Sheet Ergonomics",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "iOS HIG",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_135_voice-conversational-ui-designer",
    "slug": "voice-conversational-ui-designer",
    "title": "Voice & Conversational UI Designer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Script natural multi-turn conversational dialog trees and voice agent repair flows.",
    "effortHours": 100,
    "popular": false,
    "skills": [
      "Conversational Flow Design",
      "Voice UI (VUI)",
      "Disambiguation Prompts",
      "Bot Personality"
    ],
    "stages": [
      {
        "title": "Phase 1: Voice Core Fundamentals & Tooling",
        "skills": [
          "Conversational Flow Design",
          "Voice UI (VUI)",
          "Environment Setup"
        ],
        "effortHours": 22
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Voice UI (VUI)",
          "Disambiguation Prompts",
          "Best Practices"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Disambiguation Prompts",
          "Bot Personality",
          "Performance Tuning"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Conversational Flow Design",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 22
      }
    ]
  },
  {
    "id": "c_136_prototype-engineer",
    "slug": "prototype-engineer",
    "title": "Prototype Engineer",
    "category": "UI/UX & Product Design",
    "shortDesc": "Code hyper-realistic web and mobile prototypes with live data to test bold ideas before production.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Framer Code Components",
      "HTML / CSS / JS Prototyping",
      "API Mocking",
      "Interactive Storytelling"
    ],
    "stages": [
      {
        "title": "Phase 1: Prototype Core Fundamentals & Tooling",
        "skills": [
          "Framer Code Components",
          "HTML / CSS / JS Prototyping",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "HTML / CSS / JS Prototyping",
          "API Mocking",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "API Mocking",
          "Interactive Storytelling",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Framer Code Components",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_137_technical-product-manager",
    "slug": "technical-product-manager",
    "title": "Technical Product Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Lead engineering cross-functional teams to build high-impact platforms, APIs, and SaaS products.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "PRD Writing",
      "API Architecture Understanding",
      "Sprint Backlog Prioritization",
      "SQL Metrics",
      "User Story Mapping"
    ],
    "stages": [
      {
        "title": "Phase 1: Technical Core Fundamentals & Tooling",
        "skills": [
          "PRD Writing",
          "API Architecture Understanding",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "API Architecture Understanding",
          "Sprint Backlog Prioritization",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Sprint Backlog Prioritization",
          "SQL Metrics",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PRD Writing",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_138_agile-scrum-master",
    "slug": "agile-scrum-master",
    "title": "Agile Scrum Master",
    "category": "Product & Agile Leadership",
    "shortDesc": "Facilitate sprint planning, daily standups, retrospectives, and unblock team impediments.",
    "effortHours": 100,
    "popular": false,
    "skills": [
      "Scrum Ceremonies",
      "Kanban Flow",
      "Jira / Linear",
      "Burndown Metrics",
      "Servant Leadership"
    ],
    "stages": [
      {
        "title": "Phase 1: Agile Core Fundamentals & Tooling",
        "skills": [
          "Scrum Ceremonies",
          "Kanban Flow",
          "Environment Setup"
        ],
        "effortHours": 22
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Kanban Flow",
          "Jira / Linear",
          "Best Practices"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Jira / Linear",
          "Burndown Metrics",
          "Performance Tuning"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Scrum Ceremonies",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 22
      }
    ]
  },
  {
    "id": "c_139_engineering-manager",
    "slug": "engineering-manager",
    "title": "Engineering Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Coach engineers, lead performance reviews, architect hiring pipelines, and align tech delivery with business.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "1-on-1 Coaching",
      "Performance Reviews",
      "Engineering Hiring",
      "Tech Debt Prioritization",
      "Team Morale"
    ],
    "stages": [
      {
        "title": "Phase 1: Engineering Core Fundamentals & Tooling",
        "skills": [
          "1-on-1 Coaching",
          "Performance Reviews",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Performance Reviews",
          "Engineering Hiring",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Engineering Hiring",
          "Tech Debt Prioritization",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "1-on-1 Coaching",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_140_technical-program-manager-tpm",
    "slug": "technical-program-manager-tpm",
    "title": "Technical Program Manager (TPM)",
    "category": "Product & Agile Leadership",
    "shortDesc": "Orchestrate multi-team dependencies, critical path schedules, and risk management across departments.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Cross-Functional Execution",
      "Gantt / Dependency Tracking",
      "Risk Mitigation",
      "Executive Communication"
    ],
    "stages": [
      {
        "title": "Phase 1: Technical Core Fundamentals & Tooling",
        "skills": [
          "Cross-Functional Execution",
          "Gantt / Dependency Tracking",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Gantt / Dependency Tracking",
          "Risk Mitigation",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Risk Mitigation",
          "Executive Communication",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Cross-Functional Execution",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_141_solutions-architect",
    "slug": "solutions-architect",
    "title": "Solutions Architect",
    "category": "Product & Agile Leadership",
    "shortDesc": "Lead technical discovery with enterprise clients and design customized software solution blueprints.",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "Enterprise System Design",
      "Technical Discovery",
      "RFP Technical Proposals",
      "Integration Patterns"
    ],
    "stages": [
      {
        "title": "Phase 1: Solutions Core Fundamentals & Tooling",
        "skills": [
          "Enterprise System Design",
          "Technical Discovery",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Technical Discovery",
          "RFP Technical Proposals",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "RFP Technical Proposals",
          "Integration Patterns",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Enterprise System Design",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_142_developer-advocate-devrel",
    "slug": "developer-advocate-devrel",
    "title": "Developer Advocate (DevRel)",
    "category": "Product & Agile Leadership",
    "shortDesc": "Inspire developers through technical tutorials, conference keynotes, sample repos, and SDK feedback.",
    "effortHours": 115,
    "popular": true,
    "skills": [
      "Technical Writing",
      "Public Speaking",
      "Demo App Development",
      "Developer Community",
      "SDK Feedback"
    ],
    "stages": [
      {
        "title": "Phase 1: Developer Core Fundamentals & Tooling",
        "skills": [
          "Technical Writing",
          "Public Speaking",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Public Speaking",
          "Demo App Development",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Demo App Development",
          "Developer Community",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Technical Writing",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_143_growth-product-manager",
    "slug": "growth-product-manager",
    "title": "Growth Product Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Drive product-led growth (PLG), self-serve conversion funnels, onboarding retention, and viral loops.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "Product-Led Growth (PLG)",
      "Funnel Analytics (Mixpanel)",
      "Viral Referral Loops",
      "Experimentation"
    ],
    "stages": [
      {
        "title": "Phase 1: Growth Core Fundamentals & Tooling",
        "skills": [
          "Product-Led Growth (PLG)",
          "Funnel Analytics (Mixpanel)",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Funnel Analytics (Mixpanel)",
          "Viral Referral Loops",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Viral Referral Loops",
          "Experimentation",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Product-Led Growth (PLG)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_144_startup-chief-technology-officer-cto",
    "slug": "startup-chief-technology-officer-cto",
    "title": "Startup Chief Technology Officer (CTO)",
    "category": "Product & Agile Leadership",
    "shortDesc": "Set foundational technology stacks, build initial engineering teams, and deliver 0-to-1 products.",
    "effortHours": 150,
    "popular": true,
    "skills": [
      "0-to-1 Architecture",
      "Tech Stack Selection",
      "Technical Hiring",
      "Fundraising Technical Diligence"
    ],
    "stages": [
      {
        "title": "Phase 1: Startup Core Fundamentals & Tooling",
        "skills": [
          "0-to-1 Architecture",
          "Tech Stack Selection",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Tech Stack Selection",
          "Technical Hiring",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Technical Hiring",
          "Fundraising Technical Diligence",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "0-to-1 Architecture",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_145_it-project-manager",
    "slug": "it-project-manager",
    "title": "IT Project Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Manage enterprise software deployments, vendor contracts, project budgets, and delivery timelines.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "PMP Methodologies",
      "Budget Forecasting",
      "Vendor Management",
      "Scope Baseline Control"
    ],
    "stages": [
      {
        "title": "Phase 1: IT Core Fundamentals & Tooling",
        "skills": [
          "PMP Methodologies",
          "Budget Forecasting",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Budget Forecasting",
          "Vendor Management",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Vendor Management",
          "Scope Baseline Control",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PMP Methodologies",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_146_product-operations-manager",
    "slug": "product-operations-manager",
    "title": "Product Operations Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Bridge product teams with customer support, standardize launch checklists, and centralize user feedback.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "Product Launch Checklists",
      "Feedback Aggregation",
      "Beta Testing Management",
      "Data Tooling"
    ],
    "stages": [
      {
        "title": "Phase 1: Product Core Fundamentals & Tooling",
        "skills": [
          "Product Launch Checklists",
          "Feedback Aggregation",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Feedback Aggregation",
          "Beta Testing Management",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Beta Testing Management",
          "Data Tooling",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Product Launch Checklists",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_147_release-manager",
    "slug": "release-manager",
    "title": "Release Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Coordinate change management boards, rollback strategies, and multi-service deployment windows.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Change Advisory Board (CAB)",
      "Release Checklists",
      "Rollback Planning",
      "Incident Retrospectives"
    ],
    "stages": [
      {
        "title": "Phase 1: Release Core Fundamentals & Tooling",
        "skills": [
          "Change Advisory Board (CAB)",
          "Release Checklists",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Release Checklists",
          "Rollback Planning",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Rollback Planning",
          "Incident Retrospectives",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Change Advisory Board (CAB)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_148_agile-coach-transformation-lead",
    "slug": "agile-coach-transformation-lead",
    "title": "Agile Coach & Transformation Lead",
    "category": "Product & Agile Leadership",
    "shortDesc": "Guide large enterprises from legacy waterfall to agile scaling frameworks (SAFe, LeSS).",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Scaled Agile (SAFe)",
      "Organizational Change Management",
      "Agile Assessment Audits",
      "Workshop Facilitation"
    ],
    "stages": [
      {
        "title": "Phase 1: Agile Core Fundamentals & Tooling",
        "skills": [
          "Scaled Agile (SAFe)",
          "Organizational Change Management",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Organizational Change Management",
          "Agile Assessment Audits",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Agile Assessment Audits",
          "Workshop Facilitation",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Scaled Agile (SAFe)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_149_b2b-enterprise-product-manager",
    "slug": "b2b-enterprise-product-manager",
    "title": "B2B Enterprise Product Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Build enterprise-grade software with SAML SSO, RBAC permissions, audit logging, and custom SLAs.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Enterprise SSO / RBAC",
      "Audit Log Standards",
      "Custom Export Tooling",
      "Enterprise Procurement"
    ],
    "stages": [
      {
        "title": "Phase 1: B2B Core Fundamentals & Tooling",
        "skills": [
          "Enterprise SSO / RBAC",
          "Audit Log Standards",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Audit Log Standards",
          "Custom Export Tooling",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Custom Export Tooling",
          "Enterprise Procurement",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Enterprise SSO / RBAC",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_150_ai-product-manager",
    "slug": "ai-product-manager",
    "title": "AI Product Manager",
    "category": "Product & Agile Leadership",
    "shortDesc": "Define product value for generative AI features, balance model latency vs accuracy, and monitor ROI.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "LLM Evaluation Criteria",
      "Model Cost / Token ROI",
      "User Feedback Loops",
      "AI UX Affordances"
    ],
    "stages": [
      {
        "title": "Phase 1: AI Core Fundamentals & Tooling",
        "skills": [
          "LLM Evaluation Criteria",
          "Model Cost / Token ROI",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Model Cost / Token ROI",
          "User Feedback Loops",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "User Feedback Loops",
          "AI UX Affordances",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "LLM Evaluation Criteria",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_151_open-source-community-lead",
    "slug": "open-source-community-lead",
    "title": "Open Source Community Lead",
    "category": "Product & Agile Leadership",
    "shortDesc": "Nurture healthy contributor ecosystems, triage GitHub issues, and coordinate major version launches.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "GitHub Community Management",
      "Issue Triage Protocols",
      "Contributor Guides",
      "Release Roadmaps"
    ],
    "stages": [
      {
        "title": "Phase 1: Open Core Fundamentals & Tooling",
        "skills": [
          "GitHub Community Management",
          "Issue Triage Protocols",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Issue Triage Protocols",
          "Contributor Guides",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Contributor Guides",
          "Release Roadmaps",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "GitHub Community Management",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_152_sdet-software-dev-engineer-in-test",
    "slug": "sdet-software-dev-engineer-in-test",
    "title": "SDET (Software Dev Engineer in Test)",
    "category": "QA & Reliability",
    "shortDesc": "Build robust end-to-end test automation frameworks using Playwright, TypeScript, and Docker.",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "Playwright",
      "TypeScript",
      "Test Framework Design",
      "CI/CD Test Suites",
      "Page Object Model"
    ],
    "stages": [
      {
        "title": "Phase 1: SDET Core Fundamentals & Tooling",
        "skills": [
          "Playwright",
          "TypeScript",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "TypeScript",
          "Test Framework Design",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Test Framework Design",
          "CI/CD Test Suites",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Playwright",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_153_qa-automation-engineer",
    "slug": "qa-automation-engineer",
    "title": "QA Automation Engineer",
    "category": "QA & Reliability",
    "shortDesc": "Automate repetitive manual test scenarios across web browsers and verify regressions.",
    "effortHours": 115,
    "popular": true,
    "skills": [
      "Cypress",
      "Selenium WebDriver",
      "JavaScript / Python",
      "TestRail",
      "Automated Reporting"
    ],
    "stages": [
      {
        "title": "Phase 1: QA Core Fundamentals & Tooling",
        "skills": [
          "Cypress",
          "Selenium WebDriver",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Selenium WebDriver",
          "JavaScript / Python",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "JavaScript / Python",
          "TestRail",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Cypress",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_154_api-testing-specialist",
    "slug": "api-testing-specialist",
    "title": "API Testing Specialist",
    "category": "QA & Reliability",
    "shortDesc": "Design comprehensive REST and GraphQL automated contract tests and mock server suites.",
    "effortHours": 110,
    "popular": false,
    "skills": [
      "Postman Newman",
      "REST Assured",
      "Contract Testing (Pact)",
      "JSON Schema Validation"
    ],
    "stages": [
      {
        "title": "Phase 1: API Core Fundamentals & Tooling",
        "skills": [
          "Postman Newman",
          "REST Assured",
          "Environment Setup"
        ],
        "effortHours": 24
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "REST Assured",
          "Contract Testing (Pact)",
          "Best Practices"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Contract Testing (Pact)",
          "JSON Schema Validation",
          "Performance Tuning"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Postman Newman",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_155_performance-load-test-engineer",
    "slug": "performance-load-test-engineer",
    "title": "Performance & Load Test Engineer",
    "category": "QA & Reliability",
    "shortDesc": "Simulate millions of concurrent virtual users with k6 and uncover database and server bottlenecks.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "k6",
      "JMeter",
      "Locust (Python)",
      "Throughput Metrics",
      "Server Resource Profiling"
    ],
    "stages": [
      {
        "title": "Phase 1: Performance Core Fundamentals & Tooling",
        "skills": [
          "k6",
          "JMeter",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "JMeter",
          "Locust (Python)",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Locust (Python)",
          "Throughput Metrics",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "k6",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_156_mobile-qa-automation-engineer",
    "slug": "mobile-qa-automation-engineer",
    "title": "Mobile QA Automation Engineer",
    "category": "QA & Reliability",
    "shortDesc": "Automate iOS and Android test suites across physical devices and cloud farms using Appium and Maestro.",
    "effortHours": 120,
    "popular": false,
    "skills": [
      "Maestro",
      "Appium",
      "BrowserStack Device Farm",
      "Mobile CI Execution",
      "UI Test Selectors"
    ],
    "stages": [
      {
        "title": "Phase 1: Mobile Core Fundamentals & Tooling",
        "skills": [
          "Maestro",
          "Appium",
          "Environment Setup"
        ],
        "effortHours": 26
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Appium",
          "BrowserStack Device Farm",
          "Best Practices"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "BrowserStack Device Farm",
          "Mobile CI Execution",
          "Performance Tuning"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Maestro",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_157_security-qa-tester",
    "slug": "security-qa-tester",
    "title": "Security QA Tester",
    "category": "QA & Reliability",
    "shortDesc": "Execute automated security regression tests checking for IDOR, SQL injection, and authorization leaks.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "OWASP ZAP Automation",
      "Burp Suite Scanner",
      "IDOR Vulnerability Verification",
      "Auth Bypass Checks"
    ],
    "stages": [
      {
        "title": "Phase 1: Security Core Fundamentals & Tooling",
        "skills": [
          "OWASP ZAP Automation",
          "Burp Suite Scanner",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Burp Suite Scanner",
          "IDOR Vulnerability Verification",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "IDOR Vulnerability Verification",
          "Auth Bypass Checks",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "OWASP ZAP Automation",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_158_accessibility-qa-tester",
    "slug": "accessibility-qa-tester",
    "title": "Accessibility QA Tester",
    "category": "QA & Reliability",
    "shortDesc": "Perform manual screen reader audits (NVDA, VoiceOver) and automated axe-core accessibility checks.",
    "effortHours": 105,
    "popular": false,
    "skills": [
      "VoiceOver / NVDA",
      "axe-core Automated Linting",
      "Keyboard-Only Navigation",
      "WCAG Audit Reports"
    ],
    "stages": [
      {
        "title": "Phase 1: Accessibility Core Fundamentals & Tooling",
        "skills": [
          "VoiceOver / NVDA",
          "axe-core Automated Linting",
          "Environment Setup"
        ],
        "effortHours": 23
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "axe-core Automated Linting",
          "Keyboard-Only Navigation",
          "Best Practices"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Keyboard-Only Navigation",
          "WCAG Audit Reports",
          "Performance Tuning"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "VoiceOver / NVDA",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 24
      }
    ]
  },
  {
    "id": "c_159_data-pipeline-qa-engineer",
    "slug": "data-pipeline-qa-engineer",
    "title": "Data Pipeline QA Engineer",
    "category": "QA & Reliability",
    "shortDesc": "Validate ETL pipeline data accuracy, schema drifts, null rates, and warehouse transformations.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Great Expectations",
      "Soda SQL",
      "Data Diff Verification",
      "Automated Warehouse Assertions"
    ],
    "stages": [
      {
        "title": "Phase 1: Data Core Fundamentals & Tooling",
        "skills": [
          "Great Expectations",
          "Soda SQL",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Soda SQL",
          "Data Diff Verification",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Data Diff Verification",
          "Automated Warehouse Assertions",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Great Expectations",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_160_chaos-resilience-test-engineer",
    "slug": "chaos-resilience-test-engineer",
    "title": "Chaos & Resilience Test Engineer",
    "category": "QA & Reliability",
    "shortDesc": "Validate that microservices cleanly handle network timeouts, node crashes, and database failovers.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Chaos Testing Principles",
      "Toxiproxy",
      "Circuit Breaker Testing",
      "Failover Validation"
    ],
    "stages": [
      {
        "title": "Phase 1: Chaos Core Fundamentals & Tooling",
        "skills": [
          "Chaos Testing Principles",
          "Toxiproxy",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Toxiproxy",
          "Circuit Breaker Testing",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Circuit Breaker Testing",
          "Failover Validation",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Chaos Testing Principles",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_161_exploratory-usability-qa-tester",
    "slug": "exploratory-usability-qa-tester",
    "title": "Exploratory & Usability QA Tester",
    "category": "QA & Reliability",
    "shortDesc": "Uncover subtle edge-case bugs and usability inconsistencies through structured exploratory sessions.",
    "effortHours": 95,
    "popular": false,
    "skills": [
      "Session-Based Test Management",
      "Heuristic Evaluation",
      "Boundary Value Testing",
      "Bug Reproduction"
    ],
    "stages": [
      {
        "title": "Phase 1: Exploratory Core Fundamentals & Tooling",
        "skills": [
          "Session-Based Test Management",
          "Heuristic Evaluation",
          "Environment Setup"
        ],
        "effortHours": 21
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Heuristic Evaluation",
          "Boundary Value Testing",
          "Best Practices"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Boundary Value Testing",
          "Bug Reproduction",
          "Performance Tuning"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Session-Based Test Management",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 20
      }
    ]
  },
  {
    "id": "c_162_cross-browser-compatibility-specialist",
    "slug": "cross-browser-compatibility-specialist",
    "title": "Cross-Browser Compatibility Specialist",
    "category": "QA & Reliability",
    "shortDesc": "Audit rendering and behavior parity across Safari, Chrome, Firefox, Edge, and older mobile browsers.",
    "effortHours": 100,
    "popular": false,
    "skills": [
      "BrowserStack Testing",
      "CSS Cross-Browser Quirks",
      "WebKit vs Blink Engines",
      "Responsive Breakpoint Audits"
    ],
    "stages": [
      {
        "title": "Phase 1: Cross-Browser Core Fundamentals & Tooling",
        "skills": [
          "BrowserStack Testing",
          "CSS Cross-Browser Quirks",
          "Environment Setup"
        ],
        "effortHours": 22
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "CSS Cross-Browser Quirks",
          "WebKit vs Blink Engines",
          "Best Practices"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "WebKit vs Blink Engines",
          "Responsive Breakpoint Audits",
          "Performance Tuning"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "BrowserStack Testing",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 22
      }
    ]
  },
  {
    "id": "c_163_embedded-hardware-qa-engineer",
    "slug": "embedded-hardware-qa-engineer",
    "title": "Embedded & Hardware QA Engineer",
    "category": "QA & Reliability",
    "shortDesc": "Test embedded microcontrollers, hardware-in-the-loop (HIL) simulators, and serial communications.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Hardware-in-the-Loop (HIL)",
      "Oscilloscope / Logic Analyzer",
      "Serial UART Testing",
      "Firmware Flashing"
    ],
    "stages": [
      {
        "title": "Phase 1: Embedded Core Fundamentals & Tooling",
        "skills": [
          "Hardware-in-the-Loop (HIL)",
          "Oscilloscope / Logic Analyzer",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Oscilloscope / Logic Analyzer",
          "Serial UART Testing",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Serial UART Testing",
          "Firmware Flashing",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Hardware-in-the-Loop (HIL)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_164_localization-l10n-qa-tester",
    "slug": "localization-l10n-qa-tester",
    "title": "Localization (L10n) QA Tester",
    "category": "QA & Reliability",
    "shortDesc": "Verify internationalization, right-to-left (RTL) Arabic/Hebrew layouts, and translated currency formatting.",
    "effortHours": 95,
    "popular": false,
    "skills": [
      "RTL Layout Auditing",
      "Pseudo-Localization Testing",
      "Date / Currency Formatting",
      "String Truncation Fixes"
    ],
    "stages": [
      {
        "title": "Phase 1: Localization Core Fundamentals & Tooling",
        "skills": [
          "RTL Layout Auditing",
          "Pseudo-Localization Testing",
          "Environment Setup"
        ],
        "effortHours": 21
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Pseudo-Localization Testing",
          "Date / Currency Formatting",
          "Best Practices"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Date / Currency Formatting",
          "String Truncation Fixes",
          "Performance Tuning"
        ],
        "effortHours": 27
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "RTL Layout Auditing",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 20
      }
    ]
  },
  {
    "id": "c_165_continuous-quality-architect",
    "slug": "continuous-quality-architect",
    "title": "Continuous Quality Architect",
    "category": "QA & Reliability",
    "shortDesc": "Define company-wide quality gates, shift-left testing cultures, and automated PR blockage rules.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Shift-Left Strategy",
      "SonarQube Quality Gates",
      "Flaky Test Quarantine",
      "Code Coverage Targets"
    ],
    "stages": [
      {
        "title": "Phase 1: Continuous Core Fundamentals & Tooling",
        "skills": [
          "Shift-Left Strategy",
          "SonarQube Quality Gates",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "SonarQube Quality Gates",
          "Flaky Test Quarantine",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Flaky Test Quarantine",
          "Code Coverage Targets",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Shift-Left Strategy",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_166_quantitative-developer-quant",
    "slug": "quantitative-developer-quant",
    "title": "Quantitative Developer (Quant)",
    "category": "FinTech & Web3",
    "shortDesc": "Build numerical pricing models, statistical arbitrage engines, and high-speed data pipelines.",
    "effortHours": 155,
    "popular": true,
    "skills": [
      "C++",
      "Python",
      "Numerical Linear Algebra",
      "Financial Derivatives Math",
      "Pandas / NumPy"
    ],
    "stages": [
      {
        "title": "Phase 1: Quantitative Core Fundamentals & Tooling",
        "skills": [
          "C++",
          "Python",
          "Environment Setup"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Python",
          "Numerical Linear Algebra",
          "Best Practices"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Numerical Linear Algebra",
          "Financial Derivatives Math",
          "Performance Tuning"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "C++",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_167_algorithmic-trading-engineer",
    "slug": "algorithmic-trading-engineer",
    "title": "Algorithmic Trading Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Design automated execution algorithms (TWAP, VWAP) connecting to market exchange order books.",
    "effortHours": 150,
    "popular": true,
    "skills": [
      "Order Book Mechanics (L2/L3)",
      "FIX Protocol",
      "Execution Algorithms",
      "Backtesting Engines"
    ],
    "stages": [
      {
        "title": "Phase 1: Algorithmic Core Fundamentals & Tooling",
        "skills": [
          "Order Book Mechanics (L2/L3)",
          "FIX Protocol",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "FIX Protocol",
          "Execution Algorithms",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Execution Algorithms",
          "Backtesting Engines",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Order Book Mechanics (L2/L3)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_168_hft-low-latency-c-engineer",
    "slug": "hft-low-latency-c-engineer",
    "title": "HFT Low-Latency C++ Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Write sub-microsecond trading engines utilizing zero-allocation C++, cache locality, and kernel bypass.",
    "effortHours": 165,
    "popular": true,
    "skills": [
      "Modern C++ (C++20)",
      "Kernel Bypass (Solarflare / DPDK)",
      "Lock-Free Queues",
      "CPU Cache Optimization"
    ],
    "stages": [
      {
        "title": "Phase 1: HFT Core Fundamentals & Tooling",
        "skills": [
          "Modern C++ (C++20)",
          "Kernel Bypass (Solarflare / DPDK)",
          "Environment Setup"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Kernel Bypass (Solarflare / DPDK)",
          "Lock-Free Queues",
          "Best Practices"
        ],
        "effortHours": 46
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Lock-Free Queues",
          "CPU Cache Optimization",
          "Performance Tuning"
        ],
        "effortHours": 46
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Modern C++ (C++20)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 37
      }
    ]
  },
  {
    "id": "c_169_smart-contract-solidity-engineer",
    "slug": "smart-contract-solidity-engineer",
    "title": "Smart Contract & Solidity Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Develop battle-tested, gas-optimized Ethereum smart contracts, DeFi lending pools, and ERC tokens.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "Solidity",
      "Foundry Testing",
      "EVM Gas Optimization",
      "ERC Standards (ERC-20/721/1155)",
      "Reentrancy Defense"
    ],
    "stages": [
      {
        "title": "Phase 1: Smart Core Fundamentals & Tooling",
        "skills": [
          "Solidity",
          "Foundry Testing",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Foundry Testing",
          "EVM Gas Optimization",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "EVM Gas Optimization",
          "ERC Standards (ERC-20/721/1155)",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Solidity",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_170_web3-full-stack-developer",
    "slug": "web3-full-stack-developer",
    "title": "Web3 Full Stack Developer",
    "category": "FinTech & Web3",
    "shortDesc": "Connect dApp frontend user experiences to blockchain contracts using Wagmi, Viem, and IPFS.",
    "effortHours": 125,
    "popular": true,
    "skills": [
      "Wagmi / Viem",
      "Ethers.js",
      "React",
      "The Graph (Subgraphs)",
      "IPFS / Arweave",
      "WalletConnect"
    ],
    "stages": [
      {
        "title": "Phase 1: Web3 Core Fundamentals & Tooling",
        "skills": [
          "Wagmi / Viem",
          "Ethers.js",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Ethers.js",
          "React",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "React",
          "The Graph (Subgraphs)",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Wagmi / Viem",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_171_defi-protocol-architect",
    "slug": "defi-protocol-architect",
    "title": "DeFi Protocol Architect",
    "category": "FinTech & Web3",
    "shortDesc": "Engineer automated market maker (AMM) formulas, flash-loan protections, and collateralized debt engines.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "AMM Constant Product Math",
      "Chainlink Oracles",
      "Liquidation Bots",
      "Flash Loan Defense",
      "Formal Verification"
    ],
    "stages": [
      {
        "title": "Phase 1: DeFi Core Fundamentals & Tooling",
        "skills": [
          "AMM Constant Product Math",
          "Chainlink Oracles",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Chainlink Oracles",
          "Liquidation Bots",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Liquidation Bots",
          "Flash Loan Defense",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "AMM Constant Product Math",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_172_blockchain-core-protocol-developer",
    "slug": "blockchain-core-protocol-developer",
    "title": "Blockchain Core Protocol Developer",
    "category": "FinTech & Web3",
    "shortDesc": "Design distributed consensus algorithms (PoS, BFT), peer-to-peer gossip layers, and state trees.",
    "effortHours": 160,
    "popular": false,
    "skills": [
      "Rust / Go",
      "Proof of Stake Consensus",
      "Merkle Patricia Trees",
      "libp2p Gossip",
      "Cryptographic Primitives"
    ],
    "stages": [
      {
        "title": "Phase 1: Blockchain Core Fundamentals & Tooling",
        "skills": [
          "Rust / Go",
          "Proof of Stake Consensus",
          "Environment Setup"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Proof of Stake Consensus",
          "Merkle Patricia Trees",
          "Best Practices"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Merkle Patricia Trees",
          "libp2p Gossip",
          "Performance Tuning"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Rust / Go",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_173_fintech-payment-systems-engineer",
    "slug": "fintech-payment-systems-engineer",
    "title": "FinTech Payment Systems Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Architect global payment checkouts, Stripe webhook reconciliations, and PCI-DSS compliant vaults.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "Stripe API Architecture",
      "PCI-DSS Compliance",
      "Idempotent Webhook Processing",
      "Card Networks / ACH"
    ],
    "stages": [
      {
        "title": "Phase 1: FinTech Core Fundamentals & Tooling",
        "skills": [
          "Stripe API Architecture",
          "PCI-DSS Compliance",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "PCI-DSS Compliance",
          "Idempotent Webhook Processing",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Idempotent Webhook Processing",
          "Card Networks / ACH",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Stripe API Architecture",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_174_core-banking-ledger-architect",
    "slug": "core-banking-ledger-architect",
    "title": "Core Banking Ledger Architect",
    "category": "FinTech & Web3",
    "shortDesc": "Build immutable double-entry accounting ledgers with zero balance discrepancy and audit history.",
    "effortHours": 140,
    "popular": false,
    "skills": [
      "Double-Entry Bookkeeping",
      "Immutable Transaction Logs",
      "ISO 20022 Messaging",
      "ACID Isolation"
    ],
    "stages": [
      {
        "title": "Phase 1: Core Core Fundamentals & Tooling",
        "skills": [
          "Double-Entry Bookkeeping",
          "Immutable Transaction Logs",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Immutable Transaction Logs",
          "ISO 20022 Messaging",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "ISO 20022 Messaging",
          "ACID Isolation",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Double-Entry Bookkeeping",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_175_financial-risk-modeling-engineer",
    "slug": "financial-risk-modeling-engineer",
    "title": "Financial Risk Modeling Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Calculate Value at Risk (VaR), expected shortfall, and stress-test portfolios under macroeconomic shock.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Monte Carlo Simulation",
      "Value at Risk (VaR)",
      "Stress Testing Models",
      "Python Financial Tools"
    ],
    "stages": [
      {
        "title": "Phase 1: Financial Core Fundamentals & Tooling",
        "skills": [
          "Monte Carlo Simulation",
          "Value at Risk (VaR)",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Value at Risk (VaR)",
          "Stress Testing Models",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Stress Testing Models",
          "Python Financial Tools",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Monte Carlo Simulation",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_176_fraud-detection-aml-engineer",
    "slug": "fraud-detection-aml-engineer",
    "title": "Fraud Detection & AML Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Detect card fraud rings and money laundering in real-time using graph analysis and machine learning.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Anomaly Detection",
      "Graph Link Analysis",
      "Anti-Money Laundering (AML)",
      "Feature Store (Feast)"
    ],
    "stages": [
      {
        "title": "Phase 1: Fraud Core Fundamentals & Tooling",
        "skills": [
          "Anomaly Detection",
          "Graph Link Analysis",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Graph Link Analysis",
          "Anti-Money Laundering (AML)",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Anti-Money Laundering (AML)",
          "Feature Store (Feast)",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Anomaly Detection",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_177_smart-contract-auditor",
    "slug": "smart-contract-auditor",
    "title": "Smart Contract Auditor",
    "category": "FinTech & Web3",
    "shortDesc": "Uncover critical exploits in multi-million dollar DeFi protocols before deployment using formal tools.",
    "effortHours": 150,
    "popular": true,
    "skills": [
      "Slither Static Analyzer",
      "Echidna Fuzzing",
      "DeFi Attack Vectors",
      "Audit Report Documentation"
    ],
    "stages": [
      {
        "title": "Phase 1: Smart Core Fundamentals & Tooling",
        "skills": [
          "Slither Static Analyzer",
          "Echidna Fuzzing",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Echidna Fuzzing",
          "DeFi Attack Vectors",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "DeFi Attack Vectors",
          "Audit Report Documentation",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Slither Static Analyzer",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_178_zero-knowledge-zk-cryptography-engineer",
    "slug": "zero-knowledge-zk-cryptography-engineer",
    "title": "Zero-Knowledge (ZK) Cryptography Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Construct privacy-preserving ZK proofs, zk-SNARK circuits, and Layer-2 rollups.",
    "effortHours": 160,
    "popular": false,
    "skills": [
      "Circom / SnarkJS",
      "zk-SNARKs & zk-STARKs",
      "Halo2",
      "L2 Rollup Architecture",
      "Cryptographic Math"
    ],
    "stages": [
      {
        "title": "Phase 1: Zero-Knowledge Core Fundamentals & Tooling",
        "skills": [
          "Circom / SnarkJS",
          "zk-SNARKs & zk-STARKs",
          "Environment Setup"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "zk-SNARKs & zk-STARKs",
          "Halo2",
          "Best Practices"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Halo2",
          "L2 Rollup Architecture",
          "Performance Tuning"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Circom / SnarkJS",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_179_digital-wallet-passkey-engineer",
    "slug": "digital-wallet-passkey-engineer",
    "title": "Digital Wallet & Passkey Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Integrate Apple Pay, Google Wallet, account abstraction (ERC-4337), and seedless passkey recovery.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Apple Pay / Google Pay APIs",
      "ERC-4337 Account Abstraction",
      "WebAuthn / Passkeys",
      "Hardware Security Enclaves"
    ],
    "stages": [
      {
        "title": "Phase 1: Digital Core Fundamentals & Tooling",
        "skills": [
          "Apple Pay / Google Pay APIs",
          "ERC-4337 Account Abstraction",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "ERC-4337 Account Abstraction",
          "WebAuthn / Passkeys",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "WebAuthn / Passkeys",
          "Hardware Security Enclaves",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Apple Pay / Google Pay APIs",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_180_regulatory-tech-regtech-engineer",
    "slug": "regulatory-tech-regtech-engineer",
    "title": "Regulatory Tech (RegTech) Engineer",
    "category": "FinTech & Web3",
    "shortDesc": "Automate automated identity verification (KYC), sanction screening lists, and compliance reporting.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "KYC / KYB Verification APIs",
      "Sanctions Screening (OFAC)",
      "Automated Suspicious Activity Reports"
    ],
    "stages": [
      {
        "title": "Phase 1: Regulatory Core Fundamentals & Tooling",
        "skills": [
          "KYC / KYB Verification APIs",
          "Sanctions Screening (OFAC)",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Sanctions Screening (OFAC)",
          "Automated Suspicious Activity Reports",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Automated Suspicious Activity Reports",
          "Scalability",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "KYC / KYB Verification APIs",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_181_embedded-systems-software-engineer",
    "slug": "embedded-systems-software-engineer",
    "title": "Embedded Systems Software Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Write bare-metal and real-time C/C++ firmware for resource-constrained microcontrollers.",
    "effortHours": 140,
    "popular": true,
    "skills": [
      "C & C++",
      "Bare-Metal Programming",
      "FreeRTOS",
      "ARM Cortex-M",
      "I2C / SPI / UART",
      "Memory Constraints"
    ],
    "stages": [
      {
        "title": "Phase 1: Embedded Core Fundamentals & Tooling",
        "skills": [
          "C & C++",
          "Bare-Metal Programming",
          "Environment Setup"
        ],
        "effortHours": 31
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Bare-Metal Programming",
          "FreeRTOS",
          "Best Practices"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "FreeRTOS",
          "ARM Cortex-M",
          "Performance Tuning"
        ],
        "effortHours": 39
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "C & C++",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_182_firmware-engineer",
    "slug": "firmware-engineer",
    "title": "Firmware Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Develop secure bootloaders, low-level hardware abstraction layers, and power-saving sleep modes.",
    "effortHours": 135,
    "popular": true,
    "skills": [
      "Secure Bootloaders",
      "Hardware Abstraction (HAL)",
      "Power Profiling",
      "JTAG Debugging",
      "Flash Memory"
    ],
    "stages": [
      {
        "title": "Phase 1: Firmware Core Fundamentals & Tooling",
        "skills": [
          "Secure Bootloaders",
          "Hardware Abstraction (HAL)",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Hardware Abstraction (HAL)",
          "Power Profiling",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Power Profiling",
          "JTAG Debugging",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Secure Bootloaders",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_183_robotics-software-engineer-ros-2",
    "slug": "robotics-software-engineer-ros-2",
    "title": "Robotics Software Engineer (ROS 2)",
    "category": "Hardware & Robotics",
    "shortDesc": "Program autonomous mobile robots, kinematics motion planners, and actuator controls using ROS 2.",
    "effortHours": 150,
    "popular": true,
    "skills": [
      "ROS 2 (Robot Operating System)",
      "C++ & Python",
      "Navigation2 (Nav2)",
      "MoveIt Kinematics",
      "URDF Modeling"
    ],
    "stages": [
      {
        "title": "Phase 1: Robotics Core Fundamentals & Tooling",
        "skills": [
          "ROS 2 (Robot Operating System)",
          "C++ & Python",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "C++ & Python",
          "Navigation2 (Nav2)",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Navigation2 (Nav2)",
          "MoveIt Kinematics",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "ROS 2 (Robot Operating System)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_184_iot-solutions-architect",
    "slug": "iot-solutions-architect",
    "title": "IoT Solutions Architect",
    "category": "Hardware & Robotics",
    "shortDesc": "Design planetary fleets of smart edge devices communicating reliably over MQTT, Cellular, and BLE.",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "MQTT & CoAP",
      "AWS IoT Core / Azure IoT",
      "Bluetooth Low Energy (BLE)",
      "Over-the-Air (OTA) Updates"
    ],
    "stages": [
      {
        "title": "Phase 1: IoT Core Fundamentals & Tooling",
        "skills": [
          "MQTT & CoAP",
          "AWS IoT Core / Azure IoT",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "AWS IoT Core / Azure IoT",
          "Bluetooth Low Energy (BLE)",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Bluetooth Low Energy (BLE)",
          "Over-the-Air (OTA) Updates",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "MQTT & CoAP",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_185_fpga-digital-design-engineer",
    "slug": "fpga-digital-design-engineer",
    "title": "FPGA & Digital Design Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Synthesize high-speed digital logic circuits and hardware accelerators using Verilog and VHDL.",
    "effortHours": 155,
    "popular": false,
    "skills": [
      "Verilog / SystemVerilog",
      "VHDL",
      "AMD Xilinx Vivado",
      "Timing Closure",
      "Digital Signal Processing (DSP)"
    ],
    "stages": [
      {
        "title": "Phase 1: FPGA Core Fundamentals & Tooling",
        "skills": [
          "Verilog / SystemVerilog",
          "VHDL",
          "Environment Setup"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "VHDL",
          "AMD Xilinx Vivado",
          "Best Practices"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "AMD Xilinx Vivado",
          "Timing Closure",
          "Performance Tuning"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Verilog / SystemVerilog",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_186_edge-ai-embedded-specialist",
    "slug": "edge-ai-embedded-specialist",
    "title": "Edge AI Embedded Specialist",
    "category": "Hardware & Robotics",
    "shortDesc": "Optimize and deploy computer vision and audio neural networks on ESP32, STM32, and Raspberry Pi.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "TensorFlow Lite for Microcontrollers",
      "Edge Impulse",
      "INT8 Quantization",
      "Camera Sensors"
    ],
    "stages": [
      {
        "title": "Phase 1: Edge Core Fundamentals & Tooling",
        "skills": [
          "TensorFlow Lite for Microcontrollers",
          "Edge Impulse",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Edge Impulse",
          "INT8 Quantization",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "INT8 Quantization",
          "Camera Sensors",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "TensorFlow Lite for Microcontrollers",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_187_automotive-embedded-engineer",
    "slug": "automotive-embedded-engineer",
    "title": "Automotive Embedded Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Build automotive ECU software compliant with AUTOSAR architecture and ISO 26262 functional safety.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "AUTOSAR Classic / Adaptive",
      "CAN Bus / CAN-FD",
      "ISO 26262 (ASIL D)",
      "Vector CANoe"
    ],
    "stages": [
      {
        "title": "Phase 1: Automotive Core Fundamentals & Tooling",
        "skills": [
          "AUTOSAR Classic / Adaptive",
          "CAN Bus / CAN-FD",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "CAN Bus / CAN-FD",
          "ISO 26262 (ASIL D)",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "ISO 26262 (ASIL D)",
          "Vector CANoe",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "AUTOSAR Classic / Adaptive",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_188_drone-flight-software-engineer",
    "slug": "drone-flight-software-engineer",
    "title": "Drone Flight Software Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Program autonomous UAV flight control loops, obstacle avoidance sensors, and waypoint navigation.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "PX4 Autopilot",
      "ArduPilot",
      "MAVLink Protocol",
      "PID Flight Control Loops",
      "GPS / IMU Navigation"
    ],
    "stages": [
      {
        "title": "Phase 1: Drone Core Fundamentals & Tooling",
        "skills": [
          "PX4 Autopilot",
          "ArduPilot",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "ArduPilot",
          "MAVLink Protocol",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "MAVLink Protocol",
          "PID Flight Control Loops",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PX4 Autopilot",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_189_pcb-design-hardware-engineer",
    "slug": "pcb-design-hardware-engineer",
    "title": "PCB Design & Hardware Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Design multi-layer printed circuit boards with high-speed impedance routing using KiCad or Altium.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "KiCad / Altium Designer",
      "Schematic Capture",
      "High-Speed PCB Routing",
      "BOM Sourcing",
      "DFM Rules"
    ],
    "stages": [
      {
        "title": "Phase 1: PCB Core Fundamentals & Tooling",
        "skills": [
          "KiCad / Altium Designer",
          "Schematic Capture",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Schematic Capture",
          "High-Speed PCB Routing",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "High-Speed PCB Routing",
          "BOM Sourcing",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "KiCad / Altium Designer",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_190_medical-device-embedded-software-engineer",
    "slug": "medical-device-embedded-software-engineer",
    "title": "Medical Device Embedded Software Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Develop life-critical embedded patient monitors following strict FDA IEC 62304 software standards.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "IEC 62304 Compliance",
      "Safety-Critical C",
      "Vital Sensor Telemetry",
      "Traceability Matrices"
    ],
    "stages": [
      {
        "title": "Phase 1: Medical Core Fundamentals & Tooling",
        "skills": [
          "IEC 62304 Compliance",
          "Safety-Critical C",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Safety-Critical C",
          "Vital Sensor Telemetry",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Vital Sensor Telemetry",
          "Traceability Matrices",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "IEC 62304 Compliance",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_191_autonomous-vehicle-navigation-engineer",
    "slug": "autonomous-vehicle-navigation-engineer",
    "title": "Autonomous Vehicle Navigation Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Fuse 3D LiDAR point clouds, radar, and HD maps to navigate self-driving vehicles safely.",
    "effortHours": 160,
    "popular": true,
    "skills": [
      "LiDAR Processing",
      "Extended Kalman Filtering (EKF)",
      "HD Vector Maps",
      "Trajectory Planning"
    ],
    "stages": [
      {
        "title": "Phase 1: Autonomous Core Fundamentals & Tooling",
        "skills": [
          "LiDAR Processing",
          "Extended Kalman Filtering (EKF)",
          "Environment Setup"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Extended Kalman Filtering (EKF)",
          "HD Vector Maps",
          "Best Practices"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "HD Vector Maps",
          "Trajectory Planning",
          "Performance Tuning"
        ],
        "effortHours": 45
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "LiDAR Processing",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_192_industrial-automation-plc-engineer",
    "slug": "industrial-automation-plc-engineer",
    "title": "Industrial Automation & PLC Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Program factory robotic arms, conveyor systems, and SCADA monitoring using Structured Text and PLCs.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Siemens TIA Portal",
      "PLC Structured Text (IEC 61131)",
      "Modbus TCP",
      "SCADA / Ignition"
    ],
    "stages": [
      {
        "title": "Phase 1: Industrial Core Fundamentals & Tooling",
        "skills": [
          "Siemens TIA Portal",
          "PLC Structured Text (IEC 61131)",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "PLC Structured Text (IEC 61131)",
          "Modbus TCP",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Modbus TCP",
          "SCADA / Ignition",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Siemens TIA Portal",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  },
  {
    "id": "c_193_sensor-integration-signal-processing-engineer",
    "slug": "sensor-integration-signal-processing-engineer",
    "title": "Sensor Integration & Signal Processing Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Filter raw accelerometer, gyroscope, and acoustic sensor noise using digital FFT and FIR algorithms.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "Digital Signal Processing (DSP)",
      "FFT Analysis",
      "FIR / IIR Filters",
      "IMU Calibration"
    ],
    "stages": [
      {
        "title": "Phase 1: Sensor Core Fundamentals & Tooling",
        "skills": [
          "Digital Signal Processing (DSP)",
          "FFT Analysis",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "FFT Analysis",
          "FIR / IIR Filters",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "FIR / IIR Filters",
          "IMU Calibration",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Digital Signal Processing (DSP)",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_194_wearable-hardware-low-power-engineer",
    "slug": "wearable-hardware-low-power-engineer",
    "title": "Wearable Hardware & Low-Power Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Engineer micro-watt power management circuits for fitness bands and medical telemetry patches.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "Ultra-Low Power Firmware",
      "Battery Fuel Gauging",
      "Energy Harvesting Circuits",
      "PPG Heart-Rate Sensors"
    ],
    "stages": [
      {
        "title": "Phase 1: Wearable Core Fundamentals & Tooling",
        "skills": [
          "Ultra-Low Power Firmware",
          "Battery Fuel Gauging",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Battery Fuel Gauging",
          "Energy Harvesting Circuits",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Energy Harvesting Circuits",
          "PPG Heart-Rate Sensors",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Ultra-Low Power Firmware",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_195_embedded-linux-systems-engineer",
    "slug": "embedded-linux-systems-engineer",
    "title": "Embedded Linux Systems Engineer",
    "category": "Hardware & Robotics",
    "shortDesc": "Compile customized Linux kernels, device tree overlays, and root filesystems using Yocto Project.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "Yocto Project / OpenEmbedded",
      "Buildroot",
      "Linux Device Drivers",
      "Device Tree (DTS)",
      "U-Boot"
    ],
    "stages": [
      {
        "title": "Phase 1: Embedded Core Fundamentals & Tooling",
        "skills": [
          "Yocto Project / OpenEmbedded",
          "Buildroot",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Buildroot",
          "Linux Device Drivers",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Linux Device Drivers",
          "Device Tree (DTS)",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Yocto Project / OpenEmbedded",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_196_sales-engineer-pre-sales-architect",
    "slug": "sales-engineer-pre-sales-architect",
    "title": "Sales Engineer & Pre-Sales Architect",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Lead persuasive technical demos, build proof-of-concept integrations, and win enterprise deals.",
    "effortHours": 115,
    "popular": true,
    "skills": [
      "Technical Demonstrations",
      "RFP Responses",
      "Proof of Concept (POC) Delivery",
      "Executive Pitching"
    ],
    "stages": [
      {
        "title": "Phase 1: Sales Core Fundamentals & Tooling",
        "skills": [
          "Technical Demonstrations",
          "RFP Responses",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "RFP Responses",
          "Proof of Concept (POC) Delivery",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Proof of Concept (POC) Delivery",
          "Executive Pitching",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Technical Demonstrations",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_197_solutions-consultant",
    "slug": "solutions-consultant",
    "title": "Solutions Consultant",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Guide customer engineering teams through API integration, custom middleware, and production go-live.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "Customer Engineering Guidance",
      "API Integration Middleware",
      "Go-Live Readiness Audits"
    ],
    "stages": [
      {
        "title": "Phase 1: Solutions Core Fundamentals & Tooling",
        "skills": [
          "Customer Engineering Guidance",
          "API Integration Middleware",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "API Integration Middleware",
          "Go-Live Readiness Audits",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Go-Live Readiness Audits",
          "Scalability",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Customer Engineering Guidance",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_198_salesforce-technical-architect",
    "slug": "salesforce-technical-architect",
    "title": "Salesforce Technical Architect",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Build high-scale CRM workflows, Apex enterprise triggers, and Lightning Web Components (LWC).",
    "effortHours": 130,
    "popular": true,
    "skills": [
      "Salesforce Apex",
      "Lightning Web Components (LWC)",
      "SOQL Optimization",
      "Integration Patterns"
    ],
    "stages": [
      {
        "title": "Phase 1: Salesforce Core Fundamentals & Tooling",
        "skills": [
          "Salesforce Apex",
          "Lightning Web Components (LWC)",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Lightning Web Components (LWC)",
          "SOQL Optimization",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "SOQL Optimization",
          "Integration Patterns",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Salesforce Apex",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_199_servicenow-technical-consultant",
    "slug": "servicenow-technical-consultant",
    "title": "ServiceNow Technical Consultant",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Automate enterprise IT workflows, ServiceNow service catalog portals, and REST integrations.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "ServiceNow Scripting",
      "Flow Designer",
      "ITSM / ITOM Modules",
      "Service Portal UX"
    ],
    "stages": [
      {
        "title": "Phase 1: ServiceNow Core Fundamentals & Tooling",
        "skills": [
          "ServiceNow Scripting",
          "Flow Designer",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Flow Designer",
          "ITSM / ITOM Modules",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "ITSM / ITOM Modules",
          "Service Portal UX",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "ServiceNow Scripting",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_200_sap-technical-consultant-abap-developer",
    "slug": "sap-technical-consultant-abap-developer",
    "title": "SAP Technical Consultant & ABAP Developer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Customize SAP S/4HANA core business processes, OData services, and SAP Fiori UI platforms.",
    "effortHours": 135,
    "popular": false,
    "skills": [
      "SAP S/4HANA",
      "ABAP on HANA",
      "OData Services",
      "SAP Fiori / UI5"
    ],
    "stages": [
      {
        "title": "Phase 1: SAP Core Fundamentals & Tooling",
        "skills": [
          "SAP S/4HANA",
          "ABAP on HANA",
          "Environment Setup"
        ],
        "effortHours": 30
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "ABAP on HANA",
          "OData Services",
          "Best Practices"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "OData Services",
          "SAP Fiori / UI5",
          "Performance Tuning"
        ],
        "effortHours": 38
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "SAP S/4HANA",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_201_bioinformatics-software-engineer",
    "slug": "bioinformatics-software-engineer",
    "title": "Bioinformatics Software Engineer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Develop genomic sequencing pipelines, DNA alignment tools, and biological database search engines.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "BioPython",
      "Nextflow / Snakemake",
      "FASTQ / BAM Processing",
      "Genomic Variant Calling",
      "NCBI APIs"
    ],
    "stages": [
      {
        "title": "Phase 1: Bioinformatics Core Fundamentals & Tooling",
        "skills": [
          "BioPython",
          "Nextflow / Snakemake",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Nextflow / Snakemake",
          "FASTQ / BAM Processing",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "FASTQ / BAM Processing",
          "Genomic Variant Calling",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "BioPython",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_202_healthtech-fhir-systems-engineer",
    "slug": "healthtech-fhir-systems-engineer",
    "title": "HealthTech & FHIR Systems Engineer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Build interoperable electronic health records (EHR) integrations using HL7 FHIR and SMART-on-FHIR.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "HL7 FHIR Standards",
      "SMART on FHIR",
      "HIPAA Data Safeguards",
      "Epic / Cerner Interop"
    ],
    "stages": [
      {
        "title": "Phase 1: HealthTech Core Fundamentals & Tooling",
        "skills": [
          "HL7 FHIR Standards",
          "SMART on FHIR",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "SMART on FHIR",
          "HIPAA Data Safeguards",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "HIPAA Data Safeguards",
          "Epic / Cerner Interop",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "HL7 FHIR Standards",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_203_gis-geospatial-software-engineer",
    "slug": "gis-geospatial-software-engineer",
    "title": "GIS & Geospatial Software Engineer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Process spatial raster and vector data, polygon queries, and planetary tile mapping with PostGIS.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "PostGIS Spatial SQL",
      "Mapbox GL / MapLibre",
      "GeoJSON / Shapefiles",
      "GDAL / QGIS",
      "Vector Tiles"
    ],
    "stages": [
      {
        "title": "Phase 1: GIS Core Fundamentals & Tooling",
        "skills": [
          "PostGIS Spatial SQL",
          "Mapbox GL / MapLibre",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Mapbox GL / MapLibre",
          "GeoJSON / Shapefiles",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "GeoJSON / Shapefiles",
          "GDAL / QGIS",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "PostGIS Spatial SQL",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_204_computer-graphics-rendering-engineer",
    "slug": "computer-graphics-rendering-engineer",
    "title": "Computer Graphics & Rendering Engineer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Write low-level Vulkan and DirectX 12 render pipelines for architectural CAD and visualization.",
    "effortHours": 155,
    "popular": false,
    "skills": [
      "Vulkan API",
      "DirectX 12",
      "PBR Shading Models",
      "GPU Memory Management",
      "Spatial Acceleration Structures"
    ],
    "stages": [
      {
        "title": "Phase 1: Computer Core Fundamentals & Tooling",
        "skills": [
          "Vulkan API",
          "DirectX 12",
          "Environment Setup"
        ],
        "effortHours": 34
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "DirectX 12",
          "PBR Shading Models",
          "Best Practices"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "PBR Shading Models",
          "GPU Memory Management",
          "Performance Tuning"
        ],
        "effortHours": 43
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Vulkan API",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 35
      }
    ]
  },
  {
    "id": "c_205_quantum-computing-software-developer",
    "slug": "quantum-computing-software-developer",
    "title": "Quantum Computing Software Developer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Program quantum algorithms, superposition circuits, and noise mitigation using IBM Qiskit.",
    "effortHours": 150,
    "popular": false,
    "skills": [
      "IBM Qiskit",
      "Quantum Circuit Math",
      "Variational Quantum Eigensolver (VQE)",
      "Qubit Noise Mitigation"
    ],
    "stages": [
      {
        "title": "Phase 1: Quantum Core Fundamentals & Tooling",
        "skills": [
          "IBM Qiskit",
          "Quantum Circuit Math",
          "Environment Setup"
        ],
        "effortHours": 33
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Quantum Circuit Math",
          "Variational Quantum Eigensolver (VQE)",
          "Best Practices"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Variational Quantum Eigensolver (VQE)",
          "Qubit Noise Mitigation",
          "Performance Tuning"
        ],
        "effortHours": 42
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "IBM Qiskit",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 33
      }
    ]
  },
  {
    "id": "c_206_edtech-learning-systems-architect",
    "slug": "edtech-learning-systems-architect",
    "title": "EdTech & Learning Systems Architect",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Design interactive educational platforms with LTI standards, automated code autograders, and SCORM.",
    "effortHours": 115,
    "popular": false,
    "skills": [
      "1EdTech LTI 1.3",
      "Automated Code Autograders",
      "Canvas LMS API",
      "Spaced Repetition Algorithms"
    ],
    "stages": [
      {
        "title": "Phase 1: EdTech Core Fundamentals & Tooling",
        "skills": [
          "1EdTech LTI 1.3",
          "Automated Code Autograders",
          "Environment Setup"
        ],
        "effortHours": 25
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "Automated Code Autograders",
          "Canvas LMS API",
          "Best Practices"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Canvas LMS API",
          "Spaced Repetition Algorithms",
          "Performance Tuning"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "1EdTech LTI 1.3",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 26
      }
    ]
  },
  {
    "id": "c_207_cleantech-smart-grid-software-engineer",
    "slug": "cleantech-smart-grid-software-engineer",
    "title": "CleanTech & Smart Grid Software Engineer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Build smart EV charger load balancing, solar battery telemetry, and OpenADR demand response.",
    "effortHours": 130,
    "popular": false,
    "skills": [
      "OpenADR 2.0",
      "OCPP (EV Charging Protocol)",
      "Time-of-Use Energy Algorithms",
      "Smart Meter APIs"
    ],
    "stages": [
      {
        "title": "Phase 1: CleanTech Core Fundamentals & Tooling",
        "skills": [
          "OpenADR 2.0",
          "OCPP (EV Charging Protocol)",
          "Environment Setup"
        ],
        "effortHours": 29
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "OCPP (EV Charging Protocol)",
          "Time-of-Use Energy Algorithms",
          "Best Practices"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Time-of-Use Energy Algorithms",
          "Smart Meter APIs",
          "Performance Tuning"
        ],
        "effortHours": 36
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "OpenADR 2.0",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 29
      }
    ]
  },
  {
    "id": "c_208_audio-dsp-music-software-engineer",
    "slug": "audio-dsp-music-software-engineer",
    "title": "Audio DSP & Music Software Engineer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Create real-time audio VST plugins, synthesizers, and guitar amp simulations using C++ and JUCE.",
    "effortHours": 145,
    "popular": false,
    "skills": [
      "C++ Audio DSP",
      "JUCE Framework",
      "VST3 / AudioUnit Plugins",
      "Filter Design",
      "Ring Buffers"
    ],
    "stages": [
      {
        "title": "Phase 1: Audio Core Fundamentals & Tooling",
        "skills": [
          "C++ Audio DSP",
          "JUCE Framework",
          "Environment Setup"
        ],
        "effortHours": 32
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "JUCE Framework",
          "VST3 / AudioUnit Plugins",
          "Best Practices"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "VST3 / AudioUnit Plugins",
          "Filter Design",
          "Performance Tuning"
        ],
        "effortHours": 41
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "C++ Audio DSP",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 31
      }
    ]
  },
  {
    "id": "c_209_logistics-supply-chain-software-engineer",
    "slug": "logistics-supply-chain-software-engineer",
    "title": "Logistics & Supply Chain Software Engineer",
    "category": "Enterprise & Applied Tech",
    "shortDesc": "Solve vehicle routing problems (VRP), automated warehouse bin allocation, and shipping label APIs.",
    "effortHours": 125,
    "popular": false,
    "skills": [
      "Vehicle Routing Optimization",
      "OR-Tools",
      "Warehouse Inventory Algorithms",
      "FedEx / EasyPost APIs"
    ],
    "stages": [
      {
        "title": "Phase 1: Logistics Core Fundamentals & Tooling",
        "skills": [
          "Vehicle Routing Optimization",
          "OR-Tools",
          "Environment Setup"
        ],
        "effortHours": 28
      },
      {
        "title": "Phase 2: Architecture Patterns & Hands-on Deliverables",
        "skills": [
          "OR-Tools",
          "Warehouse Inventory Algorithms",
          "Best Practices"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 3: Advanced Systems, Integration & Reliability",
        "skills": [
          "Warehouse Inventory Algorithms",
          "FedEx / EasyPost APIs",
          "Performance Tuning"
        ],
        "effortHours": 35
      },
      {
        "title": "Phase 4: Capstone Execution, Portfolio & Interview Readiness",
        "skills": [
          "Vehicle Routing Optimization",
          "System Design",
          "Interview Portfolio"
        ],
        "effortHours": 27
      }
    ]
  }
];

/**
 * Intelligent Blueprint Resolver:
 * Matches from curated database of 200+ careers or dynamically generates
 * an authentic custom 4-phase career roadmap for ANY query!
 */
export function getOrCreateCareerBlueprint(titleOrSlug: string): CareerOption {
  const query = titleOrSlug.trim();
  const normalized = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const exact = comprehensiveCareerCatalog.find(
    (c) =>
      c.slug === normalized ||
      c.title.toLowerCase() === query.toLowerCase()
  );
  if (exact) return exact;

  const partial = comprehensiveCareerCatalog.find((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );
  if (partial) return partial;

  // Determine an intelligent category based on keywords
  let category: CareerCategory = 'Software & Web';
  const qLower = query.toLowerCase();
  if (qLower.includes('ai') || qLower.includes('data') || qLower.includes('machine') || qLower.includes('ml')) {
    category = 'AI & Data Science';
  } else if (qLower.includes('cloud') || qLower.includes('devops') || qLower.includes('sre') || qLower.includes('infra')) {
    category = 'Cloud & DevOps';
  } else if (qLower.includes('security') || qLower.includes('hacker') || qLower.includes('cyber') || qLower.includes('soc')) {
    category = 'Cybersecurity';
  } else if (qLower.includes('mobile') || qLower.includes('ios') || qLower.includes('android') || qLower.includes('flutter')) {
    category = 'Mobile & Multiplatform';
  } else if (qLower.includes('game') || qLower.includes('unity') || qLower.includes('unreal') || qLower.includes('3d')) {
    category = 'Game Dev & 3D';
  } else if (qLower.includes('design') || qLower.includes('ui') || qLower.includes('ux') || qLower.includes('figma')) {
    category = 'UI/UX & Product Design';
  } else if (qLower.includes('product') || qLower.includes('scrum') || qLower.includes('agile') || qLower.includes('manager')) {
    category = 'Product & Agile Leadership';
  } else if (qLower.includes('qa') || qLower.includes('test') || qLower.includes('automation') || qLower.includes('sdet')) {
    category = 'QA & Reliability';
  } else if (qLower.includes('finance') || qLower.includes('fintech') || qLower.includes('trading') || qLower.includes('crypto')) {
    category = 'FinTech & Web3';
  } else if (qLower.includes('robot') || qLower.includes('hardware') || qLower.includes('iot') || qLower.includes('embedded')) {
    category = 'Hardware & Robotics';
  } else if (qLower.includes('sales') || qLower.includes('enterprise') || qLower.includes('sap') || qLower.includes('bio')) {
    category = 'Enterprise & Applied Tech';
  }

  const cleanTitle = query.length > 0 ? query : 'Software Specialist';

  return {
    id: `custom_${normalized}`,
    slug: normalized,
    title: cleanTitle,
    category,
    shortDesc: `Customized professional career roadmap path for ${cleanTitle}.`,
    effortHours: 125,
    skills: ['Core Foundations', 'Domain Architecture', 'Advanced Systems', 'Production Portfolio'],
    stages: [
      {
        title: `Phase 1: ${cleanTitle} Fundamentals & Core Tooling`,
        skills: ['Core Principles', 'Tooling Setup', 'Standard Libraries'],
        effortHours: 28,
      },
      {
        title: `Phase 2: Architecture Patterns & Hands-on Projects`,
        skills: ['Design Patterns', 'Project Milestones', 'Data Modeling'],
        effortHours: 35,
      },
      {
        title: `Phase 3: Advanced Systems, Scalability & Security`,
        skills: ['Scalability', 'Performance', 'Automated Verification'],
        effortHours: 35,
      },
      {
        title: `Phase 4: Capstone Delivery & Interview Readiness`,
        skills: ['Portfolio Delivery', 'Interview Preparation', 'CI/CD Deployment'],
        effortHours: 27,
      },
    ],
  };
}
