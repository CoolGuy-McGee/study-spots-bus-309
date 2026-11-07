# Campus Study Spot Finder

Find a place to study around BYU-Idaho that fits the way you work.

## Find a spot

- Browse the map to explore available study spots.
- Use the search bar to find a building, room, or type of space.
- Use the filters to narrow spots by location, indoor or outdoor setting, noise level, or group use.
- Select a map pin to view the spot's details.
- Use the campus button to return to the campus view.

## Spot details

Each spot includes information about:

- Noise and crowd level
- Privacy and availability
- Food, power, Wi-Fi, and desk access
- Study type and accessibility
- Overall rating
- Scenery and mood

Use **Save Spot** to keep a favorite spot handy.

## About the listings

Study spots are student-submitted and may change over time. Ratings and descriptions are intended to help you compare options, but availability can vary during the day.

The site loads its listings from `Data/derived-spots.json`. The committed JSON and all 51 referenced files in `Data/images` are the complete runtime dataset; the original photo collection, Parquet export, archives, and conversion tools are not needed to serve the site.

Coordinates come from the user-provided location table, matched by room, building, finder, rating, indoor/outdoor setting, and solo/group space. Fifty of the 51 image-backed records have supplied coordinates. Smith room 333 has `null` latitude and longitude and is flagged with `coordinate_accuracy: "missing coordinates"`; it is excluded from the map until coordinates are supplied. The supplied south-side Ricks Gardens and MC Near Bowling Area locations have no matching image-backed records yet.
