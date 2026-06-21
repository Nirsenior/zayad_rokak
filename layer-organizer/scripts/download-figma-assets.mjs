/**
 * Downloads Figma MCP assets from localhost:3845 into public/assets/figma/
 * Requires Figma Desktop open with MCP asset server running.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'assets', 'figma');
const base = 'http://localhost:3845/assets';

const assets = {
  'map-background.png': '7b9df829bbe0bf19b3bfae5640aec029260129e1.png',
  'layers.svg': '30da0f156bd9ab1e1197b0a51945795988ebc8a0.svg',
  'tools.svg': '39a872e03d751f811ed39569af9701f4e6974f86.svg',
  'mission-plan-bg.svg': 'b3102fa8c1cab8200698c2cbbe2b9ed30a3faa6a.svg',
  'mission-plan-chevron.svg': '724e3553d66fceb798d7b7111210f4a63810ee08.svg',
  'mission-target.svg': '974ee21fa379c1ba3cc45b62e23d098afaa6debc.svg',
  'mp-icon-air.svg': '0e2e94678952290e1b5f61d901dc6acde49ce86f.svg',
  'mp-icon-sword.svg': '1d76db25a3066ab0595a79f14fed49b303fc8df2.svg',
  'mp-icon-electricity.svg': '49798194d4eae5e24f8e24093edea51fc0ed4616.svg',
  'mp-icon-shield.svg': '95dcae0fac006849b384f3ed54b19f9cf29c63b0.svg',
  'mp-icon-agam.svg': '1db30897f0b84b4ddee4bb7304015cadbb51c820.svg',
  'mp-row-glow.svg': '8b4088789beb0b91508c31ae61762e65ce34a111.svg',
  'user-card-bg.svg': '8c9e0e2639bc5180c98e58ef6634671516000373.svg',
  'user-chevron-badge.svg': 'ec82ef231f99a71ce17b350ed4b669f321fba4c7.svg',
  'user-chevron.svg': '940b42f155f8238e14752e8c7f0c6b45fcbbea77.svg',
  'user-emblem-bg.svg': '2c8aad5a342ad91fd7b1aeec3b938519fd61e371.svg',
  'user-emblem.png': 'd7428b0b69b3c5cdcd11644f49aa0191e0b8863f.png',
  'search.svg': '6378dd67225d9414d412523b28a8ad1b98c580f7.svg',
  'header-bg.svg': 'd0b2477f9626a8f1d7c4490415d142a2aaf2091f.svg',
  'sidebar-rail-bg.svg': '236707dd9fcfb8d7adfa91db3ad243b1ef1463f6.svg',
  'side-menu-mission-icon.svg': '8ac80072af8b4bd04ecf23770d12da72812dedaa.svg',
  'side-menu-area-icon.svg': '2309dbc062d5a05d6a3abbdf36515224bd51e4f2.svg',
  'side-menu-journal-icon.svg': '24115ce71341e42489170f03da970952ebccca8d.svg',
  'side-menu-guard-icon.svg': '94c054efb764fe56c4556a812ab38807df4f337f.svg',
  'side-doc-chat.svg': '8abebf76c9c0d19ab19f8ab5f48d8680d55ff735.svg',
  'side-doc-plus.svg': '22a80d11b6b0eb5145456cedf376173ab0fe907c.svg',
  'side-doc-video-1.svg': '5803692e63ccfd1faa475196618146eb374bcc88.svg',
  'side-doc-video-2.svg': '55b58cd1fb4a60ff3d0c27b55a32f8c30beb9e66.svg',
  'side-ai-icon.svg': '29bf2a82c084ec1f86a35da96169ef0b5ddda04e.svg',
  'wifi-1.svg': '1c7fdf9b4ca10e85b4ce2f580b610966ddcdfb8c.svg',
  'wifi-2.svg': '7983f9f09c6c0f21be6df0ad398b647f20daabf5.svg',
  'wifi-3.svg': '87adf991b234cf09aa944aed90fe3e3695451759.svg',
  'layout.svg': '695f1ee555c54146625ae062227d879aa4da3e3c.svg',
  'applications.svg': '0196e974e1f092fc483365685895289f9313d8c2.svg',
  'notification-bell.svg': '8953229136a1408aeac2d9fe598757fdecaf0fb5.svg',
  'notification-dot.svg': 'fd4a851b3754a06183ff02af03dca73388526b1b.svg',
  'settings.svg': '39043cc623255265623227ef4d03977c2fb3cfbf.svg',
  'help.svg': 'c7c8b958b2420a24b7d155958526d4a89665481c.svg',
  'compass-snap.svg': '926e784e0df79491269bfaa15ec358cac81b0183.svg',
  'compass-dial.svg': 'ea5962d415ed1a2b42b9862bceabade0548c2c30.svg',
  'compass-needle.svg': 'cd7b55ab5295ea67cf0f20e2fb0551ffd44dcb0e.svg',
  'compass-zoom-outer.svg': 'a9bae3a8e34e1e3df4d4219763e2d0bb67ca9eef.svg',
  'compass-zoom-inner.svg': 'edf75afbe3161ef82496ba663f755773f8fd3817.svg',
  'compass-minus.svg': 'd65f589602d67decbebd90072742d1c7c37d1a63.svg',
  'compass-plus.svg': 'aa4906765df6003e26c27123f677a696e8887dae.svg',
  'footer-scale.svg': 'ad33bfcb26a04771ffed88249d72f07d5a5abe50.svg',
  'mission-minilist.svg': 'd08c184211e4c20544b61ec8f9719374e5e05477.svg',
  'sidebar-toggle-bg.svg': 'f041f5e8cc16c45f061ec28fd928a3fbbf9813cf.svg',
  'sidebar-toggle-highlight.svg': '223175981efbee4921085762cf055f4166f94f3c.svg',
  'sidebar-toggle-chevron.svg': '2dcfd3051e6e9c5f58f69e088c033264d0d748de.svg',
  'sidebar-toggle-icon.svg': '08b96811d38db6dd1772a94e0be154c0c4bdbc21.svg',
  'menu.svg': 'dc411c03181a8dd1d2785fa898bf458f9163dc22.svg',
  'action-top-bg.svg': '89be6ab22ebc236b9bb41c7aa3d9c308198494af.svg',
  'action-mid-bg.svg': '46cda4f3cfa667d80c1ad29bd31637bd7c61a45a.svg',
  'action-bottom-bg.svg': 'b396658016640211d5f2f94095385e8a6693e24d.svg',
  'action-tech.svg': '257284830add20d3320914cb2d3d5032ca4f704c.svg',
  'action-map.svg': '066f57fcb285400de19c789e9de0f2cd28f5f114.svg',
};

fs.mkdirSync(outDir, { recursive: true });

let ok = 0;
let fail = 0;

for (const [name, hash] of Object.entries(assets)) {
  const url = `${base}/${hash}`;
  const dest = path.join(outDir, name);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    ok++;
    console.log(`OK ${name}`);
  } catch (e) {
    fail++;
    console.error(`FAIL ${name}: ${e.message}`);
  }
}

console.log(`\nDone: ${ok} ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
