# Plan: LLM Prompt Regression Testing with Maitai

## Goal
Build a prompt regression testing system that demonstrates how Maitai helps catch breaking changes when modifying LLM prompts. Use case: Customer support ticket routing system.

## Data Strategy
- **Source**: Bitext Hugging Face dataset (`bitext/Bitext-customer-support-llm-chatbot-training-dataset`)
- **Test set size**: 200 examples (balanced across categories)
- **Categories (11)**: ACCOUNT, CANCEL, CONTACT, DELIVERY, FEEDBACK, INVOICE, ORDER, PAYMENT, REFUND, SHIPPING, SUBSCRIPTION

## Steps

### Phase 1: Setup
- [x] 1. Create `.env` with API keys
- [x] 2. Create folder structure (`data/`, `src/`, `scripts/`)
- [x] 3. Create `src/__init__.py`
- [x] 4. Create `src/config.py` (load env vars, define constants)
- [x] 5. Create `scripts/__init__.py`
- [x] 6. Create `requirements.txt`
- [x] 7. Create `.gitignore`
- [x] 8. Add `datasets` package to requirements.txt
- [x] 9. Fix package name: `maitai` → `maitai-python>=1.0.0`
- [x] 10. Set up virtual environment and install dependencies

### Phase 2: Core Implementation
- [x] 11. Implement `src/prompts.py` (v1, v2, v3 templates for 11 categories)
- [x] 12. Implement `src/router.py` (Maitai integration)
- [x] 13. Manual testing with a few examples

### Phase 3: Test Data
- [x] 14. Implement `scripts/generate_test_data.py` (load from Hugging Face)
- [x] 15. Generate `data/test_set.json` (200 test cases)
- [x] 16. Review and validate test cases

### Phase 4: Testing & Experiments
- [x] 17. Implement `scripts/run_baseline.py`
- [x] 18. Run baseline test (prompt v1) → **92.9% accuracy**
- [x] 19. Implement `scripts/run_experiment.py`
- [ ] 20. Run experiments (prompts v2, v3)
- [ ] 21. Analyze results

### Phase 5: Documentation
- [ ] 22. Write `README.md`
- [ ] 23. Write `RESULTS.md`

## Current
Step 20 - Run experiments (prompts v2, v3)

## Notes
- Package fix: The correct Maitai SDK is `maitai-python`, not `maitai` (which is an unrelated old package)
- API uses OpenAI-style: `maitai.chat.completions.create()` with `application` and `intent` params
