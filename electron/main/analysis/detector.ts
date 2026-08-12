import { promises as fs } from "fs";
import path from "path";
import { TechStack } from "./types";

const TECH_INDICATORS: Array<{
  file: string;
  match?: string;
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  patterns?: string[];
}> = [
  { file: "package.json", languages: ["JavaScript", "TypeScript"] },
  { file: "tsconfig.json", languages: ["TypeScript"] },
  { file: "requirements.txt", languages: ["Python"] },
  { file: "Pipfile", languages: ["Python"] },
  { file: "pyproject.toml", languages: ["Python"] },
  { file: "Cargo.toml", languages: ["Rust"] },
  { file: "pom.xml", languages: ["Java"], tools: ["Maven"] },
  { file: "build.gradle", languages: ["Java", "Kotlin"], tools: ["Gradle"] },
  { file: "go.mod", languages: ["Go"] },
  { file: "composer.json", languages: ["PHP"] },
  { file: "Gemfile", languages: ["Ruby"] },
  { file: "*.csproj", languages: ["C#"] },
  { file: "*.sln", languages: ["C#"] },
  { file: "Dockerfile", tools: ["Docker"] },
  { file: "docker-compose.yml", tools: ["Docker Compose"] },
  { file: "docker-compose.yaml", tools: ["Docker Compose"] },
  { file: ".github/workflows", tools: ["GitHub Actions"] },
  { file: "serverless.yml", patterns: ["Serverless"] },
  { file: "serverless.yaml", patterns: ["Serverless"] },
  { file: "lerna.json", patterns: ["Monorepo (Lerna)"] },
  { file: "turbo.json", patterns: ["Monorepo (Turborepo)"] },
  { file: "nx.json", patterns: ["Monorepo (Nx)"] },
  { file: ".eslintrc", tools: ["ESLint"] },
  { file: ".eslintrc.js", tools: ["ESLint"] },
  { file: ".eslintrc.json", tools: ["ESLint"] },
  { file: "jest.config.js", tools: ["Jest"] },
  { file: "jest.config.ts", tools: ["Jest"] },
  { file: "vitest.config.ts", tools: ["Vitest"] },
  { file: "vite.config.ts", tools: ["Vite"] },
  { file: "vite.config.js", tools: ["Vite"] },
  { file: "webpack.config.js", tools: ["Webpack"] },
  { file: "next.config.js", frameworks: ["Next.js"] },
  { file: "next.config.ts", frameworks: ["Next.js"] },
  { file: "nuxt.config.ts", frameworks: ["Nuxt.js"] },
  { file: "svelte.config.js", frameworks: ["SvelteKit"] },
  { file: "astro.config.mjs", frameworks: ["Astro"] },
  { file: "remix.config.js", frameworks: ["Remix"] },
  { file: ".env", tools: ["dotenv"] },
  { file: "prisma/schema.prisma", tools: ["Prisma"] },
  { file: "drizzle.config.ts", tools: ["Drizzle ORM"] },
];

const PACKAGE_FRAMEWORKS: Record<string, { frameworks?: string[]; tools?: string[]; patterns?: string[] }> = {
  react: { frameworks: ["React"] },
  "react-native": { frameworks: ["React Native"] },
  next: { frameworks: ["Next.js"] },
  nuxt: { frameworks: ["Nuxt.js"] },
  vue: { frameworks: ["Vue.js"] },
  angular: { frameworks: ["Angular"] },
  svelte: { frameworks: ["Svelte"] },
  "@remix-run/react": { frameworks: ["Remix"] },
  astro: { frameworks: ["Astro"] },
  express: { frameworks: ["Express.js"] },
  fastify: { frameworks: ["Fastify"] },
  hono: { frameworks: ["Hono"] },
  koa: { frameworks: ["Koa"] },
  nestjs: { frameworks: ["NestJS"] },
  "@nestjs/core": { frameworks: ["NestJS"] },
  electron: { frameworks: ["Electron"] },
  tauri: { frameworks: ["Tauri"] },
  django: { frameworks: ["Django"] },
  flask: { frameworks: ["Flask"] },
  fastapi: { frameworks: ["FastAPI"] },
  "spring-boot": { frameworks: ["Spring Boot"] },
  laravel: { frameworks: ["Laravel"] },
  rails: { frameworks: ["Ruby on Rails"] },
  prisma: { tools: ["Prisma ORM"] },
  drizzle: { tools: ["Drizzle ORM"] },
  mongoose: { tools: ["Mongoose (MongoDB)"] },
  typeorm: { tools: ["TypeORM"] },
  sequelize: { tools: ["Sequelize"] },
  "socket.io": { tools: ["Socket.IO"] },
  graphql: { tools: ["GraphQL"] },
  "@apollo/server": { tools: ["Apollo GraphQL"] },
  trpc: { tools: ["tRPC"] },
  "@trpc/server": { tools: ["tRPC"] },
  jest: { tools: ["Jest"] },
  vitest: { tools: ["Vitest"] },
  cypress: { tools: ["Cypress"] },
  playwright: { tools: ["Playwright"] },
  tailwindcss: { tools: ["Tailwind CSS"] },
  vite: { tools: ["Vite"] },
  webpack: { tools: ["Webpack"] },
  redis: { tools: ["Redis"] },
  "aws-sdk": { tools: ["AWS SDK"] },
};

const ARCH_PATTERNS: Array<{ dirs: string[]; pattern: string }> = [
  { dirs: ["controllers", "models", "views"], pattern: "MVC" },
  { dirs: ["controllers", "services", "repositories"], pattern: "Layered Architecture" },
  { dirs: ["routes", "middleware", "handlers"], pattern: "REST API" },
  { dirs: ["graphql", "resolvers", "schema"], pattern: "GraphQL API" },
  { dirs: ["packages", "apps"], pattern: "Monorepo" },
  { dirs: ["functions", "handlers"], pattern: "Serverless / Functions" },
  { dirs: ["components", "pages", "hooks"], pattern: "Component-based Frontend (React/Vue)" },
  { dirs: ["src", "tests", "docs"], pattern: "Standard Library/Package" },
  { dirs: ["domain", "application", "infrastructure"], pattern: "Domain-Driven Design (DDD)" },
  { dirs: ["cmd", "internal", "pkg"], pattern: "Go Standard Layout" },
  { dirs: ["microservices", "services", "gateway"], pattern: "Microservices" },
];

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJsonSafe(p: string): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(p, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function detectTechStack(projectPath: string): Promise<TechStack> {
  const stack: TechStack = {
    languages: [],
    frameworks: [],
    tools: [],
    patterns: [],
  };

  const addUnique = (arr: string[], items: string[] | undefined) => {
    if (!items) return;
    for (const item of items) {
      if (!arr.includes(item)) arr.push(item);
    }
  };

  for (const indicator of TECH_INDICATORS) {
    const full = path.join(projectPath, indicator.file);
    if (indicator.file.includes("*")) {
      try {
        const dir = path.dirname(full);
        const ext = path.extname(indicator.file).slice(1);
        const entries = await fs.readdir(dir).catch(() => []);
        const found = entries.some((e) => e.endsWith(`.${ext}`));
        if (found) {
          addUnique(stack.languages, indicator.languages);
          addUnique(stack.frameworks, indicator.frameworks);
          addUnique(stack.tools, indicator.tools);
          addUnique(stack.patterns, indicator.patterns);
        }
      } catch {}
    } else {
      if (await fileExists(full)) {
        addUnique(stack.languages, indicator.languages);
        addUnique(stack.frameworks, indicator.frameworks);
        addUnique(stack.tools, indicator.tools);
        addUnique(stack.patterns, indicator.patterns);
      }
    }
  }

  const pkgJson = await readJsonSafe(path.join(projectPath, "package.json"));
  const allDeps = {
    ...((pkgJson.dependencies as Record<string, string>) ?? {}),
    ...((pkgJson.devDependencies as Record<string, string>) ?? {}),
  };

  for (const [dep, meta] of Object.entries(PACKAGE_FRAMEWORKS)) {
    if (dep in allDeps) {
      addUnique(stack.frameworks, meta.frameworks);
      addUnique(stack.tools, meta.tools);
      addUnique(stack.patterns, meta.patterns);
    }
  }

  try {
    const entries = await fs.readdir(projectPath);
    const dirs = new Set(entries);
    for (const { dirs: required, pattern } of ARCH_PATTERNS) {
      const matchCount = required.filter((d) => dirs.has(d)).length;
      if (matchCount >= 2) {
        addUnique(stack.patterns, [pattern]);
      }
    }
  } catch {}

  return stack;
}
