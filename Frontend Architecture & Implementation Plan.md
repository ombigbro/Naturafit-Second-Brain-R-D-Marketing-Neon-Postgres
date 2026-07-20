# **Frontend Architecture & Implementation Plan**

## **1\. Core Frontend Stack & Libraries**

* **Framework:** Next.js (App Router)  
* **Styling:** Tailwind CSS \+ shadcn/ui  
* **State Management:** Zustand  
* **Data Fetching:** React Query

## **2\. Phase-by-Phase UI Specifications**

### **A. Authentication & Global Config (Settings Dashboard)**

* **Super Admin Settings Page:**  
  * **API Keys Section:** Forms for AI Text & Image models.  
  * **Master Template:** File dropzone for .pptx/.pdf.  
  * **Dynamic AI Prompts Section:** Four distinct \<textarea\> blocks (min-height 200px) labeled:  
    1. *System Prompt \- Phase 1 (Data Analyst Persona)*  
    2. *System Prompt \- Phase 2 (Strategy Sparring Persona)*  
    3. *System Prompt \- Phase 3 (Brand Brainstorm Persona)*  
    4. *System Prompt \- Phase 4 (Pitch Deck Compiler Persona)*  
  * **Danger Zone:** "Wipe All Storage Data" button with double confirmation.

### **B. Phase 1: Data Pipeline Dashboard**

* **UI Components:**  
  * Loading State with progress text.  
  * CategoryDropdown: Switches context for the table.  
  * Top10Table: Shows Name, Revenue, Units, Clickable TikTok Links. Displays **Total Sum** of selected category at bottom.  
  * Two Pie Charts (Revenue & Count).

### **C. Phase 2: Strategic Sparring**

* Split Layout: AI Chat on left (driven by dynamic prompt), Phase 1 Context on right.  
* Competitor Visual Dashboard rendering multi-sheet Excel data.  
* "Lock Strategy" button.

### **D. Phase 3 & 4: Branding & Export**

* 2D & 3D Image gallery with approval flows.  
* PDF \<iframe\> previewer and Download button for final Pitch Deck.