import { BodySystemId } from '../types';

export interface Flashcard {
  id: string;
  systemId: BodySystemId;
  systemName: string;
  front: string;
  back: string;
  hint?: string;
  keyStructure?: string;
  clinicalNote?: string;
}

export const FLASHCARDS: Flashcard[] = [
  // 1. Circulatory System
  {
    id: 'fc_circ_1',
    systemId: 'circulatory',
    systemName: 'Circulatory System',
    front: 'Which heart chamber pumps oxygenated blood into the systemic aorta?',
    back: 'The Left Ventricle.\nIt possesses the thickest myocardial wall (3x thicker than right ventricle) to overcome systemic vascular resistance (120 mmHg).',
    hint: 'Thickest muscular chamber on the lower left.',
    keyStructure: 'Left Ventricle',
    clinicalNote: 'Hypertension causes left ventricular hypertrophy due to sustained high afterload.',
  },
  {
    id: 'fc_circ_2',
    systemId: 'circulatory',
    systemName: 'Circulatory System',
    front: 'Where does deoxygenated venous return from the superior and inferior vena cavae enter?',
    back: 'The Right Atrium.\nIt also receives venous blood directly from the cardiac myocardium via the coronary sinus.',
    hint: 'Upper right chamber receiving venous blood.',
    keyStructure: 'Right Atrium',
    clinicalNote: 'Atrial fibrillation commonly originates around the pulmonary veins entering the left atrium.',
  },
  {
    id: 'fc_circ_3',
    systemId: 'circulatory',
    systemName: 'Circulatory System',
    front: 'What prevents the backflow of blood from the pulmonary trunk into the right ventricle during diastole?',
    back: 'The Pulmonary Semilunar Valve.\nConsists of three pocket-like semilunar cusps (anterior, left, right) that catch blood as ventricular pressure drops.',
    hint: 'A semilunar valve guarding the pulmonary artery exit.',
    keyStructure: 'Pulmonary Valve',
  },

  // 2. Respiratory System
  {
    id: 'fc_resp_1',
    systemId: 'respiratory',
    systemName: 'Respiratory System',
    front: 'What microscopic structures in the lungs are the primary sites of gas exchange?',
    back: 'The Pulmonary Alveoli.\nApproximately 300 million alveoli provide ~70 m² of surface area for passive diffusion of O₂ and CO₂ across the respiratory membrane.',
    hint: 'Tiny air sacs lined with surfactant.',
    keyStructure: 'Alveoli',
    clinicalNote: 'Type II pneumocytes produce surfactant; lack of surfactant in preemies leads to infant RDS.',
  },
  {
    id: 'fc_resp_2',
    systemId: 'respiratory',
    systemName: 'Respiratory System',
    front: 'Why is an aspirated foreign object more likely to lodge in the right main bronchus than the left?',
    back: 'The Right Main Bronchus is wider, shorter, and runs more vertically (~25° angle vs 45° on the left) due to the heart displacing the left bronchus.',
    hint: 'Angle and width difference caused by cardiac positioning.',
    keyStructure: 'Right Mainstem Bronchus',
  },

  // 3. Nervous System
  {
    id: 'fc_nerv_1',
    systemId: 'nervous',
    systemName: 'Nervous System',
    front: 'Which brain structure coordinates fine motor control, balance, equilibrium, and posture?',
    back: 'The Cerebellum.\nContains over 50% of all brain neurons despite occupying only 10% of total brain volume, organized into horizontal folia ridges.',
    hint: 'Striated "little brain" located in the posterior cranial fossa.',
    keyStructure: 'Cerebellum',
    clinicalNote: 'Damage leads to ataxia, intention tremor, and dysmetria.',
  },
  {
    id: 'fc_nerv_2',
    systemId: 'nervous',
    systemName: 'Nervous System',
    front: 'Where is Broca’s motor speech area classically situated in the dominant hemisphere?',
    back: 'Inferior Frontal Gyrus (pars opercularis & pars triangularis) of the dominant (usually left) frontal lobe.',
    hint: 'Anterior to the primary motor cortex on the lateral frontal lobe.',
    keyStructure: 'Broca\'s Area (Frontal Lobe)',
    clinicalNote: 'Broca\'s aphasia causes expressive dysphasia: broken speech with intact comprehension.',
  },
  {
    id: 'fc_nerv_3',
    systemId: 'nervous',
    systemName: 'Nervous System',
    front: 'Which vital autonomic center regulates heart rate, blood pressure, and involuntary respiration?',
    back: 'The Medulla Oblongata in the lower brainstem.\nContains the cardiac, vasomotor, and dorsal/ventral respiratory rhythmicity centers.',
    hint: 'Lowest part of the brainstem continuous with the spinal cord.',
    keyStructure: 'Medulla Oblongata',
  },

  // 4. Skeletal System
  {
    id: 'fc_skel_1',
    systemId: 'skeletal',
    systemName: 'Skeletal System',
    front: 'How many bones comprise the adult human skeleton, and what are its two major divisions?',
    back: '206 bones in total:\n1. Axial skeleton (80 bones: skull, vertebral column, thoracic cage).\n2. Appendicular skeleton (126 bones: limbs, shoulder and pelvic girdles).',
    hint: '80 axial + 126 appendicular.',
    keyStructure: 'Axial vs Appendicular Skeleton',
  },
  {
    id: 'fc_skel_2',
    systemId: 'skeletal',
    systemName: 'Skeletal System',
    front: 'What is the longest, heaviest, and strongest bone in the human body?',
    back: 'The Femur (thigh bone).\nCan support up to 30 times an adult\'s body weight; articulates proximally with the acetabulum and distally with tibia and patella.',
    hint: 'Upper leg / thigh bone.',
    keyStructure: 'Femur',
  },

  // 5. Muscular System
  {
    id: 'fc_musc_1',
    systemId: 'muscular',
    systemName: 'Muscular System',
    front: 'What is the primary muscle responsible for normal, quiet resting respiration?',
    back: 'The Diaphragm.\nA dome-shaped musculotendinous sheet separating the thoracic and abdominal cavities. Contraction flattens it, increasing thoracic volume and drawing air into the lungs.',
    hint: 'Phrenic nerve (C3, C4, C5) innervates this dome.',
    keyStructure: 'Diaphragm',
  },
  {
    id: 'fc_musc_2',
    systemId: 'muscular',
    systemName: 'Muscular System',
    front: 'Which four muscles comprise the Rotator Cuff stabilizing the glenohumeral shoulder joint?',
    back: 'SITS muscles:\n1. Supraspinatus (initiates abduction)\n2. Infraspinatus (lateral rotation)\n3. Teres Minor (lateral rotation)\n4. Subscapularis (medial rotation)',
    hint: 'Remember the acronym S.I.T.S.',
    keyStructure: 'Rotator Cuff (SITS)',
  },

  // 6. Digestive System
  {
    id: 'fc_dig_1',
    systemId: 'digestive',
    systemName: 'Digestive System',
    front: 'What is the functional dual blood supply of the liver?',
    back: '75% from the Hepatic Portal Vein (nutrient-rich, deoxygenated blood from the gut) and 25% from the Proper Hepatic Artery (oxygenated systemic blood).',
    hint: 'One portal vein + one hepatic artery.',
    keyStructure: 'Hepatic Dual Perfusion',
    clinicalNote: 'Portal hypertension can cause esophageal varices and caput medusae.',
  },
  {
    id: 'fc_dig_2',
    systemId: 'digestive',
    systemName: 'Digestive System',
    front: 'Which cells in the gastric glands secrete hydrochloric acid (HCl) and intrinsic factor?',
    back: 'Parietal (Oxyntic) Cells.\nHCl activates pepsinogen into pepsin, while intrinsic factor is required for ileal absorption of Vitamin B12.',
    hint: 'Oxyntic cells in the gastric fundus and body.',
    keyStructure: 'Parietal Cells (Stomach)',
    clinicalNote: 'Autoimmune destruction of parietal cells causes pernicious anemia.',
  },

  // 7. Urinary System
  {
    id: 'fc_uri_1',
    systemId: 'urinary',
    systemName: 'Urinary System',
    front: 'What is the functional microscopic unit of the kidney, and about how many are in each kidney?',
    back: 'The Nephron.\nEach human kidney contains approximately 1.0 to 1.2 million nephrons, consisting of a renal corpuscle (glomerulus + Bowman capsule) and renal tubule.',
    hint: 'Composed of glomerulus, proximal tubule, Loop of Henle, and distal tubule.',
    keyStructure: 'Nephron',
  },
  {
    id: 'fc_uri_2',
    systemId: 'urinary',
    systemName: 'Urinary System',
    front: 'What percentage of cardiac output is normally delivered to the bilateral kidneys at rest?',
    back: 'Approximately 20% to 25% of total cardiac output (~1,200 mL/min of renal blood flow), reflecting their continuous filtration role.',
    hint: 'Roughly one-fifth to one-fourth of heart output.',
    keyStructure: 'Renal Arteries',
  },

  // 8. Endocrine System
  {
    id: 'fc_endo_1',
    systemId: 'endocrine',
    systemName: 'Endocrine System',
    front: 'Which endocrine gland regulates basal metabolic rate via thyroxine (T4) and triiodothyronine (T3)?',
    back: 'The Thyroid Gland.\nButterfly-shaped bilobed gland situated anterior to the trachea in the neck, regulated by pituitary TSH.',
    hint: 'Located in the anterior neck below the cricoid cartilage.',
    keyStructure: 'Thyroid Gland',
  },
  {
    id: 'fc_endo_2',
    systemId: 'endocrine',
    systemName: 'Endocrine System',
    front: 'Which gland is often called the "master endocrine gland", and what bony structure houses it?',
    back: 'The Pituitary Gland (Hypophysis).\nHoused in the sella turcica of the sphenoid bone, regulated directly by hypothalamic releasing and inhibiting hormones.',
    hint: 'Sits in the sphenoid fossa beneath the optic chiasm.',
    keyStructure: 'Pituitary Gland',
  },

  // 9. Lymphatic & Immune System
  {
    id: 'fc_lymph_1',
    systemId: 'lymphatic',
    systemName: 'Lymphatic & Immune',
    front: 'What is the largest single lymphoid organ in the human body, and what are its two pulp zones?',
    back: 'The Spleen.\n1. Red pulp: filters senescent erythrocytes and stores platelets.\n2. White pulp: lymphoid cuffs initiating adaptive immune responses to blood-borne antigens.',
    hint: 'Located in the left upper quadrant under ribs 9-11.',
    keyStructure: 'Spleen',
  },
  {
    id: 'fc_lymph_2',
    systemId: 'lymphatic',
    systemName: 'Lymphatic & Immune',
    front: 'Where does the thoracic duct drain lymph from three-quarters of the body back into systemic venous circulation?',
    back: 'At the Left Venous Angle (junction of the left internal jugular and left subclavian veins).',
    hint: 'Left jugulosubclavian junction in the base of the neck.',
    keyStructure: 'Thoracic Duct',
  },

  // 10. Reproductive System
  {
    id: 'fc_rep_1',
    systemId: 'reproductive',
    systemName: 'Reproductive System',
    front: 'Where in the male reproductive tract do spermatozoa achieve functional motility and storage?',
    back: 'The Epididymis.\nA tightly coiled comma-shaped duct (~6 meters long uncoiled) resting on the posterior surface of each testis.',
    hint: 'Coiled tract capping the superior and posterior testis.',
    keyStructure: 'Epididymis',
  },
  {
    id: 'fc_rep_2',
    systemId: 'reproductive',
    systemName: 'Reproductive System',
    front: 'What is the normal anatomical site of human ovum fertilization in the female reproductive tract?',
    back: 'The Ampulla of the Fallopian (Uterine) Tube.\nThe longest, widest portion where ovulated secondary oocytes meet capacitated sperm.',
    hint: 'Curved distal third of the uterine fallopian tube.',
    keyStructure: 'Fallopian Ampulla',
    clinicalNote: 'The ampulla is the most common site of ectopic tubal pregnancy (>80%).',
  },
];
