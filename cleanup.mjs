import fs from 'fs';

const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Remove image and old widget imports
content = content.replace(/import \{ HomeNewsWidget \}.*\n/g, '');
content = content.replace(/import \{ ArabWorldMap \}.*\n/g, '');
content = content.replace(/import doctorImg.*?\n/g, '');
content = content.replace(/import whiteLogo.*?\n/g, '');
content = content.replace(/import research[1-4].*?\n/g, '');
content = content.replace(/import training[1-4].*?\n/g, '');
content = content.replace(/import upcoming[1-2].*?\n/g, '');

// 2. Remove DISCOVERY_ITEMS
const discStart = content.indexOf('const DISCOVERY_ITEMS = [');
const discEnd = content.indexOf('];', discStart) + 2;
content = content.slice(0, discStart) + content.slice(discEnd);

// 3. Remove hooks and handlers
const stateStart = content.indexOf('const [discoveryIndex, setDiscoveryIndex] = useState(0);');
const stateEnd = content.indexOf('const handleLogout = async () => {');
content = content.slice(0, stateStart) + content.slice(stateEnd);

// 4. Remove homeComponent and <main> entirely
const routerStart = content.indexOf('<AppRouter');
const routerEnd = content.indexOf('</main>\n        }\n      />') + '</main>\n        }\n      />'.length;
content = content.slice(0, routerStart) + `      <AppRouter 
        currentView={currentView}
        setCurrentView={setCurrentView}
        lang={lang}
        setOpenedModal={setOpenedModal}
        navigate={navigate}
      />` + content.slice(routerEnd);

fs.writeFileSync(appPath, content.trim() + '\n');
console.log('App.jsx cleaned up!');
