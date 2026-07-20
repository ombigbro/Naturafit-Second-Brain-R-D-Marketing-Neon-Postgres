# Tasks

- [x] Initialize the Next.js App Router project
    - [x] Temporarily move MD files to prevent create-next-app conflicts
    - [x] Run create-next-app in the workspace directory
    - [x] Restore the MD files
- [x] Install and configure project dependencies
    - [x] Install Prisma, bcryptjs, jsonwebtoken, cookie, etc.
    - [x] Set up Tailwind CSS and shadcn/ui foundation
- [x] Database Setup (Prisma)
    - [x] Create `prisma/schema.prisma` with User, GlobalSettings, and Project models
    - [x] Create a seeding script to populate default Admin, Super Admin, and initial prompt settings
- [x] Backend API Implementation
    - [x] Create auth API routes (`/api/auth/login`, `/api/auth/me`, `/api/auth/logout`)
    - [x] Create global settings API routes (`/api/settings`)
    - [x] Create wipe storage API route (`/api/settings/wipe`)
- [x] Frontend Pages & Components
    - [x] Set up premium styling and custom CSS variables
    - [x] Create the login page with custom UI/animations
    - [x] Create the Super Admin Settings Dashboard UI
    - [x] Build the layout navigation structure with role-based visibility
- [x] Verification & Build
    - [x] Validate Prisma schemas and run typescript compilation checks
    - [x] Build the application and run sanity tests
- [x] Feature 2: Phase 1 Data Ingestion & Visualization
    - [x] Install `xlsx` package to enable CSV/XLSX parsing
    - [x] Implement dynamic project detail routes `GET` and `DELETE` at `src/app/api/projects/[id]/route.ts` with role-based access
    - [x] Build Phase 1 processing pipeline `POST` and `DELETE` at `src/app/api/projects/[id]/phase1/route.ts` with column matching and TikTok link extraction
    - [x] Write offline rule-based cleaning & categorization fallback for demo stability
    - [x] Create project workspace page `src/app/projects/[id]/page.tsx` showing metrics, charts, Top 10 table, and category filters
    - [x] Store and serve the Excel spreadsheet template at `public/Kalodata_Template.xlsx` and add download action to the UI
    - [x] Verify compilation, types, and browser flow using Playwright/browser agent
- [x] Feature 3: Phase 2 Strategic Sparring & Competitor Ingestion
    - [x] Create competitor spreadsheet template inside `public/Competitor_Template.xlsx`
    - [x] Build backend API route for context-aware AI chat with `search_web` tool integration and local simulation fallback
    - [x] Build multi-sheet Excel competitor parser (Affiliators, Videos, Lives) with data aggregation
    - [x] Create lock API and reset endpoint for Phase 2 strategy state
    - [x] Build premium double-column Tabbed workspace UI for strategic chat & competitor dashboard
    - [x] Verify type compiler correctness with direct node execution
- [x] Feature 4: Phase 3 Brand Book & 2D/3D Asset Generation
    - [x] AI Logic: Build name brainstorming logic using `phase_3_prompt` and Phase 2 JSON
    - [x] Backend: Integrate Image Generation API (DALL-E 3) and save files to server storage (`/api/projects/[id]/phase3/generate`)
    - [x] Frontend: Build Image Gallery UI with Approve/Regenerate loops in the Phase 3 tab
    - [x] Backend: Save final Name, Aesthetics, and Asset URLs into `phase_3_state`
- [x] Feature 5: Phase 4 Pitch Deck PDF Export
    - [x] Backend: Compiler function to merge Phase 1, 2, and 3 JSON states
    - [x] AI Logic: Inject `phase_4_prompt` and mapped JSON into Template Schema
    - [x] Backend: Integrate PDF generation library and build export endpoint
    - [x] Frontend: Build "Review & Download PDF" UI

---

## **Developer Scratchpad & Handoff Notes**

### **1. Session Summary (Phase 4 Completed)**
We completed the **Phase 4: Pitch Deck PDF Export** feature flow.
- The user can trigger the compilation of the Pitch Deck based on Locked Phase 1, 2, and 3 states.
- The system merges the BPOM products lists, custom ingredients formulation parameters, competitor GMV analytics, and approved brand book packaging layouts and mockup URLs.
- The system calls the OpenAI Chat Completions API with the Super Admin's `phase_4_prompt` to generate slide structure, falling back to a structured offline compiler if no API key is set.
- The system generates a high-quality landscape A4 PDF containing cover layout, opportunity size metrics, formulation demographics, competitor GMV charts/tables, and side-by-side approved packaging assets (2D label and 3D mockup).
- In the frontend, an interactive slide selector allows slide-by-slide text review alongside a live browser-native PDF preview window inside an `<iframe>`.

### **2. Technical Reference & Implemented APIs**
- **Phase 4 Compile Route**: `POST /api/projects/[id]/phase4/compile`
  - Merges Phase 1, 2, 3 states, runs AI mapping, and saves slides content to `phase_4_state` in the database.
- **Phase 4 Export PDF Route**: `GET /api/projects/[id]/phase4/export`
  - Reads `phase_4_state` and returns a binary PDF stream generated via `pdfkit`. Resolves and embeds approved local 2D and 3D assets on the showcase slide.
- **Phase 4 Reset Route**: `DELETE /api/projects/[id]/phase4`
  - Clears `phase_4_state` to allow re-compilation.

### **3. Competitor Analysis Insights (from `Creator data.xlsx`)**
- **Market Focus**: *Teh Rimpang* (traditional herbal tea containing Jahe, Kunyit, Lengkuas, Sereh).
- **Creator Sales Dominance**: Micro-influencer `@srisularni2` is the top seller overall (Rp 288.9M GMV), heavily leveraging 3-hour daily livestreams (accounting for 96% of her sales). Mega-influencer `@vazoahmad` (4.2M followers) generated Rp 231M GMV, driven by a viral video with 4.7M views (ROAS of 3.04).
- **Channel Strategy**: Videos serve as awareness and ad scaling funnels (ROAS ~3.1), while daily multi-hour live streams serve as key conversion closers.

### **4. Instructions for next AI Session**
All planned features (Features 1 through 5) are 100% completed, fully type-safe, compile correctly, and are verified by TypeScript build runs. Ready for deployment and production launch!


