import { westernSeasons } from './src/lib/feasts.js';
import { adventSunday } from './src/lib/dates.js';

const refDate = new Date(2026, 10, 15); // Nov 15 2026
const seasons = westernSeasons(refDate, "Anglican");
for (const s of seasons) {
  console.log(s.key, s.name, s.start.toDateString(), '->', s.end.toDateString());
}
console.log('advent1 2026:', adventSunday(2026).toDateString());
console.log('advent1 2027:', adventSunday(2027).toDateString());
