// parseFundamentals.js

export function parseFundamentals(text) {
  const sections = {};
  const regex = /^(Vision Statement|Mission Statement|Purpose Statement):?\s*(.*?)(?=\n\n|$)/gis;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const [_, title, content] = match;
    if (title.toLowerCase().includes('vision')) {
      sections.vision = content.trim();
    } else if (title.toLowerCase().includes('mission')) {
      sections.mission = content.trim();
    } else if (title.toLowerCase().includes('purpose')) {
      sections.purpose = content.trim();
    }
  }

  return sections;
}
