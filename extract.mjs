import fs from 'fs';

const appPath = 'src/App.jsx';
const oldHomePath = 'src/features/main/components/OldHomePage.jsx';

let content = fs.readFileSync(appPath, 'utf8');
const lines = content.split('\n');

const imports = `import { useState } from 'preact/hooks'
import { Button } from '../../shared/components/Button'
import { GlassCard } from '../../shared/components/GlassCard'
import { HomeNewsWidget } from '../../news-blog/components/HomeNewsWidget'
import { ArabWorldMap } from './ArabWorldMap'
import { translations } from '../../../i18n/translations'

import doctorImg from '../../../assets/bg_3.png'
import whiteLogo from '../../../assets/footer_logo.svg'
import research1 from '../../../assets/research_1.png'
import research2 from '../../../assets/research_2.png'
import research3 from '../../../assets/research_3.png'
import research4 from '../../../assets/bg_1.png'
import training1 from '../../../assets/training_1.png'
import training2 from '../../../assets/training_2.png'
import training3 from '../../../assets/training_3.png'
import training4 from '../../../assets/training_4.png'
import upcoming1 from '../../../assets/upcoming_1.png'
import upcoming2 from '../../../assets/upcoming_2.png'
`;

const discoveryStart = lines.findIndex(l => l.includes('const DISCOVERY_ITEMS = ['));
const discoveryEnd = lines.findIndex((l, i) => i > discoveryStart && l.includes('];')) + 1;
const discoveryContent = lines.slice(discoveryStart, discoveryEnd).join('\n');

const mainStart = lines.findIndex(l => l.includes('<main className="figma-main-content">'));
const mainEnd = lines.findIndex((l, i) => i > mainStart && l.includes('</main>')) + 1;
const mainContent = lines.slice(mainStart, mainEnd).join('\n');

const component = `
export function OldHomePage({ lang, setOpenedModal, setCurrentView }) {
  const t = translations[lang] || translations.ar;
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [likedItems, setLikedItems] = useState({});
  const itemsPerView = window.innerWidth < 600 ? 1 : window.innerWidth < 992 ? 2 : 3;

  const handleNextDiscovery = () => {
    setDiscoveryIndex((prev) => (prev + 1) % (DISCOVERY_ITEMS.length - itemsPerView + 1));
  };
  const handlePrevDiscovery = () => {
    setDiscoveryIndex((prev) => 
      prev === 0 ? DISCOVERY_ITEMS.length - itemsPerView : prev - 1
    );
  };
  const handleLike = (id) => {
    setLikedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
${mainContent}
  );
}
`;

fs.writeFileSync(oldHomePath, imports + '\n' + discoveryContent + '\n' + component);
console.log('Extracted OldHomePage successfully.');
