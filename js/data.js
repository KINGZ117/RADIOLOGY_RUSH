/* RADIOLOGY RUSH — content data: gems, worlds, levels, and the term deck. */
(function (RR) {
  'use strict';

  /* ---------- gems: colour AND silhouette AND glyph, never colour alone ---------- */
  RR.GEMS = [
    { id: 'ct',       name: 'CT Slice',    sprite: 'tile-ct.png',       color: '#3fd8f5', glow: '#8ff4ff', glyph: '⬢' },
    { id: 'mri',      name: 'MRI Coil',    sprite: 'tile-mri.png',      color: '#b096f8', glow: '#d9a6ff', glyph: '◆' },
    { id: 'xray',     name: 'X-ray Plate', sprite: 'tile-xray.png',     color: '#ffb43f', glow: '#ffd98a', glyph: '■' },
    { id: 'us',       name: 'Probe',       sprite: 'tile-us.png',       color: '#3ff2c8', glow: '#9dffe9', glyph: '▲' },
    { id: 'tracer',   name: 'Radiotracer', sprite: 'tile-tracer.png',   color: '#c9f24a', glow: '#eaff9a', glyph: '●' },
    { id: 'contrast', name: 'Contrast',    sprite: 'tile-contrast.png', color: '#ff5f8a', glow: '#ffa8c0', glyph: '✚' }
  ];
  RR.GEM_INDEX = {};
  RR.GEMS.forEach(function (g, i) { g.i = i; RR.GEM_INDEX[g.id] = g; });

  RR.SPECIALS = {
    beam:  { sprite: 'tile-bomb.png',  label: 'Collimator Beam' },
    bolus: { sprite: 'tile-bomb.png',  label: 'Contrast Bolus' },
    core:  { sprite: 'tile-prism.png', label: 'Recon Core' }
  };

  /* ---------- bosses: each one rewrites a board rule ---------- */
  RR.BOSSES = {
    rogue: {
      id: 'rogue', name: 'The Rogue Cell', sprite: 'boss-rogue.png',
      rule: 'Infects a tile every 3 moves. Infected tiles cannot be matched until a neighbouring match cleans them.',
      taunt: ['You call that a read?', 'I divide faster than you match.', 'Missed me.'],
      color: '#ff5fd0'
    },
    wraith: {
      id: 'wraith', name: 'The Motion Artifact', sprite: 'boss-wraith.png',
      rule: 'Blurs a 3×3 block. Blurred tiles are unmatchable — only a special piece cuts through.',
      taunt: ['Hold still. Or don\'t.', 'Everything is a ghost.', 'Blurry, isn\'t it?'],
      color: '#8fe9ff'
    },
    golem: {
      id: 'golem', name: 'The Implant Golem', sprite: 'boss-golem.png',
      rule: 'Armors tiles in chrome. Armored tiles need two hits before they clear.',
      taunt: ['Titanium beats talent.', 'Try harder.', 'Streak artifact incoming.'],
      color: '#ffa14a'
    }
  };

  /* ---------- worlds: one universe, six weathers ---------- */
  RR.WORLDS = [
    { id: 1, key: 'ct',     name: 'Slice City',           dept: 'Computed Tomography', plate: 'plate-ct.jpg',    loop: 'world1-ct.mp4',    accent: '#3fd8f5', boss: 'rogue',
      blurb: 'The gantry rings never stop turning. Learn to read what a slice actually is.' },
    { id: 2, key: 'mri',    name: 'Resonance Cathedral',  dept: 'Magnetic Resonance',  plate: 'plate-mri.jpg',   loop: 'world2-mri.mp4',   accent: '#b096f8', boss: 'wraith',
      blurb: 'Field lines sing in the bore. Sequences, signal, and the safety that comes first.' },
    { id: 3, key: 'xray',   name: 'Bone Foundry',         dept: 'Radiography',         plate: 'plate-xray.jpg',  loop: 'world3-xray.mp4',  accent: '#ffb43f', boss: 'golem',
      blurb: 'Where radiographs are cast in hard light. Attenuation, density, and the grey scale.' },
    { id: 4, key: 'us',     name: 'Echo Reef',            dept: 'Ultrasound',          plate: 'plate-us.jpg',    loop: 'world4-us.mp4',    accent: '#3ff2c8', boss: 'wraith',
      blurb: 'Sound goes out, sound comes back. No radiation, all technique.' },
    { id: 5, key: 'tracer', name: 'Tracer Nebula',        dept: 'Nuclear Medicine',    plate: 'plate-nuc.jpg',   loop: 'world5-nuc.mp4',   accent: '#c9f24a', boss: 'rogue',
      blurb: 'Physiology lights up in the dark. Tracers, half-lives, and paired photons.' },
    { id: 6, key: 'cath',   name: 'The Angio Suite',      dept: 'Cardiac Cath Lab',    plate: 'plate-cath.jpg',  loop: 'world6-cath.mp4',  accent: '#ff6b5a', boss: 'golem',
      blurb: 'The C-arm swings, the traces scroll, and nothing here waits for you.' },
    { id: 7, key: 'boss',   name: 'The Reading Room',     dept: 'Diagnostic Reading',  plate: 'plate-boss.jpg',  loop: 'world7-boss.mp4',  accent: '#ff5a5a', boss: 'rogue',
      blurb: 'Everything you have learned, and a wall of monitors that disagrees.' }
  ];

  /* ---------- levels: 6 worlds × 5, objectives never repeat back to back ---------- */
  var OBJ = ['score', 'collect', 'fog', 'files', 'boss'];
  RR.LEVELS = [];
  RR.WORLDS.forEach(function (w, wi) {
    for (var i = 0; i < 5; i++) {
      var type = OBJ[i];
      var n = wi * 5 + i + 1;
      var lvl = { n: n, world: w.id, type: type, moves: 0, star: [0, 0, 0] };
      var scale = 1 + wi * 0.42 + i * 0.13;
      if (type === 'score') { lvl.moves = 24; lvl.target = Math.round(2600 * scale / 100) * 100; }
      if (type === 'collect') {
        lvl.moves = 26;
        lvl.gem = RR.GEMS[(wi + i) % 6].id;
        lvl.target = 14 + wi * 4;
      }
      if (type === 'fog')   { lvl.moves = 28; lvl.target = 10 + wi * 3; }
      if (type === 'files') { lvl.moves = 30; lvl.target = Math.min(3 + Math.floor(wi / 2), 5); }
      if (type === 'boss')  { lvl.moves = 34; lvl.boss = w.boss; lvl.target = 100 + wi * 30; }
      // star thresholds derive from the objective and from how much score that
      // objective naturally produces — never hand-typed
      var BASE = { score: 0, collect: 4500, fog: 4500, files: 3200, boss: 5000 };
      var base = type === 'score' ? lvl.target : Math.round(BASE[type] * scale / 100) * 100;
      lvl.star = [base, Math.round(base * 1.55), Math.round(base * 2.25)];
      RR.LEVELS.push(lvl);
    }
  });

  RR.OBJECTIVE_TEXT = function (l) {
    var g = l.gem && RR.GEM_INDEX[l.gem];
    switch (l.type) {
      case 'score':   return 'Reach ' + l.target.toLocaleString() + ' points';
      case 'collect': return 'Collect ' + l.target + ' × ' + g.name;
      case 'fog':     return 'Clear ' + l.target + ' artifact tiles';
      case 'files':   return 'Deliver ' + l.target + ' case files to the bottom';
      case 'boss':    return 'Defeat the boss';
    }
  };

  /* ---------- the term deck: descriptive language only, no diagnostic claims ---------- */
  RR.TERMS = [
    ['axial','A horizontal imaging plane that divides the body into upper and lower portions.','CT images are commonly acquired as axial slices, then reformatted into other planes.','ANATOMY',1],
    ['coronal','A vertical imaging plane that divides the body into front and back portions.','A coronal sinus CT shows both maxillary sinuses side by side.','ANATOMY',1],
    ['sagittal','A vertical imaging plane that divides the body into right and left portions.','A sagittal lumbar MRI displays the vertebral bodies and discs in profile.','ANATOMY',1],
    ['contrast','A substance used to make selected tissues, organs, or vessels more visible on images.','IV contrast can help a CT show blood vessels and organ enhancement more clearly.','CONTRAST',1],
    ['protocol','The planned technical recipe for how an imaging exam is performed.','A renal stone CT protocol is tailored differently from a pulmonary angiography protocol.','WORKFLOW',1],
    ['sequence','A set of MRI pulse and timing parameters that produces a specific tissue contrast.','A brain MRI combines multiple sequences because each highlights different tissue properties.','MRI',1],
    ['artifact','An image feature caused by the equipment, patient, or technique rather than true anatomy.','Patient motion may blur detail and create ghosting on MRI.','IMAGE QUALITY',1],
    ['gantry','The ring-shaped part of a CT scanner that houses the x-ray tube and detectors.','The patient table moves through the CT gantry while data are acquired.','CT',1],
    ['coil','An MRI device used to transmit radiofrequency energy, receive signal, or both.','A dedicated knee coil places the receiver close to the joint for stronger signal.','MRI',1],
    ['slice','A single cross-sectional image representing a selected thickness of anatomy.','Thin CT slices allow detailed multiplanar and three-dimensional reformations.','IMAGING',1],
    ['windowing','Adjusting the grayscale range used to display CT attenuation values.','Lung windows reveal airways and parenchyma; mediastinal windows better show soft tissue.','CT',2],
    ['attenuation','The reduction of an x-ray beam as it passes through matter; it determines CT brightness.','Dense cortical bone attenuates more x-rays and appears brighter than air on CT.','CT PHYSICS',2],
    ['hounsfield','The standardized CT scale used to express tissue attenuation in Hounsfield units.','Water is near 0 HU, air near -1000 HU, and dense bone has high positive values.','CT PHYSICS',2],
    ['hyperdense','Brighter than surrounding tissue on CT because of greater x-ray attenuation.','Acute intracranial blood often appears hyperdense on a noncontrast head CT.','CT',2],
    ['hypodense','Darker than surrounding tissue on CT because of lower x-ray attenuation.','Simple fluid is usually hypodense compared with soft tissue on CT.','CT',2],
    ['iodinated','Containing iodine; the main type of intravascular contrast used for CT and x-ray exams.','A chest CTA uses IV iodinated contrast to opacify the pulmonary arteries.','CT CONTRAST',2],
    ['gadolinium','The key component in the contrast agents most often used for MRI.','Gadolinium may be used on brain MRI to show abnormal tissue enhancement.','MR CONTRAST',2],
    ['enhancement','An increase in tissue signal or attenuation after contrast administration.','Comparing pre- and post-contrast images can show whether a lesion enhances.','CONTRAST',2],
    ['angiography','Imaging focused on blood vessels, performed with CT, MRI, or catheter x-ray techniques.','CT pulmonary angiography evaluates the pulmonary arteries for emboli.','VASCULAR',2],
    ['perfusion','Imaging that evaluates how blood flows through tissue.','CT perfusion can help assess blood flow in a patient with suspected acute stroke.','NEURO',2],
    ['diffusion','An MRI technique sensitive to the microscopic movement of water molecules.','Restricted diffusion may appear early in an acute ischemic stroke.','MRI',2],
    ['flair','An MRI sequence that suppresses free-fluid signal to make nearby abnormalities easier to see.','FLAIR can make many white-matter lesions more conspicuous near cerebrospinal fluid.','MRI',2],
    ['radiopaque','Blocking x-rays and therefore appearing relatively white on a radiograph.','Metal and dense bone are radiopaque on x-ray images.','X-RAY',2],
    ['bolus','A measured amount of contrast injected over a short period for timed imaging.','CTA acquisition is timed to the contrast bolus reaching the target arteries.','CONTRAST',2],
    ['reconstruction','The mathematical creation of images from scanner data, often in multiple planes or kernels.','Chest CT data may be reconstructed with both soft-tissue and sharp lung algorithms.','CT',3],
    ['multiplanar','Reformatted or acquired in more than one anatomical plane.','Axial CT data can be reformatted into coronal and sagittal views.','POSTPROCESS',3],
    ['extravasation','Accidental leakage of injected contrast from a vein into surrounding soft tissue.','New swelling or pain at the IV site during injection can indicate extravasation.','CONTRAST SAFETY',3],
    ['screening','The safety check performed before imaging, especially important before entering the MRI environment.','MRI screening identifies implants, devices, metal exposure, and other possible hazards.','MR SAFETY',3],
    ['susceptibility','An MRI effect caused by differences in how materials respond to a magnetic field.','Blood products or metal may produce signal loss and distortion on susceptibility-sensitive images.','MRI PHYSICS',3],
    ['hyperintense','Brighter than a comparison tissue on a specified MRI sequence.','Fluid is often hyperintense on T2-weighted images, but the sequence must always be stated.','MRI',3],
    ['hypointense','Darker than a comparison tissue on a specified MRI sequence.','Cortical bone is typically hypointense on routine MRI sequences.','MRI',3],
    ['contraindication','A condition or factor that makes an exam, agent, or technique inadvisable or requires special review.','An implant with unknown MRI safety status requires evaluation before scanning.','SAFETY',3],
    ['spectroscopy','An MRI technique that measures chemical compounds within a selected tissue volume.','MR spectroscopy may add metabolic information when evaluating a brain lesion.','ADVANCED MRI',4],
    ['elastography','Imaging that estimates tissue stiffness using ultrasound or MRI techniques.','Liver elastography can noninvasively assess stiffness related to fibrosis.','ADVANCED',4],
    ['tomosynthesis','A limited-angle x-ray technique that reconstructs thin image sections.','Digital breast tomosynthesis reduces tissue overlap compared with a standard 2D mammogram.','BREAST',4],
    ['radiotracer','A molecule linked to a small amount of radioactive material for imaging or therapy.','The distribution of a radiotracer can reveal organ function or molecular activity.','NUCLEAR',2],
    ['scintillation','A tiny flash of light produced when radiation deposits energy in a detector crystal.','Gamma-camera crystals convert gamma-ray interactions into light signals for image formation.','NUCLEAR PHYSICS',3],
    ['collimator','A device with many channels that accepts gamma rays traveling in selected directions.','A gamma-camera collimator trades sensitivity for spatial resolution depending on its design.','SPECT',3],
    ['coincidence','Near-simultaneous detection of two annihilation photons on opposite sides of a PET scanner.','PET electronics use coincidence events to localize a line of response.','PET',3],
    ['uptake','The accumulation of a radiotracer in a tissue or organ.','Increased FDG uptake can reflect elevated glucose metabolism but is not specific to cancer.','PET',1],
    ['halflife','The time required for half of a radionuclide\'s atoms to decay.','A short physical half-life can reduce how long a diagnostic tracer remains radioactive.','NUCLEAR PHYSICS',2],
    ['dosimetry','Calculation or measurement of absorbed radiation dose.','Patient-specific dosimetry can help plan selected radiopharmaceutical therapies.','NUCLEAR',3],
    ['technetium','A chemical element whose metastable isotope Tc-99m is widely used in diagnostic nuclear medicine.','Tc-99m can label agents for bone, cardiac, renal, and hepatobiliary imaging.','SPECT',3],
    ['gating','Synchronizing image acquisition or reconstruction with a physiologic signal such as the ECG.','Cardiac gating can assess ventricular wall motion and ejection fraction.','CARDIOVASCULAR',2],
    ['stenosis','An abnormal narrowing of a vessel, valve, or other passage.','Coronary CTA can demonstrate narrowing caused by plaque in a coronary artery.','CARDIOVASCULAR',2],
    ['embolism','An obstruction of a vessel by material carried through the bloodstream, often a clot.','CT pulmonary angiography is commonly used to evaluate suspected pulmonary embolism.','CARDIOVASCULAR',2],
    ['ventilation','Movement of air into and out of the lungs.','A V/Q scan compares lung ventilation with perfusion to assess for mismatch.','NUCLEAR',2],
    ['metabolism','The chemical processes that sustain cells and tissues.','FDG PET visualizes relative glucose metabolism rather than anatomy alone.','PET',2]
  ].map(function (t, i) {
    return { i: i, word: t[0], definition: t[1], example: t[2], specialty: t[3], difficulty: t[4] };
  });

  RR.RANKS = [
    { xp: 0,     name: 'Student' },
    { xp: 4000,  name: 'Intern' },
    { xp: 12000, name: 'Resident' },
    { xp: 26000, name: 'Fellow' },
    { xp: 48000, name: 'Attending' },
    { xp: 80000, name: 'Chief' }
  ];
  RR.rankFor = function (xp) {
    var r = RR.RANKS[0];
    for (var i = 0; i < RR.RANKS.length; i++) if (xp >= RR.RANKS[i].xp) r = RR.RANKS[i];
    return r;
  };
})(window.RR = window.RR || {});
