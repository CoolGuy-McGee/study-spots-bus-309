const campusCenter = [43.8145, -111.7785];
const campusBounds = [43.801, -111.792, 43.827, -111.765];
const state = { spots: [], filtered: [], activeFilter: 'all', search: '', selected: null };

const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(campusCenter, 15);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
const markerLayer = L.layerGroup().addTo(map);

const byId = (id) => document.getElementById(id);
const clean = (value) => (value || '').trim();
const ratingStars = (rating) => `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`;
const tone = (value) => value.toLowerCase().replace(/\s/g, '');
const filteredSpots = () => state.spots.filter((spot) => {
  const searchable = `${spot.room} ${spot.building} ${spot.scenery} ${spot.notes}`.toLowerCase();
  const filterMatches = state.activeFilter === 'all' || spot.setting === state.activeFilter || spot.building.includes(state.activeFilter) || (state.activeFilter === 'Quiet' && spot.noise === 'Low') || (state.activeFilter === 'Group' && spot.space === 'Group');
  return (!state.search || searchable.includes(state.search)) && filterMatches;
});

function renderList() {
  state.filtered = filteredSpots();
  const count = byId('status-copy');
  if (count) count.textContent = `${state.filtered.length} spots`;
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
  const amenities = [['🔇', 'Noise', spot.noise], ['👥', 'Crowd', spot.crowd], ['🔒', 'Privacy', spot.privacy], ['📅', 'Availability', spot.availability], ['🍽️', 'Food', spot.food], ['📍', 'Setting', spot.setting], ['🪑', 'Space', spot.space], ['🖥️', 'Desk', spot.desk], ['⚡', 'Power', spot.power], ['📶', 'Wi-Fi', spot.wifi], ['♿', 'Accessible', spot.accessible ? 'Yes' : 'No']];
  byId('detail-panel').innerHTML = `<button class="close-detail" id="close-detail" type="button" aria-label="Close spot details">×</button>
    <div class="detail-content"><div class="detail-photo" role="img" aria-label="Study space preview"></div><div class="detail-kicker"><span>${spot.setting}</span><span>Spot ${String(spot.id).padStart(2, '0')}</span></div>
    <h2>${spot.room}</h2><p class="detail-location">${spot.building}</p>
    <div class="big-rating"><span>${ratingStars(spot.rating)}</span><strong>${spot.rating}.0</strong><small>overall</small></div>
    <div class="detail-rule"></div><p class="detail-note">${spot.notes}</p>
    <div class="amenity-grid">${amenities.map(([icon, label, value]) => `<div><span aria-hidden="true">${icon}</span><small>${label}</small><strong class="${value.toLowerCase() === 'yes' ? 'yes' : ''}">${value}</strong></div>`).join('')}</div>
    <div class="rating-list"><div><span>Noise</span><b class="bar"><i style="width:${spot.noise === 'Low' ? 32 : spot.noise === 'High' ? 88 : 58}%"></i></b><small>${spot.noise}</small></div><div><span>Privacy</span><b class="bar"><i style="width:${spot.privacy === 'Low' ? 32 : spot.privacy === 'High' ? 88 : 58}%"></i></b><small>${spot.privacy}</small></div><div><span>Availability</span><b class="bar"><i style="width:${spot.availability === 'Low' ? 32 : spot.availability === 'High' ? 88 : 58}%"></i></b><small>${spot.availability}</small></div></div>
    <div class="scenery"><span class="scenery-icon">✳</span><div><small>Notes</small><p>${spot.notes || 'No notes added yet.'}</p></div></div><button class="save-button" type="button">♡ <span>Save Spot</span></button></div>`;
  byId('close-detail').addEventListener('click', closeDetail);
  byId('detail-panel').querySelector('.save-button').addEventListener('click', (event) => {
    const saved = event.currentTarget.classList.toggle('saved');
    event.currentTarget.innerHTML = saved ? '♥ <span>Saved Spot</span>' : '♡ <span>Save Spot</span>';
  });
}

function selectSpot(id) {
  const spot = state.spots.find((item) => item.id === id);
  if (!spot) return;
  state.selected = spot; renderList(); renderMarkers(); renderDetail(spot);
  map.flyTo([spot.lat, spot.lng], 17, { duration: 0.6 });
}
function closeDetail() {
  state.selected = null;
  byId('detail-panel').innerHTML = '<button class="close-detail" id="close-detail" type="button" aria-label="Close spot details">×</button><div class="detail-empty"><div class="empty-icon">↗</div><p class="eyebrow">Spot details</p><h2>Pick a pin<br /><em>to peek inside.</em></h2><p>Choose a spot from the list or map to see its ratings, amenities, and notes.</p></div>';
  byId('close-detail').addEventListener('click', closeDetail); renderList(); renderMarkers();
}
function updateView() { renderList(); renderMarkers(); }

async function init() {
  const response = await fetch('./data.json');
  if (!response.ok) throw new Error('Could not load data.json');
  state.spots = await response.json();
  byId('status-copy').textContent = `${state.spots.length} student-submitted spots`;
  selectSpot(state.spots.find((spot) => spot.building.includes('Library'))?.id || state.spots[0].id);
  updateView();
}

document.querySelectorAll('.filter-chip').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.remove('active')); button.classList.add('active'); state.activeFilter = button.dataset.filter; updateView();
}));
byId('search-input').addEventListener('input', (event) => { state.search = event.target.value.toLowerCase().trim(); updateView(); });
byId('campus-button').addEventListener('click', () => map.flyTo(campusCenter, 15, { duration: 0.6 }));
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); byId('search-input').focus(); } if (event.key === 'Escape') closeDetail(); });
init().catch(() => { byId('spot-list').innerHTML = '<div class="no-results"><strong>Could not load backlog</strong><span>Run the site through the Vite dev server.</span></div>'; });
