# Historical evidence data: Valencia Sud

The shipped `dist/data/valencia.json` is a combined GeoJSON FeatureCollection from the official Copernicus EMS Rapid Mapping product **EMSR773, AOI30 Valencia Sud, GRA_PRODUCT v1**. It contains 37 flood-trace polygons, one area-of-interest polygon, 13 transportation features, and 16 building points. It is separate from FloodShield's synthetic scenario model.

## Provenance and reproduction

- Product ZIP: https://rapidmapping.emergency.copernicus.eu/backend/EMSR773/AOI30/GRA_PRODUCT/EMSR773_AOI30_GRA_PRODUCT_v1.zip
- Activation: https://mapping.emergency.copernicus.eu/activations/EMSR773/
- Downloaded 29 October 2026. The stable backend link redirects to a temporary signed S3 URL; do not commit the redirect URL.
- SHA-256 of the downloaded package: `8dddf8a13b63a3d816e6cb450e0b99bf9bcb6e9ca1238bf6fc27dcf404a57730`.
- Original layer names and SHA-256 hashes are embedded in the GeoJSON's `metadata.source_members`.
- Geometries and original properties were retained without simplification, coordinate rounding or reprojection. Coordinates use longitude/latitude (source CRS84). Added properties: `layer`, `source_file`; added stable feature `id`. JSON was minified, the four layers combined, and provenance added.
- To reproduce, download the ZIP, read the four JSON members named in `metadata.source_members`, combine their features, and retain their original geometry. No original satellite/aerial imagery or PDF background is redistributed.

## Dates and interpretation

The event began **29 October 2024**; the map specifies 14:30 UTC. The selected product's observation is **17 November 2024, 13:21 UTC**, and its PDF states release **27 November 2024**. These are different dates: never label the geometries as observed on the event's first day. Dates and methodology were checked directly in `Maps/EMSR773_AOI30_GRA_PRODUCT_20000_map_v1.pdf` inside the downloaded ZIP.

The source identifies 0.2 m post-event **aerial imagery**, supplied by CGR under Copernicus, and photo-interpretation. Although the PDF has a generic sentence about satellite image interpretation, its specific acquisition entry says aerial data. Describe this layer as CEMS aerial-image interpretation, not as a flood footprint detected by our AI or Sentinel.

All 37 event polygons have notation `Flood trace`. They depict residual traces and are **not the complete maximum inundation extent**. The source map reports 6.1 hectares of traces, 16 possibly damaged buildings, roughly 1.0 km of affected roads and 0.3 km of railway; these rounded historical source figures are not model output. Source attributes retain exact damage classes. No inundation depth, flood probability or current road status is provided.

Absence of a trace is not evidence of safety. The source warns that distortions can lower thematic accuracy. The UI must preserve “Possibly damaged” rather than converting it to confirmed damage. This historical layer does not validate the synthetic simulator or provide a real-time warning.

## Attribution and license

Required attribution:

**Copernicus Emergency Management Service (© 2024 European Union), [EMSR773] Valencia Sud (AOI30): Grading Map, v1.**

- Terms: https://mapping.emergency.copernicus.eu/terms-and-conditions/
- Citation guidance: https://mapping.emergency.copernicus.eu/about/citation-guidelines/

The CEMS On-Demand Mapping terms permit reproduction, distribution, public communication and adaptation, with source attribution and the stated restrictions/disclaimers. This dataset retains those upstream terms; it is **not relicensed under the repository code license**. The terms explicitly treat third-party information separately. Original commercial imagery is not included. The source PDF acknowledges base vectors including OpenStreetMap contributors (2024), Wikimapia, GeoNames, CLC and EuroGeographics; the included CEMS damage-assessment features retain their provenance and are not represented as our own survey or original basemap.

## Verification performed

Parsed the downloaded official ZIP; checked the four source GeoJSON layers; checked all output geometries against the original arrays for exact equality; verified 67 total features. No model accuracy or current safety conclusion is established by these checks.
