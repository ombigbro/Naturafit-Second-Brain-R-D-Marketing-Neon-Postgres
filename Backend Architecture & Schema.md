# **Backend Architecture & Database Schema Plan**

## **1\. Core Backend Architecture**

* **Runtime/Framework:** Node.js (Next.js API Routes).  
* **Database:** PostgreSQL (using JSONB for states).  
* **ORM:** Prisma.  
* **Storage:** Server-side local directory or S3 bucket.

## **2\. Database Schema (Prisma Format / ERD)**

### **Table: GlobalSettings**

*Accessed and modified only by the Super Admin. This is the Source of Truth for all AI behaviors across the platform.*

* id (Int, PK, Default: 1\)  
* ai\_text\_key (String, Encrypted)  
* ai\_text\_model (String)  
* ai\_image\_key (String, Encrypted)  
* ai\_image\_model (String)  
* master\_template\_url (String, Nullable)  
* **phase\_1\_prompt** (Text) \-\> *AI instructions for data cleaning & categorization*  
* **phase\_2\_prompt** (Text) \-\> *AI instructions for formulation sparring & debate*  
* **phase\_3\_prompt** (Text) \-\> *AI instructions for brand naming & visuals*  
* **phase\_4\_prompt** (Text) \-\> *AI instructions for Pitch Deck mapping*

### **Table: Projects**

*Stores the entire JSON State for each phase.*

* id (UUID, PK)  
* admin\_id (UUID, FK)  
* phase\_1\_state (JSONB, Nullable)  
* phase\_2\_state (JSONB, Nullable)  
* phase\_3\_state (JSONB, Nullable)

## **3\. API Logic: Dynamic Prompt Injection**

Every time an API endpoint calls the LLM model (e.g., POST /api/projects/:id/phase2/chat), the backend **MUST** first query the GlobalSettings table, retrieve the text from the corresponding prompt column (e.g., phase\_2\_prompt), and inject it as the role: "system" parameter in the request to OpenAI/Anthropic.