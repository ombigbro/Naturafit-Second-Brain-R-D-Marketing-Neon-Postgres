# **PRODUCT REQUIREMENT DOCUMENT (PRD)**

## **1\. Executive Summary & Document Control**

* **Product Name:** Second Brain R\&D Marketing  
* **Target Release Date:** Q3 2026  
* **Author(s):** AI Product Manager & Business Analyst  
* **Status:** Approved

## **2\. Objectives & Success Metrics**

### **Problem Statement**

Conducting product research, competitor analysis, and brand strategy formulation for TikTok Shop products is a highly manual, fragmented, and time-consuming process. Marketers struggle to synthesize raw data, analyze market gaps, brainstorm formulations, generate branding visuals, and compile them into a cohesive pitch deck without losing context.

### **Business Objective**

To build an end-to-end, AI-assisted web application that automates e-commerce data processing, acts as a strategic sparring partner to formulate product strategies, generates 2D/3D brand assets, and outputs an investor-ready Pitch Deck (PDF) based on a master template. Crucially, the AI's behavior and persona are fully dynamically controlled by the Super Admin to allow agile prompt tuning without code deployments.

### **Success Metrics (KPIs)**

* **Processing Accuracy:** 100% accurate AI filtration of BPOM TR/MD certified products and accurate data aggregation (deduplication) from uploaded files.  
* **AI Context Retention:** 100% context retention across all 4 phases using strict JSON state management (zero hallucination).  
* **Time to Value:** Reduce the end-to-end R\&D and Pitch Deck creation process from weeks to under 2 hours.

## **3\. Target Audience & User Personas**

* **Super Admin:** Has full global CRUD access across the entire platform (all projects, all admins). Exclusively manages AI API settings (Model selection for Data/Research and Image Generation), uploads the Master Pitch Deck Template, and **configures the specific AI System Prompts (Personas/Instructions) for all 4 phases** via text input fields. Can also wipe all server storage data based on project.  
* **Admin:** Has limited CRUD access restricted solely to the projects they create. Cannot view other users' projects or modify global configurations. Automatically inherits the AI personas set by the Super Admin.

## **4\. User Journey & Process Flow**

### **Happy Path (Optimal Flow)**

**Pre-requisite:** Super Admin configures AI API keys, selected AI models, uploads the Master Pitch Deck Template, and fills in the AI System Prompts for Phase 1, 2, 3, and 4 in the Global Settings. Admin logs in and creates a new Project.

* **Phase 1: Data Ingestion & Visualization**  
  1. User uploads raw Kalodata files (XLSX/CSV) containing product name, launch date, avg unit price, and 30-day revenue.  
  2. System fetches Super Admin's Phase 1 AI Prompt. AI cleans data (BPOM TR/MD filtering), deduplicates and merges identical products (differing only by title, size, variant), and categorizes products by benefit/claim.  
  3. System renders 2 Pie Charts (Revenue/Count) and a Top 10 Table with Category Dropdown, Data Sum, and clickable external links.  
  4. *System saves Phase 1 state as JSON.*  
* **Phase 2: Strategic Research & Competitor Analysis**  
  1. User selects a focus category/product or chats with the AI based on Phase 1 data.  
  2. System fetches Super Admin's Phase 2 AI Prompt. AI acts as a sparring partner (using web browsing & Phase 1 data) to suggest primary/derivative formulations and target market.  
  3. AI recommends Top 3 competitors based on the agreed strategy.  
  4. User uploads 3-sheet competitor data (Affiliators, Videos, Live Sessions).  
  5. System visualizes competitor analysis.  
  6. User clicks **"Lock Strategy & Start Branding"**.  
  7. *System saves Phase 2 state as JSON.*  
* **Phase 3: Brand Book & Visual Generation**  
  1. System fetches Super Admin's Phase 3 AI Prompt. AI brainstorms product names.  
  2. AI proposes a visual concept based on product name, composition, benefits, competitor style, and user preference.  
  3. AI generates 2D packaging, user approves. AI generates 3D packaging with a plain background, user approves.  
  4. User approves the final assets.  
  5. *System saves Phase 3 state as JSON.*  
* **Phase 4: Pitch Deck Generation**  
  1. System fetches Super Admin's Phase 4 AI Prompt and the Master Template.  
  2. AI compiles JSON contexts from Phases 1, 2, and 3 into the specific Pitch Deck slides.  
  3. AI strictly follows the template structure to generate a comprehensive Pitch Deck mapping (Market Opportunity, Brand Strategy & Identity, Competitive Landscape).  
  4. User downloads the final Pitch Deck PDF.

### **Alternative/Error Paths**

* **AI Hallucination/Out-of-Bound Context:** If AI cannot find data within the uploaded files or verified web browsing, it must explicitly state "Data unavailable" instead of hallucinating.  
* **Invalid File Upload:** If the Kalodata or Competitor upload format is incorrect/missing sheets, the system halts and prompts the user with an exact error message and a downloadable correct CSV template.

## **5\. Functional Requirements**

| ID | Feature | Description | Priority |
| :---- | :---- | :---- | :---- |
| CFG-01 | Global Settings & Dynamic Prompts | Super Admin UI to set API keys, upload Pitch Deck Template, and define specific AI System Prompts (textareas) for Phase 1, 2, 3, and 4\. | P0 |
| AUTH-01 | Login & RBAC | Secure login page with Super Admin and Admin role separation. | P0 |
| P1-01 | AI Data Pipeline | AI-powered parser for XLSX/CSV, regex/logic for BPOM TR/MD filtering, and intelligent product deduplication based on dynamic prompt. | P0 |
| P1-02 | Dashboard Visuals | Render 2 Pie Charts and a Top 10 Data Table with dropdown filter, total sum, and clickable links. | P0 |
| P2-01 | AI Sparring Chat | Context-aware chat utilizing web browsing, Phase 1 JSON context, and the Super Admin's Phase 2 persona prompt. | P0 |
| P2-02 | Competitor Ingestion | Multi-sheet parser for Competitor Affiliates, Videos, and Live Streams. | P0 |
| P3-01 | Image Generation | Integration with Image Gen API to produce 2D packaging and 3D mockups. | P1 |
| P4-01 | PDF Export Engine | Map aggregated JSON states into the Super Admin's uploaded Pitch Deck template and export as PDF. | P0 |
| SYS-01 | Context State Engine | Generate and store exhaustive JSON summaries at the end of Phases 1, 2, and 3 to bypass LLM token limits. | P0 |

## **6\. Non-Functional Requirements**

* **AI Constraints (Anti-Hallucination):** AI must strictly base arguments and formulation suggestions on the uploaded datasets and active web browsing. It must critically challenge the user if the user's conclusions contradict the data. Prompts dictating this behavior are stored in the database, allowing live tweaking.  
* **Context Management Architecture:** Database-backed JSON state management system between phases. The AI in Phase 4 must only read the finalized JSON variables.  
* **Storage Wipe:** Super Admin must have a dedicated action to wipe all local/S3 server data or wipe based on project/user.  
* **Security:** Project data must be strictly isolated via user\_id. Admins cannot access endpoints belonging to other projects except super admin.

##  **7\. Out of Scope (Future Phases)**

* Direct API integration with Kalodata or TikTok Shop (manual file upload is required for this phase).  
* Mobile application development (Platform is Web-App prioritized for Desktop use).  
* Automated video generation for marketing.