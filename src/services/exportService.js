// src/services/exportService.js

import { Document, Paragraph, Packer, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// No API calls here, so no changes needed.

export const ExportService = {
  async exportToWord(analysisData) {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: "Strategic Analysis Report",
            heading: HeadingLevel.HEADING_1
          }),
          // Fundamentals Section
          new Paragraph({
            text: "Fundamentals",
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({ text: analysisData.fundamentals.vision }),
          new Paragraph({ text: analysisData.fundamentals.mission }),
          new Paragraph({ text: analysisData.fundamentals.purpose }),
          // Other sections
          ...Object.entries(analysisData)
            .filter(([key]) => key !== 'fundamentals')
            .flatMap(([section, content]) => [
              new Paragraph({
                text: section.charAt(0).toUpperCase() + section.slice(1),
                heading: HeadingLevel.HEADING_2
              }),
              new Paragraph({ text: content })
            ])
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "strategic-analysis.docx");
  }
};
