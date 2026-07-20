# **Feature Specification 5: Phase 4 \- Pitch Deck PDF Export**

| Attribute | Details |
| :---- | :---- |
| **Document Status** | Approved |

## **1\. Executive Summary & Objective**

Extracts Phase 1, 2, and 3 JSON contexts, mapping them against the Super Admin's Master Template. The strictly enforced mapping rules and tone are governed by the Super Admin's Phase 4 dynamic prompt.

## **2\. Functional Specifications & System Rules**

* **Dynamic Compiler Prompt:** Fetch GlobalSettings.phase\_4\_prompt instructing the LLM precisely how to map the JSON keys to the template slides without inventing new ones.  
* **PDF Engine:** Converts mapped data \+ 2D/3D mockups into a high-quality PDF.

## **3\. Implementation Task List 5: Pitch Deck PDF Export**

| Task ID | Discipline | Task Description | Dependencies | Status |
| :---- | :---- | :---- | :---- | :---- |
| P4-1 | Backend | Compiler function to merge Phase 1, 2, 3 JSON states. | P1, P2, P3 | To Do |
| P4-2 | AI Logic | Inject phase\_4\_prompt and mapped JSON into Template Schema. | P4-1 | To Do |
| P4-3 | Backend | Integrate PDF generation library and build export endpoint. | P4-2 | To Do |
| P4-4 | Frontend | Build "Review & Download PDF" UI. | P4-3 | To Do |

