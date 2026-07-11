const fs = require('fs');

const path = 'src/features/main/components/NewHomePage.jsx';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/(<main className="figma-main-content">\s*<CalendarSidebarWidget[\s\S]*?\/>)([\s\S]*?)(<\/main>)/);
if (!match) {
    console.log('Could not find main block');
    process.exit(1);
}

const pre_main = match[1];
const inner_main = match[2];
const post_main = match[3];

const sections = {
    'hero': inner_main.match(/<section id="home"[\s\S]*?<\/section>/)[0],
    'slider': inner_main.match(/<DynamicHomeSlider[\s\S]*?\/>/)[0],
    'news': inner_main.match(/<HomeNewsWidget[\s\S]*?\/>/)[0],
    'about': inner_main.match(/<section id="about"[\s\S]*?<\/section>/)[0],
    'research': inner_main.match(/<section id="research"[\s\S]*?<\/section>/)[0],
    'newsletter': inner_main.match(/<section className="figma-newsletter-cta-section"[\s\S]*?<\/section>/)[0],
    'community': inner_main.match(/<section id="community"[\s\S]*?<\/section>/)[0],
    'training': inner_main.match(/<section id="training"[\s\S]*?<\/section>/)[0],
    'upcoming': inner_main.match(/<section id="upcoming"[\s\S]*?<\/section>/)[0],
};

for (const k in sections) {
    if (k === 'slider' || k === 'news') {
        sections[k] = sections[k].replace('<Dynamic', '<Dynamic key="slider"').replace('<HomeNews', '<HomeNews key="news"');
    } else {
        sections[k] = sections[k].replace('<section ', `<section key="${k}" `);
    }
}

const render_function = `
  // ==========================================
  // PAGE LAYOUT - Reorder these to change layout
  // ==========================================
  const PAGE_LAYOUT = [
    'hero',
    'slider',
    'news',
    'about',
    'research',
    'newsletter',
    'community',
    'training',
    'upcoming'
  ];

  const renderSection = (sectionId) => {
    switch(sectionId) {
      case 'hero': return (
        ${sections['hero'].trim().split('\\n').join('\\n        ')}
      );
      case 'slider': return (
        ${sections['slider'].trim().split('\\n').join('\\n        ')}
      );
      case 'news': return (
        ${sections['news'].trim().split('\\n').join('\\n        ')}
      );
      case 'about': return (
        ${sections['about'].trim().split('\\n').join('\\n        ')}
      );
      case 'research': return (
        ${sections['research'].trim().split('\\n').join('\\n        ')}
      );
      case 'newsletter': return (
        ${sections['newsletter'].trim().split('\\n').join('\\n        ')}
      );
      case 'community': return (
        ${sections['community'].trim().split('\\n').join('\\n        ')}
      );
      case 'training': return (
        ${sections['training'].trim().split('\\n').join('\\n        ')}
      );
      case 'upcoming': return (
        ${sections['upcoming'].trim().split('\\n').join('\\n        ')}
      );
      default: return null;
    }
  };
`;

const new_content = content.substring(0, match.index) + render_function + `
    <main className="figma-main-content">
        <CalendarSidebarWidget 
          lang={lang} 
          onNavigate={onNavigate} 
        />
      {PAGE_LAYOUT.map(id => renderSection(id))}
    </main>
` + content.substring(match.index + match[0].length);

fs.writeFileSync(path, new_content, 'utf8');
console.log('Success');
