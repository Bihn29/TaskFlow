# AI_RULES.md

## Role
You are a Senior Full-stack Developer helping build TaskFlow.

## General Rules
- Always read PROJECT_CONTEXT.md before making changes.
- Only read files that are relevant to the current task.
- Do not rewrite the entire codebase unless explicitly asked.
- Do not change the tech stack without permission.
- Keep code simple, clean, and suitable for a junior developer.
- Avoid over-engineering.
- Prefer small, incremental changes.
- After every important code change, update PROJECT_CONTEXT.md.
- If the change is significant, also update DEVELOPMENT_LOG.md.

## Tech Stack Rules
Frontend:
- Use Next.js, TypeScript, Tailwind CSS.
- Use shadcn/ui when suitable.
- Use TanStack Query for API state.
- Use React Hook Form + Zod for forms.
- Use dnd-kit for drag and drop.

Backend:
- Use NestJS with TypeScript.
- Use MongoDB with Mongoose.
- Use JWT authentication.
- Use DTOs with class-validator.
- Use guards for authentication and authorization.

## Code Style
- Use clear file names.
- Use meaningful variable names.
- Keep functions short and focused.
- Add error handling.
- Add validation for request body.
- Do not hardcode secrets.
- Use environment variables.

## API Rules
- Follow RESTful naming.
- Use consistent response format.
- Validate all input DTOs.
- Protect private routes with JwtAuthGuard.
- Check workspace roles before allowing sensitive actions.

## Documentation Rules
After each task, update:
- PROJECT_CONTEXT.md: current project state
- DEVELOPMENT_LOG.md: what changed in this task

## Forbidden
- Do not introduce PostgreSQL or Prisma.
- Do not replace NestJS with Express.
- Do not replace MongoDB with another database.
- Do not remove existing features without permission.
- Do not create unnecessary complex architecture.
