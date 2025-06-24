// tests/manual-test-flow.md
# Strategic Caliberator Test Flow

## 1. Document Input Testing
- [ ] Open application
- [ ] Verify initial state shows Document Input step
- [ ] Test File Upload:
  - [ ] Upload valid PDF/DOC/DOCX/TXT file
  - [ ] Try uploading invalid file type (should show error)
  - [ ] Remove uploaded file
  - [ ] Test drag and drop functionality
- [ ] Test Mission Statement:
  - [ ] Enter mission statement
  - [ ] Test empty submission (should show error)
- [ ] Test Strategic Text:
  - [ ] Enter strategic text
  - [ ] Test empty submission (should show error)
- [ ] Verify form submission with all fields filled

## 2. Analysis Selection Testing
- [ ] Verify all default selections are checked
- [ ] Test "Clear All" button
- [ ] Test "Select All" button
- [ ] Test individual section toggle
- [ ] Verify info tooltips work
- [ ] Test navigation:
  - [ ] Back button returns to Document Input
  - [ ] Progress bar shows correct state
- [ ] Test submission with:
  - [ ] All sections selected
  - [ ] Some sections selected
  - [ ] No sections (should show error)

## 3. Results Testing
- [ ] Verify all selected sections are displayed
- [ ] Test section expansion/collapse
- [ ] Verify loading states appear during analysis
- [ ] Test editing functionality:
  - [ ] Edit button shows textarea
  - [ ] Cancel returns to view mode
  - [ ] Save updates content
- [ ] Test error states:
  - [ ] API failure handling
  - [ ] Retry functionality
- [ ] Test navigation:
  - [ ] Back button returns to Analysis Selection
  - [ ] Progress bar shows correct state
- [ ] Test "Start Over" functionality

## 4. Cross-Component Testing
- [ ] Test complete flow with minimal valid data
- [ ] Test complete flow with all possible selections
- [ ] Verify data persistence between navigation
- [ ] Test browser refresh handling