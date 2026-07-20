# **Feature Specification 2: Phase 1 \- AI Data Pipeline & Visual Dashboard**

| Attribute | Details |
| :---- | :---- |
| **Document Status** | Approved |

## **1\. Executive Summary & Objective**

Handles the ingestion of raw Kalodata files (XLSX/CSV), leveraging an AI pipeline—governed strictly by the Super Admin's dynamic Phase 1 prompt—to clean, deduplicate, and categorize products based on BPOM status. Outputs to interactive visual charts and tables.

## **2\. Functional Specifications & System Rules**

* **Dynamic AI Prompt Injection:** The backend must fetch GlobalSettings.phase\_1\_prompt and inject it as the system message before passing the parsed CSV data to the LLM.  
* **AI Cleaning & Deduplication:** AI scans and retains ONLY BPOM TR/MD products, aggregates revenue, and categorizes by claim.  
* **State Management:** Final result is saved to Projects.phase\_1\_state.

## **3\. UI States & Edge Cases**

* **Active State:**  
  * Pie Chart 1: Revenue by Category.  
  * Pie Chart 2: Product Count by Category.  
  * Top 10 Table: Includes Category Dropdown, Total Sum of the active category, and target="\_blank" TikTok Shop links.

## **4\. Implementation Task List 2: Phase 1 Data Pipeline**

| Task ID | Discipline | Task Description | Dependencies | Status |
| :---- | :---- | :---- | :---- | :---- |
| P1-1 | Backend | Build file upload endpoint & XLSX/CSV parser. | AUTH-2 | Done |
| P1-2 | AI Logic | Implement DB fetch for phase\_1\_prompt and execute LangChain/AI pipeline for cleaning & categorizing. | P1-1 | Done |
| P1-3 | Frontend | Build Top 10 Data Table with Category Dropdown, Total Sum, & Clickable Links, plus Pie Charts. | None | Done |
| P1-4 | Backend | Save final JSON payload to phase\_1\_state. | P1-2 | Done |

