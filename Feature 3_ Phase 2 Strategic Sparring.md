# **Feature Specification 3: Phase 2 \- Strategic Sparring & Competitor Ingestion**

| Attribute | Details |
| :---- | :---- |
| **Document Status** | Approved |

## **1\. Executive Summary & Objective**

Empowers the user to chat with a context-aware AI. The AI's persona, strictness, and formulation guidelines are dictated entirely by the Super Admin's dynamic Phase 2 prompt. Followed by competitor data upload and a "Lock Strategy" trigger.

## **2\. Functional Specifications & System Rules**

* **Dynamic AI Sparring:** The Chat API must prepend GlobalSettings.phase\_2\_prompt along with phase\_1\_state JSON into the LLM context.  
* **Formulation Logic:** As defined in the prompt, AI explicitly suggests primary and derivative ingredients.  
* **Locking Mechanism:** "Lock Strategy & Start Branding" button compiles a JSON summary and saves it to Projects.phase\_2\_state.

## **3\. Implementation Task List 3: Phase 2 Strategy & Ingestion**

| Task ID | Discipline | Task Description | Dependencies | Status |
| :---- | :---- | :---- | :---- | :---- |
| P2-1 | AI Logic | Configure AI chat endpoint to fetch phase\_2\_prompt, inject phase\_1\_state, and enable Web Browsing. | P1-4 | To Do |
| P2-2 | Backend | Build multi-sheet Excel parser for Competitor files (Affiliator, Videos, Live). | None | To Do |
| P2-3 | Frontend | Build Chat UI, Competitor Dashboard, and Lock Strategy trigger. | P2-2 | To Do |
| P2-4 | Backend | Save final compiled state to phase\_2\_state JSON. | P2-1 | To Do |

