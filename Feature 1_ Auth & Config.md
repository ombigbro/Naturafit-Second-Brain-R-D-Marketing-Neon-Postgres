# **Feature Specification 1: Authentication, RBAC & Global Configuration**

| Attribute | Details |
| :---- | :---- |
| **Document Status** | Approved |
| **Tech Lead / Architect** | Vibe Coder |

## **1\. Executive Summary & Objective**

Establishes the foundational security and global configuration layer. Implements Role-Based Access Control (RBAC) separating Super Admins from standard Admins. It provides a Super Admin interface to configure global AI API keys, upload the Master Pitch Deck template, manage system server storage (wiping data), and crucially, **manage dynamic AI System Prompts for all 4 phases**.

## **2\. User Flows & Decision Flow**

\[Login\] \--\> If Super Admin \--\> \[Redirect to Global Dashboard (Projects \+ Settings)\]

\--\> In Settings: \[Update API Keys\] | \[Update Phase 1-4 Prompts\] | \[Upload Template\] | \[Wipe Storage Data\]

## **3\. Functional Specifications & System Rules**

* **Dynamic Prompts:** The system must include 4 distinct large text areas in the Settings UI for the Super Admin to input the system prompt for Phase 1, Phase 2, Phase 3, and Phase 4\. All AI calls in the app must fetch these strings from the DB before executing.  
* **Storage Management:** Super Admin endpoint to forcefully delete all or selected project files from server storage.  
* **RBAC:** Admin accounts automatically inherit the API keys and AI Prompts set by the Super Admin.

## **4\. UI States & Edge Cases**

* **Settings Dashboard:** Divided into sections: "API Configurations", "Dynamic AI Prompts (Phase 1-4)", "Master Templates", and a red "Danger Zone" for Data Wiping.

## **5\. Technical Design Requirements**

* **Database Schema (GlobalSettings additions):**  
  * phase\_1\_prompt (Text)  
  * phase\_2\_prompt (Text)  
  * phase\_3\_prompt (Text)  
  * phase\_4\_prompt (Text)

## **6\. Implementation Task List 1: Auth & Config**

| Task ID | Discipline | Task Description | Dependencies | Status |
| :---- | :---- | :---- | :---- | :---- |
| AUTH-1 | Backend | Scaffold DB schema (Users, Projects, Settings with dynamic prompt fields). | None | To Do |
| AUTH-2 | Backend | Create CRUD endpoints for Global Settings including Prompts and Wipe logic. | AUTH-1 | To Do |
| AUTH-3 | Frontend | Build Super Admin Settings page including Prompt textareas and Wipe button. | AUTH-2 | To Do |

