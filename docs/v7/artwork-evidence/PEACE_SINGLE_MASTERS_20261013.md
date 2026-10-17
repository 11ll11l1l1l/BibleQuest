# Peace and Peaceful — single-master production evidence

PR: #1535. Two separate built-in image-generation invocations on 2026-10-13; prompt plus transparent_background:false only. No reference images, earlier-image inputs, third-party photos or rendered wording. Tool returns image_url/output_hint; no model/generator identifier was exposed, so none is invented.

## Exact render prompt — Peace
Create ONE photorealistic editorial photograph. Portrait composition 4:5. A busy contemporary Japanese municipal housing-office waiting room: in the foreground on the RIGHT two connected waiting chairs hold an Asian mother aged about 35 in a plain navy cardigan and her daughter aged about 7 in ordinary modern clothes. The child quietly asks her a question, looking up; the mother turns toward her with attentive calm, shoulders relaxed, one open hand resting on her own knee. Both people seated naturally, feet visible, ordinary unbranded tote at their feet. Background: four distant waiting adults and a service counter, softly blurred, ordinary indoor daylight. The story is calm presence amid bustle, not solitude. Camera seated adult eye height, candid 50mm, authentic Japanese community interior, gentle neutral colours, believable hands and faces. Foreground mother and child occupy middle-right; leave the bottom fifth and left margin visually quiet, keep both faces and their interaction within central 70 percent for mobile crops. No written words, no signage lettering, no numbers, no logos, no Bible text, no watermark. One continuous realistic camera scene only. Render this housing-office mother-and-child scene exactly; no graphic design.

## Exact render prompt — Peaceful/content
Create ONE square 1:1 photorealistic contemporary editorial photograph, not an illustration. A Japanese woman about 45 sits comfortably in a modest, tidy lived-in apartment after ordinary household routines. She wears an unbranded oatmeal knit cardigan and dark casual trousers and holds a small plain ceramic mug naturally with both hands resting comfortably near her lap. She leans back gently in a worn olive upholstered armchair, eyes softly closed, relaxed face with a subtle peaceful expression, content with her simple surroundings. A low side table holds a neatly folded ordinary dish towel; a single indoor plant and softly lit curtained window complete the real setting. No luxury, no shopping, no sunrise scenery, no religious props. Camera at seated eye height, medium-wide candid natural-light photograph. Keep woman and mug fully inside the central 70 percent of the image, face in upper-middle-right, generous breathing room around chair, unobtrusive floor and wall at lower-left for separate live title placement. Natural neutral daylight and warm skin tones, true anatomy, both hands believable, authentic fabric and ceramic. ONE continuous scene. Square image. Absolutely no words, numerals, printed labels, branding, Scripture, watermarks or graphic layout.

## Measured sources and exports
Peace original PNG: 1122×1402; SHA256 e54c9185a4aa9f6f3a61571a75f1a74ca4c0aaf81a283fd6e1f2f14cbff9d9ef.
Peace WebP: 174990 bytes; SHA256 5f93f84a65a30008e4ff524b41f332a64350806f2086866e928ac9ac8d6f0239.
Peaceful original PNG: 1254×1254; SHA256 80d2f8aa3edb4506525d4569bd4e3e8fb13f2754e7b69a3b61d1622c658c62f6.
Peaceful WebP: 213416 bytes; SHA256 c3b388114899bf93036be517c2cf80fd95758926da222fa793f9e73e506b25dd.
Exports used WebP quality91 without crop, resize, upscale, text composition or scene edits. Original PNGs remain original generation artifacts; QA intake uses the immutable WebPs.

## Pipeline fixes
The staging audit's overescaped extension regex classified valid .webp files as unrecognized. Corrected it and added denial/regression checks.
The previous browser intake only scanned three-file sidecars. New single-master intake reads submitted ledger bytes, verifies source blob, canonical ID/reference, dimensions, hash, provenance and focal bounds, and routes them solely into disposable QA Chromium. It renders live locale titles at 200% and focal crops at 320/390/430/800 plus100px. This does not add staging pixels to production or invent TYPE/THUMB assets.

## Approval boundary
Independent scene, rights, technical, originality and coordinator reviewers own role evidence. Producer observations never become five-role PASS automatically. These sources remain QA candidates; existing three-file coverage and production-release schema are still binding until their separate migration is implemented and certified. No production-ready or deployed-serving claim.
