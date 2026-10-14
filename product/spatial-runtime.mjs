import {spatialScene} from './spatial.mjs';
if(!document.querySelector('.spatial-world'))document.body.insertAdjacentHTML('afterbegin',spatialScene());
// One stable environment survives application renders. No animation loop, audio or device sensors.
const less=matchMedia('(prefers-reduced-motion: reduce)');
function preference(){document.body.dataset.motion=less.matches?'reduced':'standard';}
preference();less.addEventListener?.('change',preference);

function quality(){const c=navigator.connection;document.body.dataset.spatialQuality=(less.matches||c?.saveData||c?.effectiveType==='2g'||(navigator.deviceMemory&&navigator.deviceMemory<=2))?'quiet':'full';}
quality();navigator.connection?.addEventListener?.('change',quality);less.addEventListener?.('change',quality);
