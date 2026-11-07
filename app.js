const campusCenter = [43.8145, -111.7785];
const campusBounds = [43.801, -111.792, 43.827, -111.765];
const state = { spots: [], filtered: [], search: '', selected: null, filters: { buildings: [], setting: '', noise: [], crowd: [], privacy: [], availability: [], space: '', food: [], desk: false, power: false, wifi: false, accessible: false } };

const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(campusCenter, 15);
L.control.zoom({ position: 'bottomleft' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const markerLayer = L.layerGroup().addTo(map);

const byId = (id) => document.getElementById(id);
const clean = (value) => (value || '').trim();
const tone = (value) => value.toLowerCase().replace(/\s/g, '');
const normalizeSpot = (spot) => ({
  ...spot,
  noise: spot.noise.charAt(0).toUpperCase() + spot.noise.slice(1).toLowerCase(),
  accessible: spot.accessible === true || String(spot.accessible).trim().toLowerCase() === 'yes'
});
document.querySelector('#map .leaflet-bottom.leaflet-left')?.appendChild(byId('campus-button'));
const filteredSpots = () => state.spots.filter((spot) => {
  const searchable = `${spot.room} ${spot.building} ${spot.scenery} ${spot.notes}`.toLowerCase();
  const filters = state.filters;
  return (!state.search || searchable.includes(state.search))
    && (!filters.buildings.length || filters.buildings.includes(spot.building))
    && (!filters.setting || spot.setting === filters.setting)
    && (!filters.noise.length || filters.noise.includes(spot.noise))
    && (!filters.crowd.length || filters.crowd.includes(spot.crowd))
    && (!filters.privacy.length || filters.privacy.includes(spot.privacy))
    && (!filters.availability.length || filters.availability.includes(spot.availability))
    && (!filters.space || spot.space === filters.space)
    && (!filters.food.length || filters.food.includes(spot.food))
    && (!filters.desk || spot.desk === 'Yes')
    && (!filters.power || spot.power === 'Yes')
    && (!filters.wifi || spot.wifi === 'Yes')
    && (!filters.accessible || spot.accessible);
});

function renderList() {
  state.filtered = filteredSpots();
  const count = byId('status-copy');
  if (count) count.textContent = `${state.filtered.length} spots`;
  const filterCount = byId('filter-count');
  if (filterCount) filterCount.textContent = state.filtered.length;
}

const filterGroups = [
  { key: 'buildings', label: 'Building', type: 'multi', options: () => [...new Set(state.spots.map((spot) => spot.building))].sort() },
  { key: 'setting', label: 'Setting', type: 'single', options: () => ['Inside', 'Outside'] },
  { key: 'noise', label: 'Noise', type: 'multi', options: () => ['Low', 'Med', 'High'], display: { Med: 'Medium' } },
  { key: 'crowd', label: 'Crowd', type: 'multi', options: () => ['Low', 'Med', 'High'], display: { Med: 'Medium' } },
  { key: 'privacy', label: 'Privacy', type: 'multi', options: () => ['Low', 'Med', 'High'], display: { Med: 'Medium' } },
  { key: 'availability', label: 'Availability', type: 'multi', options: () => ['Low', 'Med', 'High'], display: { Med: 'Medium' } },
  { key: 'space', label: 'Study type', type: 'single', options: () => ['Solo', 'Group'] },
  { key: 'food', label: 'Food nearby', type: 'multi', options: () => ['Low', 'Med', 'High'], display: { Med: 'Medium' } }
];

function renderFilterControls() {
  const controls = byId('filter-controls');
  if (!controls) return;
  controls.innerHTML = filterGroups.map((group) => `<section class="filter-group"><h3>${group.label}</h3><div class="filter-options ${group.key === 'buildings' ? 'building-options' : ''}">${group.options().map((option) => {
    const text = group.display?.[option] || option;
    const checked = group.type === 'multi' ? state.filters[group.key].includes(option) : state.filters[group.key] === option;
    const inputType = group.type === 'multi' ? 'checkbox' : 'radio';
    return `<label class="filter-option ${checked ? 'is-selected' : ''}"><input type="${inputType}" name="${group.key}" value="${option}" ${checked ? 'checked' : ''}><span>${text}</span></label>`;
  }).join('')}</div></section>`).join('') + `<section class="filter-group"><h3>Amenities</h3><div class="filter-options amenity-options">${[['wifi', 'Wi-Fi'], ['power', 'Power outlets'], ['desk', 'Desk'], ['accessible', 'Accessible']].map(([key, label]) => `<label class="filter-option ${state.filters[key] ? 'is-selected' : ''}"><input type="checkbox" name="${key}" ${state.filters[key] ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></section>`;
  controls.querySelectorAll('input').forEach((input) => input.addEventListener('click', (event) => {
    const group = filterGroups.find((item) => item.key === input.name);
    const selectedValue = input.value;
    if (group?.type === 'single' && state.filters[input.name] === selectedValue) {
      event.preventDefault();
      state.filters[input.name] = '';
      renderFilterControls();
      updateView();
    }
  }));
  controls.querySelectorAll('input').forEach((input) => input.addEventListener('change', () => {
    const group = filterGroups.find((item) => item.key === input.name);
    if (group?.type === 'multi') state.filters[input.name] = [...controls.querySelectorAll(`input[name="${input.name}"]:checked`)].map((item) => item.value);
    else if (group) state.filters[input.name] = input.value;
    else state.filters[input.name] = input.checked;
    renderFilterControls();
    updateView();
  }));
}

function setFilterPanel(open) {
  const filterPanel = byId('filter-panel');
  if (open) {
    filterPanel.style.setProperty('visibility', 'visible', 'important');
    filterPanel.style.setProperty('opacity', '1', 'important');
    filterPanel.style.setProperty('clip-path', 'inset(0)', 'important');
  } else {
    filterPanel.style.removeProperty('visibility');
    filterPanel.style.removeProperty('opacity');
    filterPanel.style.removeProperty('clip-path');
  }
  document.querySelector('.map-stage').classList.toggle('has-filters', open);
  filterPanel.classList.toggle('is-open', open);
  byId('filter-backdrop').classList.toggle('is-visible', open);
  byId('filter-panel').setAttribute('aria-hidden', `${!open}`);
  byId('filters-button').setAttribute('aria-expanded', `${open}`);
}

function clearFilters() {
  state.filters = { buildings: [], setting: '', noise: [], crowd: [], privacy: [], availability: [], space: '', food: [], desk: false, power: false, wifi: false, accessible: false };
  renderFilterControls();
  updateView();
}

function renderMarkers() {
  markerLayer.clearLayers();
  state.filtered.forEach((spot) => {
    const marker = L.marker([spot.lat, spot.lng], { icon: L.divIcon({ className: 'custom-marker', html: `<span class="marker-pin ${spot.setting.toLowerCase()}"><b>${spot.rating}</b></span>`, iconSize: [42, 48], iconAnchor: [21, 44] }) });
    marker.on('click', () => selectSpot(spot.id));
    marker.addTo(markerLayer);
  });
}

function renderDetail(spot) {
  const amenities = [['🔊', 'Noise', spot.noise], ['👥', 'Crowd', spot.crowd], ['🔒', 'Privacy', spot.privacy], ['📅', 'Availability', spot.availability], ['🍽️', 'Food', spot.food], ['🪑', 'Study Type', spot.space], ['🖥️', 'Desk', spot.desk], ['🔌', 'Power', spot.power], ['🛜', 'Wi-Fi', spot.wifi], ['♿', 'Accessible', spot.accessible ? 'Yes' : 'No']];
  byId('detail-panel').innerHTML = `<button class="close-detail" id="close-detail" type="button" aria-label="Close spot details">×</button>
    <div class="detail-content"><div class="detail-photo"><img src="${spot.image || ''}" alt="Study space at ${spot.building} — ${spot.room}" /></div>
    <h2>${spot.building} — ${spot.room}</h2><p class="detail-location">${spot.building} · ${spot.setting}</p>
    <div class="amenity-grid">${amenities.map(([icon, label, value]) => `<div><span aria-hidden="true">${icon}</span><small>${label}</small><strong class="${value.toLowerCase() === 'yes' ? 'yes' : ''}">${value}</strong></div>`).join('')}</div>
    <div class="scenery"><div><h3>Scenery &amp; Mood</h3><p>${spot.scenery}${spot.notes ? `, ${spot.notes}` : '.'}</p></div></div></div>`;
  byId('close-detail').addEventListener('click', closeDetail);
}

function selectSpot(id) {
  const spot = state.spots.find((item) => item.id === id);
  if (!spot) return;
  state.selected = spot; renderList(); renderMarkers(); renderDetail(spot);
  byId('detail-panel').classList.add('is-open');
  document.querySelector('.map-stage').classList.add('has-detail');
  if (!window.matchMedia('(max-width: 800px)').matches) {
    const mapRect = byId('map').getBoundingClientRect();
    const detailRect = byId('detail-panel').getBoundingClientRect();
    const cardAndInset = detailRect.width + Math.max(0, mapRect.right - detailRect.right);
    const zoom = 17;
    const projected = map.project([spot.lat, spot.lng], zoom);
    const adjustedCenter = map.unproject(L.point(projected.x + cardAndInset / 2, projected.y), zoom);
    map.flyTo(adjustedCenter, zoom, { duration: 0.6 });
  }
}
function closeDetail() {
  state.selected = null;
  byId('detail-panel').classList.remove('is-open');
  document.querySelector('.map-stage').classList.remove('has-detail');
  byId('detail-panel').innerHTML = '<button class="close-detail" id="close-detail" type="button" aria-label="Close spot details">×</button><div class="detail-empty"><div class="empty-icon">↗</div><p class="eyebrow">Spot details</p><h2>Pick a pin<br /><em>to peek inside.</em></h2><p>Choose a spot from the list or map to see its amenities and notes.</p></div>';
  byId('close-detail').addEventListener('click', closeDetail); renderList(); renderMarkers();
}
function updateView() { renderList(); renderMarkers(); }

async function init() {
  const response = await fetch('./Data/derived-spots.json');
  if (!response.ok) throw new Error('Could not load study spot data');
  state.spots = (await response.json()).map(normalizeSpot).filter((spot) => Number.isFinite(spot.lat) && Number.isFinite(spot.lng));
  renderFilterControls();
  byId('status-copy').textContent = `${state.spots.length} student-submitted spots`;
  updateView();
}

byId('search-input').addEventListener('input', (event) => { state.search = event.target.value.toLowerCase().trim(); updateView(); });
byId('campus-button').addEventListener('click', () => map.flyTo(campusCenter, 15, { duration: 0.6 }));
byId('filters-button').addEventListener('click', () => setFilterPanel(true));
byId('filter-close').addEventListener('click', () => setFilterPanel(false));
byId('filter-backdrop').addEventListener('click', () => setFilterPanel(false));
byId('clear-filters').addEventListener('click', clearFilters);
byId('show-spots').addEventListener('click', () => setFilterPanel(false));
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); byId('search-input').focus(); } if (event.key === 'Escape') { closeDetail(); setFilterPanel(false); } });
init().catch(() => { byId('status-copy').textContent = 'Could not load spots'; });
