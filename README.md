# MI Digital Twin – HPV Vaccine Conversation Prototype

This prototype demonstrates a possible parent-facing interface for the **Digital Twin MI and HPV pilot**. It simulates a text-based motivational interviewing (MI) conversation about HPV vaccination using the **UF Navigator Toolkit** (`https://api.ai.it.ufl.edu`) and a system prompt.

It is **not a production clinical tool** and does not yet include:

- The approved RAG knowledge base
- The trained project model
- Study authentication / consent
- Survey data storage
- Production data handling, safety monitoring, or escalation

## What's in the prototype

- **Welcome screen** with AI disclosure, privacy notice, and clinical-use disclaimer
- **3-step flow** (Start → Discuss → Survey) with a progress indicator
- **Parent-facing chat** with quick-start concern chips, trust banner, and MI technique tags (Reflection, Affirmation, Ask-Offer-Ask, etc.) shown as small research labels
- **Conversation Goals panel** emphasizing autonomy and informed decision-making
- **Completion prompt** and **conversation summary** card after several turns
- **Mock acceptability / appropriateness / trust survey** (Likert + open-ended)
- **Research View** (stakeholder panel) showing conversation ID, model, RAG/MI fidelity/safety placeholders, deployment target, and survey status
- **Developer Settings** (hidden from parents) for model selection and system-prompt testing
- **Password gate** on the demo and server-side handling of the Navigator API key
- **Rate limiting** on `/api/chat`

## Important note on RAG

RAG grounding is **planned** for the production version. This prototype uses a prompt-based simulation only and does not yet ground medical claims in a verified knowledge base.

## Prototype boundary

This is a visual and functional prototype for stakeholder discussion. It is not the final Digital Twin system. Production versions would require approved model training, RAG grounding to verified HPV vaccine content, safety monitoring, authentication, study data storage, IRB-aligned consent language, and university-approved deployment.
