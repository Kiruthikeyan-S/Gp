import * as THREE from 'three';

export interface OrganSubPart {
  id: string;
  name: string;
  side: 'left' | 'right';
  /**
   * 3D anchor coordinates in the organ group's local space.
   */
  localAnchor: [number, number, number];
  /**
   * Normalized 3D coordinates [-1..1, -1..1, -1..1] inside the organ's bounding box
   * used to partition unified 3D meshes into distinct selectable anatomical parts
   * without altering the 3D geometry or visual appearance.
   */
  normalizedAnchor: [number, number, number];
  color: string;
  /**
   * What this specific anatomical part is used for.
   */
  usedFor: string;
  /**
   * The physiological activity / action performed by this part.
   */
  activity: string;
  description: string;
}

export const ORGAN_SUB_PARTS: Record<string, OrganSubPart[]> = {
  // =========================================================================
  // 1. HEART — 13 Divided Anatomical Parts (Chambers, Valves & Great Vessels)
  // =========================================================================
  heart: [
    {
      id: 'superior_vena_cava',
      name: 'Superior Vena Cava',
      side: 'left',
      localAnchor: [-0.095, 0.22, -0.01],
      normalizedAnchor: [-0.55, 0.72, -0.05],
      color: '#0284C7',
      usedFor: 'Returning deoxygenated venous blood from the upper body (head, neck, arms, and chest) into the heart.',
      activity: 'Channels low-oxygen venous blood downward directly into the upper wall of the right atrium.',
      description:
        'Large venous trunk returning deoxygenated blood from the head, neck, chest, and arms into the right atrium.',
    },
    {
      id: 'pulmonary_vein',
      name: 'Pulmonary Veins',
      side: 'left',
      localAnchor: [-0.14, 0.085, -0.02],
      normalizedAnchor: [-0.78, 0.25, -0.25],
      color: '#EF4444',
      usedFor: 'Transporting freshly oxygenated blood from the left and right lungs into the heart.',
      activity: 'Delivers oxygen-rich arterial blood into the posterior left atrium to fuel systemic circulation.',
      description:
        'Delivers freshly oxygenated blood from the lungs into the posterior wall of the left atrium.',
    },
    {
      id: 'right_atrium',
      name: 'Right Atrium',
      side: 'left',
      localAnchor: [-0.085, 0.06, 0.02],
      normalizedAnchor: [-0.58, 0.12, 0.15],
      color: '#9F1239',
      usedFor: 'Receiving deoxygenated blood from the Superior Vena Cava, Inferior Vena Cava, and Coronary Sinus.',
      activity: 'Contains the sinoatrial (SA) natural pacemaker node; contracts to push blood through the tricuspid valve into the right ventricle.',
      description:
        'Upper-right cardiac chamber that receives deoxygenated venous blood from the venae cavae and coronary sinus.',
    },
    {
      id: 'pulmonary_valve',
      name: 'Pulmonary Valve',
      side: 'left',
      localAnchor: [-0.015, 0.055, 0.055],
      normalizedAnchor: [-0.12, 0.15, 0.55],
      color: '#F8FAFC',
      usedFor: 'One-way flow control between the right ventricle and the pulmonary artery trunk.',
      activity: 'Opens during ventricular systole to let blood enter the lungs and snaps shut during diastole to prevent backflow.',
      description:
        'Three-cusp semilunar valve at the entrance of the pulmonary trunk that prevents backflow into the right ventricle.',
    },
    {
      id: 'tricuspid_valve',
      name: 'Tricuspid Valve',
      side: 'left',
      localAnchor: [-0.065, 0.015, 0.04],
      normalizedAnchor: [-0.42, -0.08, 0.35],
      color: '#F8FAFC',
      usedFor: 'Separating the upper right atrium from the lower right ventricle.',
      activity: 'Opens to allow right ventricular filling, then seals its three leaflets tethered by chordae tendineae during contraction.',
      description:
        'Right atrioventricular valve with three leaflets preventing regurgitation from the right ventricle into the right atrium.',
    },
    {
      id: 'inferior_vena_cava',
      name: 'Inferior Vena Cava',
      side: 'left',
      localAnchor: [-0.085, -0.12, -0.015],
      normalizedAnchor: [-0.55, -0.68, -0.25],
      color: '#0284C7',
      usedFor: 'Collecting deoxygenated blood from the lower body, abdomen, pelvis, and legs.',
      activity: 'Ascends through the diaphragm to empty venous blood into the inferior aspect of the right atrium.',
      description:
        'Largest vein in the human body, carrying deoxygenated blood from the abdomen and lower limbs up into the right atrium.',
    },
    {
      id: 'right_ventricle',
      name: 'Right Ventricle',
      side: 'left',
      localAnchor: [-0.045, -0.06, 0.04],
      normalizedAnchor: [-0.32, -0.42, 0.35],
      color: '#E11D48',
      usedFor: 'Pumping deoxygenated blood to the lungs for gas exchange (pulmonary circulation).',
      activity: 'Contracts with moderate pressure to eject venous blood upward through the pulmonary valve into the pulmonary trunk.',
      description:
        'Muscular lower chamber that pumps deoxygenated blood upward through the pulmonary valve into the pulmonary artery.',
    },
    {
      id: 'aorta',
      name: 'Aorta & Aortic Arch',
      side: 'right',
      localAnchor: [0.0, 0.22, 0.01],
      normalizedAnchor: [0.05, 0.78, 0.05],
      color: '#EF4444',
      usedFor: 'Distributing oxygenated blood from the left ventricle to every organ and tissue in the body.',
      activity: 'Withstands high systolic pressure and branches into the brachiocephalic, left common carotid, and left subclavian arteries.',
      description:
        'Main systemic artery arching from the left ventricle with three superior branches supplying oxygenated blood to the body.',
    },
    {
      id: 'pulmonary_artery',
      name: 'Pulmonary Artery Trunk',
      side: 'right',
      localAnchor: [0.02, 0.15, 0.045],
      normalizedAnchor: [0.18, 0.45, 0.45],
      color: '#3B82F6',
      usedFor: 'Carrying deoxygenated blood from the right ventricle to the left and right lungs.',
      activity: 'Bifurcates into left and right pulmonary arteries so red blood cells can release CO₂ and absorb fresh O₂ in the alveoli.',
      description:
        'Arterial trunk carrying deoxygenated blood from the right ventricle to the left and right lungs for oxygenation.',
    },
    {
      id: 'left_atrium',
      name: 'Left Atrium',
      side: 'right',
      localAnchor: [0.095, 0.075, 0.01],
      normalizedAnchor: [0.58, 0.18, -0.1],
      color: '#BE123C',
      usedFor: 'Receiving newly oxygenated blood returning from the four pulmonary veins.',
      activity: 'Acts as a holding reservoir and contracts (atrial kick) to complete filling of the thick-walled left ventricle.',
      description:
        'Upper-left cardiac chamber that receives oxygenated blood from four pulmonary veins and funnels it into the left ventricle.',
    },
    {
      id: 'mitral_valve',
      name: 'Mitral (Bicuspid) Valve',
      side: 'right',
      localAnchor: [0.065, 0.02, 0.04],
      normalizedAnchor: [0.42, -0.05, 0.32],
      color: '#F8FAFC',
      usedFor: 'Regulating one-way oxygenated blood flow between the left atrium and left ventricle.',
      activity: 'Closes tightly under high left-ventricular pressure so blood is forced exclusively into the aorta.',
      description:
        'Bicuspid valve between the left atrium and left ventricle that seals shut during ventricular systole.',
    },
    {
      id: 'aortic_valve',
      name: 'Aortic Valve',
      side: 'right',
      localAnchor: [0.018, 0.05, 0.035],
      normalizedAnchor: [0.12, 0.12, 0.25],
      color: '#F8FAFC',
      usedFor: 'Guarding the exit from the left ventricle into the ascending aorta.',
      activity: 'Opens during peak ventricular contraction and closes during relaxation to maintain systemic diastolic blood pressure and fill the coronary arteries.',
      description:
        'High-pressure semilunar valve between the left ventricle and ascending aorta.',
    },
    {
      id: 'left_ventricle',
      name: 'Left Ventricle & Apex',
      side: 'right',
      localAnchor: [0.055, -0.07, 0.04],
      normalizedAnchor: [0.38, -0.48, 0.25],
      color: '#DC2626',
      usedFor: 'Powering systemic circulation to supply oxygen-rich blood to the entire human body.',
      activity: 'Features the thickest myocardium (3× thicker than the right ventricle) to generate ~120 mmHg systolic pumping pressure.',
      description:
        'Thickest-walled chamber of the heart; contracts powerfully to pump oxygenated blood through the aortic arch.',
    },
  ],

  // =========================================================================
  // 2. BRAIN — Divided Cortical Lobes, Cerebellum & Brainstem
  // =========================================================================
  brain: [
    {
      id: 'frontal_lobe_left',
      name: 'Left Frontal Lobe',
      side: 'right',
      localAnchor: [0.08, 0.08, 0.12],
      normalizedAnchor: [0.38, 0.35, 0.55],
      color: '#F472B6',
      usedFor: 'Executive decision-making, logical reasoning, speech production (Broca’s area), and voluntary motor control of the right side of the body.',
      activity: 'Generates motor commands in the precentral gyrus, coordinates expressive language, and regulates working memory and concentration.',
      description:
        'Anterior-left cerebral cortex governing executive planning, speech production, and right-body motor control.',
    },
    {
      id: 'frontal_lobe_right',
      name: 'Right Frontal Lobe',
      side: 'left',
      localAnchor: [-0.08, 0.08, 0.12],
      normalizedAnchor: [-0.38, 0.35, 0.55],
      color: '#FB7185',
      usedFor: 'Spatial attention, emotional expression, non-verbal problem-solving, and voluntary motor control of the left side of the body.',
      activity: 'Plans complex movements for the left limbs and integrates social-emotional cues and creative synthesis.',
      description:
        'Anterior-right cerebral cortex governing spatial reasoning, emotional tone, and left-body motor control.',
    },
    {
      id: 'parietal_lobe',
      name: 'Parietal Lobe (Somatosensory Cortex)',
      side: 'left',
      localAnchor: [0.0, 0.14, -0.02],
      normalizedAnchor: [0.0, 0.68, -0.05],
      color: '#C084FC',
      usedFor: 'Processing touch, temperature, pain, pressure, and 3D spatial body awareness (proprioception).',
      activity: 'Maps tactile sensory signals from the skin and muscles onto the postcentral gyrus sensory homunculus.',
      description:
        'Superior cortical region that integrates touch, temperature, pain, pressure, and 3D spatial awareness.',
    },
    {
      id: 'temporal_lobe',
      name: 'Temporal Lobe & Auditory Cortex',
      side: 'right',
      localAnchor: [0.14, -0.02, 0.03],
      normalizedAnchor: [0.68, -0.08, 0.12],
      color: '#A855F7',
      usedFor: 'Hearing, language comprehension (Wernicke’s area), facial recognition, and long-term memory formation.',
      activity: 'Decodes sound frequencies from the inner ear and works with the hippocampus to encode declarative memories.',
      description:
        'Lateral lobe responsible for auditory processing, language comprehension, and memory encoding.',
    },
    {
      id: 'occipital_lobe',
      name: 'Occipital Lobe (Visual Cortex)',
      side: 'left',
      localAnchor: [0.0, 0.04, -0.15],
      normalizedAnchor: [0.0, 0.22, -0.68],
      color: '#818CF8',
      usedFor: 'Visual perception—interpreting color, shape, depth, motion, and written text from the retinas.',
      activity: 'Receives optic tract signals via the thalamus and constructs a real-time 3D visual representation of the world.',
      description:
        'Posterior cortical pole dedicated to decoding visual signals from the retinas.',
    },
    {
      id: 'cerebellum',
      name: 'Cerebellum',
      side: 'right',
      localAnchor: [0.0, -0.11, -0.12],
      normalizedAnchor: [0.0, -0.52, -0.52],
      color: '#E879F9',
      usedFor: 'Balance, posture, equilibrium, and fine motor coordination.',
      activity: 'Continuously compares intended movement with proprioceptive feedback to smooth out muscle contractions and prevent tremor.',
      description:
        'Finely striated hindbrain structure that coordinates balance, posture, and precision motor timing.',
    },
    {
      id: 'brainstem',
      name: 'Brainstem (Midbrain, Pons & Medulla)',
      side: 'left',
      localAnchor: [0.0, -0.16, -0.02],
      normalizedAnchor: [0.0, -0.78, 0.05],
      color: '#F9A8D4',
      usedFor: 'Connecting the brain to the spinal cord and sustaining automatic life-support functions.',
      activity: 'Autonomously regulates heart rate, blood pressure, breathing rhythm, swallowing, and sleep-wake cycles.',
      description:
        'Vital relay stalk regulating automatic breathing, heart rate, blood pressure, and cranial nerve reflexes.',
    },
  ],

  // =========================================================================
  // 3. LUNGS — Trachea, Bronchi & Pulmonary Lobes
  // =========================================================================
  lungs: [
    {
      id: 'trachea',
      name: 'Trachea (Windpipe)',
      side: 'left',
      localAnchor: [0.0, 0.28, 0.0],
      normalizedAnchor: [0.0, 0.78, 0.05],
      color: '#BAE6FD',
      usedFor: 'Conducting inhaled air from the larynx down into the chest cavity.',
      activity: 'Uses C-shaped hyaline cartilage rings to stay open during inhalation while ciliated mucosa traps and clears dust.',
      description:
        'Cartilage-ringed airway conducting inhaled air from the larynx down into the mainstem bronchi.',
    },
    {
      id: 'right_upper_lobe',
      name: 'Right Superior Pulmonary Lobe',
      side: 'left',
      localAnchor: [-0.18, 0.14, 0.02],
      normalizedAnchor: [-0.55, 0.42, 0.1],
      color: '#FB7185',
      usedFor: 'Gas exchange in the upper right thoracic cavity (apical, anterior, and posterior segments).',
      activity: 'Expands during inspiration to diffuse oxygen across millions of alveolar-capillary membranes into the bloodstream.',
      description:
        'Apical and upper segment of the right lung where oxygen diffuses across millions of alveoli.',
    },
    {
      id: 'right_middle_lobe',
      name: 'Right Middle Pulmonary Lobe',
      side: 'left',
      localAnchor: [-0.20, -0.02, 0.05],
      normalizedAnchor: [-0.58, -0.05, 0.35],
      color: '#F43F5E',
      usedFor: 'Anterior-medial ventilation of the right lung between the horizontal and oblique fissures.',
      activity: 'Ventilates the anterior chest wall and exchanges O₂ and CO₂ during normal tidal breathing.',
      description:
        'Wedge-shaped middle lobe of the right lung separated by the horizontal and oblique fissures.',
    },
    {
      id: 'right_lower_lobe',
      name: 'Right Inferior Pulmonary Lobe',
      side: 'left',
      localAnchor: [-0.21, -0.18, -0.02],
      normalizedAnchor: [-0.58, -0.58, -0.15],
      color: '#E11D48',
      usedFor: 'Primary high-volume gas exchange at the base of the right lung resting on the diaphragm.',
      activity: 'Receives the largest share of gravitational blood perfusion and expands deeply when the diaphragm contracts downward.',
      description:
        'Large diaphragmatic base of the right lung responsible for the majority of tidal gas exchange.',
    },
    {
      id: 'bronchi',
      name: 'Mainstem Bronchi & Carina',
      side: 'right',
      localAnchor: [0.0, 0.12, 0.0],
      normalizedAnchor: [0.0, 0.25, 0.0],
      color: '#38BDF8',
      usedFor: 'Splitting airflow from the trachea into the left and right lungs at the bronchial carina.',
      activity: 'Branches into lobar and segmental bronchioles with smooth muscle that adjusts airway diameter.',
      description:
        'Primary left and right airway branches entering the pulmonary hilum of each lung.',
    },
    {
      id: 'left_upper_lobe',
      name: 'Left Superior Lobe & Cardiac Notch',
      side: 'right',
      localAnchor: [0.18, 0.12, 0.02],
      normalizedAnchor: [0.55, 0.38, 0.1],
      color: '#FB7185',
      usedFor: 'Upper-left pulmonary gas exchange while accommodating the heart’s apex via the cardiac notch.',
      activity: 'Oxygenates blood flowing through the left upper pulmonary capillaries and includes the tongue-like lingula.',
      description:
        'Upper lobe of the left lung featuring the cardiac notch that curves around the apex of the heart.',
    },
    {
      id: 'left_lower_lobe',
      name: 'Left Inferior Pulmonary Lobe',
      side: 'right',
      localAnchor: [0.20, -0.16, -0.02],
      normalizedAnchor: [0.58, -0.55, -0.15],
      color: '#E11D48',
      usedFor: 'Deep respiratory ventilation above the left hemidiaphragm.',
      activity: 'Draws air into the basal alveoli during diaphragmatic descent and expels carbon dioxide during exhalation.',
      description:
        'Inferior lobe of the left lung expanding against the left hemidiaphragm during inhalation.',
    },
  ],

  // =========================================================================
  // 4. LIVER — Hepatic Lobes, Caudate Lobe & Gallbladder / Porta Hepatis
  // =========================================================================
  liver: [
    {
      id: 'right_lobe',
      name: 'Right Hepatic Lobe',
      side: 'left',
      localAnchor: [-0.14, 0.02, 0.02],
      normalizedAnchor: [-0.48, 0.08, 0.1],
      color: '#B45309',
      usedFor: 'Metabolic processing, detoxification, glycogen storage, and bile synthesis (largest lobe of the liver).',
      activity: 'Hepatocytes filter portal blood, neutralize toxins and medications, synthesize plasma proteins, and secrete bile.',
      description:
        'Largest hepatic division (~65% of liver mass) performing metabolic synthesis, detoxification, and glycogen storage.',
    },
    {
      id: 'gallbladder',
      name: 'Gallbladder & Biliary Tract (Porta Hepatis)',
      side: 'left',
      localAnchor: [-0.04, -0.12, 0.06],
      normalizedAnchor: [-0.15, -0.58, 0.35],
      color: '#22C55E',
      usedFor: 'Storing and concentrating bile produced by the liver, and serving as the vascular gateway (porta hepatis).',
      activity: 'Contracts in response to cholecystokinin (CCK) after fatty meals to eject concentrated bile into the duodenum.',
      description:
        'Pear-shaped sac storing and concentrating bile to emulsify dietary fats in the duodenum.',
    },
    {
      id: 'left_lobe',
      name: 'Left Hepatic Lobe',
      side: 'right',
      localAnchor: [0.16, 0.04, 0.02],
      normalizedAnchor: [0.55, 0.15, 0.15],
      color: '#D97706',
      usedFor: 'Carbohydrate and lipid metabolism, clotting factor synthesis, and bile drainage across the midline.',
      activity: 'Converts excess glucose into glycogen, regulates blood cholesterol, and drains bile into the left hepatic duct.',
      description:
        'Tapered medial lobe extending across the epigastrium anterior to the stomach.',
    },
    {
      id: 'caudate_lobe',
      name: 'Caudate Lobe & Hepatic Venous Outflow',
      side: 'right',
      localAnchor: [0.0, 0.08, -0.08],
      normalizedAnchor: [0.0, 0.35, -0.55],
      color: '#92400E',
      usedFor: 'Independent dual-vascular hepatic processing and draining filtered blood directly into the Inferior Vena Cava.',
      activity: 'Receives blood from both right and left portal branches and empties purified blood directly into the vena cava.',
      description:
        'Posterior-superior hepatic segment draining filtered blood into the Inferior Vena Cava.',
    },
  ],

  // =========================================================================
  // 5. STOMACH — Cardia, Fundus, Body, Antrum & Pylorus
  // =========================================================================
  stomach: [
    {
      id: 'cardia',
      name: 'Cardia & Lower Esophageal Junction',
      side: 'left',
      localAnchor: [0.02, 0.14, 0.0],
      normalizedAnchor: [-0.25, 0.65, 0.0],
      color: '#FB7185',
      usedFor: 'Entry gateway where swallowed food passes from the esophagus into the stomach.',
      activity: 'Secretes protective mucus and coordinates with the lower esophageal sphincter to prevent acid reflux.',
      description:
        'Superior inlet where swallowed food enters the stomach through the lower esophageal sphincter.',
    },
    {
      id: 'pyloric_antrum',
      name: 'Pyloric Antrum',
      side: 'left',
      localAnchor: [-0.06, -0.12, 0.02],
      normalizedAnchor: [-0.35, -0.58, 0.15],
      color: '#F43F5E',
      usedFor: 'Grinding solid food particles into smooth chyme and secreting gastrin hormone.',
      activity: 'Generates strong peristaltic mixing waves and releases gastrin from G-cells to stimulate gastric acid secretion.',
      description:
        'Distal mixing chamber that grinds food particles into smooth chyme before duodenal emptying.',
    },
    {
      id: 'pyloric_sphincter',
      name: 'Pyloric Canal & Sphincter',
      side: 'left',
      localAnchor: [-0.14, -0.08, 0.0],
      normalizedAnchor: [-0.72, -0.35, 0.0],
      color: '#E11D48',
      usedFor: 'Controlling the metered release of acidic chyme from the stomach into the duodenum.',
      activity: 'Acts as a muscular gatekeeper that allows only small liquid aliquots into the small intestine at a time.',
      description:
        'Thick muscular ring regulating the metered release of acidic chyme into the duodenum.',
    },
    {
      id: 'gastric_fundus',
      name: 'Gastric Fundus',
      side: 'right',
      localAnchor: [0.10, 0.14, -0.01],
      normalizedAnchor: [0.52, 0.62, -0.1],
      color: '#FDA4AF',
      usedFor: 'Accommodating meal volume, collecting swallowed air, and signaling hunger via ghrelin.',
      activity: 'Relaxes (receptive relaxation) when food enters and houses parietal and chief cells that secrete HCl and pepsinogen.',
      description:
        'Superior dome resting beneath the left diaphragm that stores undigested food and secretes ghrelin.',
    },
    {
      id: 'gastric_body',
      name: 'Gastric Body (Corpus & Rugae)',
      side: 'right',
      localAnchor: [0.08, -0.02, 0.02],
      normalizedAnchor: [0.48, -0.08, 0.15],
      color: '#FB7185',
      usedFor: 'Chemical and mechanical breakdown of proteins using hydrochloric acid and pepsin.',
      activity: 'Churns food with gastric juice (pH 1.5–2.0) while longitudinal mucosal folds (rugae) flatten to expand stomach capacity.',
      description:
        'Central muscular chamber lined with rugae folds that secretes hydrochloric acid and pepsinogen.',
    },
  ],

  // =========================================================================
  // 6. KIDNEYS — Right/Left Kidneys, Renal Hilum, Ureters & Bladder
  // =========================================================================
  kidneys: [
    {
      id: 'right_kidney',
      name: 'Right Kidney (Cortex & Medullary Pyramids)',
      side: 'left',
      localAnchor: [-0.18, 0.25, -0.02],
      normalizedAnchor: [-0.55, 0.55, -0.1],
      color: '#EF4444',
      usedFor: 'Filtering blood plasma through ~1 million nephrons to remove urea, creatinine, and excess salts.',
      activity: 'Performs glomerular filtration, tubular reabsorption of water/glucose, and secretes erythropoietin and renin.',
      description:
        'Bean-shaped retroperitoneal organ filtering blood through ~1 million nephrons; positioned slightly lower beneath the liver.',
    },
    {
      id: 'renal_hilum',
      name: 'Renal Hilum, Pelvis & Calyces',
      side: 'left',
      localAnchor: [-0.11, 0.22, 0.0],
      normalizedAnchor: [-0.28, 0.42, 0.05],
      color: '#F59E0B',
      usedFor: 'Funneling newly formed urine from the renal pyramids into the ureter and housing the renal artery and vein.',
      activity: 'Collects urine dripping from the renal papillae into minor and major calyces and propels it into the ureter.',
      description:
        'Medial gateway where the renal artery enters, renal vein exits, and renal pelvis funnels urine.',
    },
    {
      id: 'right_ureter',
      name: 'Right Ureter',
      side: 'left',
      localAnchor: [-0.10, -0.02, 0.0],
      normalizedAnchor: [-0.32, -0.05, 0.0],
      color: '#FBBF24',
      usedFor: 'Transporting urine from the right renal pelvis down to the urinary bladder.',
      activity: 'Uses rhythmic smooth-muscle peristaltic waves every 10–30 seconds to push urine downward into the bladder.',
      description:
        'Muscular duct propelling urine from the right kidney to the bladder via peristaltic waves.',
    },
    {
      id: 'left_kidney',
      name: 'Left Kidney (Cortex & Medullary Pyramids)',
      side: 'right',
      localAnchor: [0.18, 0.28, -0.02],
      normalizedAnchor: [0.55, 0.62, -0.1],
      color: '#EF4444',
      usedFor: 'Ultrafiltration of blood plasma, electrolyte balance (Na⁺, K⁺, Ca²⁺), and blood pH regulation.',
      activity: 'Filters ~90 mL/min of filtrate across Bowman’s capsules and concentrates urine in the Loops of Henle.',
      description:
        'Superior-left retroperitoneal kidney regulating fluid volume, electrolytes, and blood pressure.',
    },
    {
      id: 'left_ureter',
      name: 'Left Ureter',
      side: 'right',
      localAnchor: [0.10, -0.02, 0.0],
      normalizedAnchor: [0.32, -0.05, 0.0],
      color: '#FBBF24',
      usedFor: 'Conveying urine from the left kidney to the posterior bladder wall.',
      activity: 'Contracts peristaltically and enters the bladder obliquely to prevent vesicoureteral reflux.',
      description:
        'Peristaltic fibromuscular tube conveying urine from the left renal pelvis to the bladder.',
    },
    {
      id: 'urinary_bladder',
      name: 'Urinary Bladder (Detrusor & Trigone)',
      side: 'right',
      localAnchor: [0.0, -0.35, 0.04],
      normalizedAnchor: [0.0, -0.75, 0.25],
      color: '#F97316',
      usedFor: 'Temporary low-pressure storage of urine collected from both kidneys.',
      activity: ' Stretches its transitional epithelium up to 400–600 mL and contracts its detrusor muscle during urination.',
      description:
        'Hollow muscular reservoir in the pelvis that stores urine prior to micturition.',
    },
  ],

  // =========================================================================
  // 7. SMALL INTESTINE — Duodenum, Jejunum, Ileum & Ileocecal Junction
  // =========================================================================
  small_intestine: [
    {
      id: 'duodenum',
      name: 'Duodenum (C-Loop)',
      side: 'left',
      localAnchor: [-0.06, 0.22, 0.0],
      normalizedAnchor: [-0.28, 0.68, 0.0],
      color: '#FB923C',
      usedFor: 'Mixing acidic chyme with alkaline pancreatic enzymes and hepatic bile.',
      activity: 'Neutralizes stomach acid with bicarbonate from Brunner’s glands and initiates enzymatic digestion of fats, carbs, and proteins.',
      description:
        'First C-shaped segment receiving bile from the liver/gallbladder and digestive enzymes from the pancreas.',
    },
    {
      id: 'ileocecal_junction',
      name: 'Terminal Ileum & Ileocecal Junction',
      side: 'left',
      localAnchor: [-0.14, -0.22, 0.0],
      normalizedAnchor: [-0.58, -0.68, 0.0],
      color: '#EA580C',
      usedFor: 'Absorbing Vitamin B12 and bile salts and preventing colonic bacteria from backing up into the small intestine.',
      activity: 'Regulates passage of digested chyme into the cecum through the muscular ileocecal sphincter.',
      description:
        'Sphincter valve controlling flow from the small intestine into the cecum while preventing bacterial reflux.',
    },
    {
      id: 'jejunum',
      name: 'Jejunum (Upper Coils)',
      side: 'right',
      localAnchor: [0.08, 0.08, 0.04],
      normalizedAnchor: [0.38, 0.25, 0.25],
      color: '#F97316',
      usedFor: 'Primary absorption of simple sugars, amino acids, fatty acids, and water-soluble vitamins.',
      activity: 'Uses tall circular folds (plicae circulares) and dense villi brush-border enzymes to transport nutrients into blood and lacteals.',
      description:
        'Thick-walled upper coils with dense villi that absorb the majority of sugars, amino acids, and fatty acids.',
    },
    {
      id: 'ileum',
      name: 'Ileum (Lower Coils)',
      side: 'right',
      localAnchor: [0.06, -0.16, 0.03],
      normalizedAnchor: [0.32, -0.45, 0.2],
      color: '#EA580C',
      usedFor: 'Final nutrient absorption, bile acid recycling, and gut immune surveillance.',
      activity: 'Contains Peyer’s patches (lymphoid nodules) that monitor intestinal flora and reabsorbs 95% of bile salts for the liver.',
      description:
        'Distal coiled section rich in Peyer’s patches that absorbs Vitamin B12 and recycles bile salts.',
    },
  ],

  // =========================================================================
  // 8. LARGE INTESTINE — Cecum, Ascending, Transverse, Descending, Sigmoid & Rectum
  // =========================================================================
  large_intestine: [
    {
      id: 'cecum_appendix',
      name: 'Cecum & Vermiform Appendix',
      side: 'left',
      localAnchor: [-0.22, -0.22, 0.02],
      normalizedAnchor: [-0.65, -0.42, 0.15],
      color: '#FB923C',
      usedFor: 'Receiving liquid chyme from the ileum and sheltering beneficial gut microbiome flora.',
      activity: 'Initiates water and electrolyte absorption while the lymphoid-rich appendix acts as a safe reservoir for commensal bacteria.',
      description:
        'First pouch of the colon receiving chyme from the ileum, attached to the lymphoid-rich appendix.',
    },
    {
      id: 'ascending_colon',
      name: 'Ascending Colon & Hepatic Flexure',
      side: 'left',
      localAnchor: [-0.22, 0.08, 0.01],
      normalizedAnchor: [-0.65, 0.22, 0.05],
      color: '#F97316',
      usedFor: 'Reabsorbing water and sodium from liquid intestinal contents on the right side of the abdomen.',
      activity: 'Uses haustral contractions (powered by taeniae coli) to slowly churn chyme upward to the hepatic flexure beneath the liver.',
      description:
        'Right-sided vertical colonic segment absorbing water and electrolytes as chyme moves upward.',
    },
    {
      id: 'transverse_colon',
      name: 'Transverse Colon',
      side: 'left',
      localAnchor: [0.0, 0.28, 0.06],
      normalizedAnchor: [0.0, 0.65, 0.35],
      color: '#F59E0B',
      usedFor: 'Propelling semi-solid stool horizontally across the upper abdomen from right to left.',
      activity: 'Performs haustral shuttling and mass peristaltic movements while bacteria ferment dietary fiber and produce Vitamin K.',
      description:
        'Horizontal colonic arch crossing the upper abdomen from the hepatic flexure to the splenic flexure.',
    },
    {
      id: 'descending_colon',
      name: 'Descending Colon & Splenic Flexure',
      side: 'right',
      localAnchor: [0.22, 0.06, 0.01],
      normalizedAnchor: [0.65, 0.18, 0.05],
      color: '#F97316',
      usedFor: 'Consolidating and storing formed stool along the left abdominal wall.',
      activity: 'Absorbs remaining water and electrolytes while mucus secreted by goblet cells lubricates the descending stool.',
      description:
        'Left-sided colonic segment that consolidates and stores stool before entering the sigmoid colon.',
    },
    {
      id: 'sigmoid_colon',
      name: 'Sigmoid Colon',
      side: 'right',
      localAnchor: [0.14, -0.25, 0.01],
      normalizedAnchor: [0.42, -0.48, 0.05],
      color: '#EA580C',
      usedFor: 'Holding formed stool in the pelvis and generating pressure waves to fill the rectum.',
      activity: 'Contracts its S-shaped muscular walls during mass peristalsis (gastrocolic reflex) to move stool into the rectum.',
      description:
        'S-shaped muscular pelvic loop that propels formed stool into the rectum.',
    },
    {
      id: 'rectum',
      name: 'Rectum & Anal Canal',
      side: 'right',
      localAnchor: [0.0, -0.42, -0.02],
      normalizedAnchor: [0.0, -0.82, -0.15],
      color: '#DC2626',
      usedFor: 'Final temporary storage of stool and triggering the defecation reflex.',
      activity: 'Stretch receptors in the rectal wall signal the spinal cord and brain to coordinate internal and external sphincter relaxation.',
      description:
        'Terminal straight chamber of the large intestine that coordinates the defecation reflex.',
    },
  ],

  // =========================================================================
  // 9. PANCREAS — Head, Neck, Body & Tail
  // =========================================================================
  pancreas: [
    {
      id: 'pancreatic_head',
      name: 'Head of Pancreas & Uncinate Process',
      side: 'left',
      localAnchor: [-0.10, -0.02, 0.0],
      normalizedAnchor: [-0.58, -0.25, 0.0],
      color: '#FBBF24',
      usedFor: 'Delivering digestive enzymes and bicarbonate into the curve of the duodenum via the ampulla of Vater.',
      activity: 'Merges the main pancreatic duct with the common bile duct to empty lipase, amylase, and proteases into the small intestine.',
      description:
        'Broad right extremity nestled inside the C-loop of the duodenum where the main pancreatic duct exits.',
    },
    {
      id: 'pancreatic_neck',
      name: 'Neck of Pancreas',
      side: 'left',
      localAnchor: [-0.02, 0.0, 0.02],
      normalizedAnchor: [-0.12, -0.05, 0.15],
      color: '#F59E0B',
      usedFor: 'Connecting the pancreatic head to the body directly anterior to the portal vein.',
      activity: 'Conducts exocrine pancreatic juice through the central duct of Wirsung toward the duodenum.',
      description:
        'Constricted bridge connecting the pancreatic head and body anterior to the superior mesenteric vessels.',
    },
    {
      id: 'pancreatic_body',
      name: 'Body of Pancreas',
      side: 'right',
      localAnchor: [0.05, 0.02, 0.01],
      normalizedAnchor: [0.25, 0.15, 0.05],
      color: '#FBBF24',
      usedFor: 'Dual exocrine enzyme synthesis (acinar cells) and endocrine blood-sugar regulation.',
      activity: 'Acinar clusters secrete trypsinogen, chymotrypsinogen, pancreatic lipase, and amylase into the main duct.',
      description:
        'Elongated central prism housing acinar cells that secrete amylase, lipase, and proteases.',
    },
    {
      id: 'pancreatic_tail',
      name: 'Tail of Pancreas (Islets of Langerhans)',
      side: 'right',
      localAnchor: [0.12, 0.05, -0.02],
      normalizedAnchor: [0.68, 0.42, -0.15],
      color: '#D97706',
      usedFor: 'Endocrine hormone secretion (insulin and glucagon) directly into the bloodstream.',
      activity: 'Beta cells release insulin to lower blood glucose after meals, while alpha cells release glucagon to raise glucose during fasting.',
      description:
        'Tapered left tip reaching the splenic hilum, densely packed with insulin- and glucagon-producing islets.',
    },
  ],

  // =========================================================================
  // 10. SPLEEN — Diaphragmatic Surface, Splenic Hilum, Anterior & Posterior Poles
  // =========================================================================
  spleen: [
    {
      id: 'diaphragmatic_surface',
      name: 'Diaphragmatic Surface (Red Pulp)',
      side: 'left',
      localAnchor: [-0.03, 0.04, -0.02],
      normalizedAnchor: [-0.35, 0.35, -0.25],
      color: '#A855F7',
      usedFor: 'Mechanical filtration of blood and recycling of aged or damaged red blood cells (erythrocytes).',
      activity: 'Macrophages in the splenic cords break down senescent red blood cells and salvage iron for new hemoglobin synthesis.',
      description:
        'Smooth convex outer capsule resting against the left diaphragm and ribs 9–11.',
    },
    {
      id: 'splenic_hilum',
      name: 'Splenic Hilum & White Pulp',
      side: 'left',
      localAnchor: [-0.02, -0.01, 0.03],
      normalizedAnchor: [-0.25, -0.05, 0.45],
      color: '#9333EA',
      usedFor: 'Vascular gateway for the splenic artery/vein and immune surveillance against blood-borne pathogens.',
      activity: 'White pulp lymphoid sheaths activate B-lymphocytes and T-lymphocytes to produce antibodies against bacteria and viruses.',
      description:
        'Medial fissure where the splenic artery and vein enter to perfuse the white and red pulp.',
    },
    {
      id: 'posterior_extremity',
      name: 'Superior (Posterior) Pole',
      side: 'right',
      localAnchor: [0.02, 0.08, -0.02],
      normalizedAnchor: [0.25, 0.65, -0.2],
      color: '#7E22CE',
      usedFor: 'Storing reserve platelets and monocytes near the upper pole of the left kidney.',
      activity: 'Maintains ~30% of the body’s platelet pool ready to be released into circulation during bleeding or tissue injury.',
      description:
        'Rounded upper pole directed toward the vertebral column and left kidney.',
    },
    {
      id: 'anterior_extremity',
      name: 'Inferior (Anterior) Pole',
      side: 'right',
      localAnchor: [0.03, -0.08, 0.02],
      normalizedAnchor: [0.35, -0.65, 0.25],
      color: '#6B21A8',
      usedFor: 'Supporting the splenic flexure of the colon and clearing opsonized microbes from blood.',
      activity: 'Filters circulating blood through venous sinusoids and removes encapsulated bacteria.',
      description:
        'Broad lower pole resting on the splenic flexure of the colon.',
    },
  ],
};

/**
 * Given a 3D world intersection point on an organ group, resolves the closest OrganSubPart
 * using normalized bounding-box coordinates [-1..1] so it works identically on both
 * procedural meshes and real .glb medical scans.
 */
export function findNearestSubPartByWorldPoint(
  organId: string,
  group: THREE.Group,
  worldPoint: THREE.Vector3
): string | null {
  const subParts = ORGAN_SUB_PARTS[organId];
  if (!subParts || subParts.length === 0) return null;

  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const hx = Math.max(size.x * 0.5, 0.001);
  const hy = Math.max(size.y * 0.5, 0.001);
  const hz = Math.max(size.z * 0.5, 0.001);

  const nx = (worldPoint.x - center.x) / hx;
  const ny = (worldPoint.y - center.y) / hy;
  const nz = (worldPoint.z - center.z) / hz;

  let bestId = subParts[0].id;
  let bestDist = Infinity;

  for (const sp of subParts) {
    const dx = nx - sp.normalizedAnchor[0];
    const dy = ny - sp.normalizedAnchor[1];
    const dz = nz - sp.normalizedAnchor[2];
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestId = sp.id;
    }
  }

  return bestId;
}

/**
 * Partitions any mesh in `group` that does not yet have an explicit `userData.subPartId`
 * into multiple sub-meshes (sharing the exact same vertex position/normal/color buffers,
 * splitting only the triangle index list by normalized anatomical zone).
 * This preserves 100% of the exact 3D visual appearance while enabling per-part 3D highlighting
 * on single-primitive scans like Brain and Stomach as well as multi-part organs.
 */
export function partitionOrganMeshesBySubParts(
  organId: string,
  meshName: string,
  systemId: string,
  group: THREE.Group,
  meshes: THREE.Mesh[],
  originalMaterials: Map<THREE.Mesh, THREE.MeshStandardMaterial>
): void {
  const subParts = ORGAN_SUB_PARTS[organId];
  if (!subParts || subParts.length === 0) return;

  group.updateMatrixWorld(true);
  const organBox = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  organBox.getCenter(center);
  organBox.getSize(size);

  const hx = Math.max(size.x * 0.5, 0.001);
  const hy = Math.max(size.y * 0.5, 0.001);
  const hz = Math.max(size.z * 0.5, 0.001);

  const currentMeshes = [...meshes];
  for (const mesh of currentMeshes) {
    if (mesh.userData?.subPartId) {
      continue;
    }

    const geo = mesh.geometry as THREE.BufferGeometry;
    const posAttr = geo.getAttribute('position');
    if (!posAttr || posAttr.count < 3) continue;

    const indexAttr = geo.getIndex();
    const triCount = indexAttr
      ? Math.floor(indexAttr.count / 3)
      : Math.floor(posAttr.count / 3);
    if (triCount === 0) continue;

    const buckets = new Map<string, number[]>();
    const vWorld = new THREE.Vector3();
    const matWorld = mesh.matrixWorld;

    for (let t = 0; t < triCount; t++) {
      const i0 = indexAttr ? indexAttr.getX(t * 3) : t * 3;
      const i1 = indexAttr ? indexAttr.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = indexAttr ? indexAttr.getX(t * 3 + 2) : t * 3 + 2;

      const cx = (posAttr.getX(i0) + posAttr.getX(i1) + posAttr.getX(i2)) / 3;
      const cy = (posAttr.getY(i0) + posAttr.getY(i1) + posAttr.getY(i2)) / 3;
      const cz = (posAttr.getZ(i0) + posAttr.getZ(i1) + posAttr.getZ(i2)) / 3;

      vWorld.set(cx, cy, cz).applyMatrix4(matWorld);

      const nx = (vWorld.x - center.x) / hx;
      const ny = (vWorld.y - center.y) / hy;
      const nz = (vWorld.z - center.z) / hz;

      let bestId = subParts[0].id;
      let bestDist = Infinity;
      for (const sp of subParts) {
        const dx = nx - sp.normalizedAnchor[0];
        const dy = ny - sp.normalizedAnchor[1];
        const dz = nz - sp.normalizedAnchor[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bestDist) {
          bestDist = d;
          bestId = sp.id;
        }
      }

      let list = buckets.get(bestId);
      if (!list) {
        list = [];
        buckets.set(bestId, list);
      }
      list.push(i0, i1, i2);
    }

    if (buckets.size <= 1) {
      const onlyId = buckets.keys().next().value || subParts[0].id;
      mesh.userData = { ...mesh.userData, subPartId: onlyId };
      continue;
    }

    const parent = mesh.parent || group;
    const baseMat = (
      originalMaterials.get(mesh) || (mesh.material as THREE.MeshStandardMaterial)
    ).clone();

    // Remove the unpartitioned mesh and replace with sub-indexed meshes sharing the vertex attributes
    parent.remove(mesh);
    const meshIdx = meshes.indexOf(mesh);
    if (meshIdx !== -1) {
      meshes.splice(meshIdx, 1);
    }
    originalMaterials.delete(mesh);

    const useUint32 = posAttr.count > 65535;
    for (const [subId, triIndices] of buckets) {
      const subGeo = new THREE.BufferGeometry();
      subGeo.setAttribute('position', posAttr);
      const normAttr = geo.getAttribute('normal');
      if (normAttr) subGeo.setAttribute('normal', normAttr);
      const colAttr = geo.getAttribute('color');
      if (colAttr) subGeo.setAttribute('color', colAttr);

      const idxArray = useUint32
        ? new Uint32Array(triIndices)
        : new Uint16Array(triIndices);
      subGeo.setIndex(new THREE.BufferAttribute(idxArray, 1));

      const subMat = baseMat.clone();
      const subMesh = new THREE.Mesh(subGeo, subMat);
      subMesh.name = `${meshName}_${subId}`;
      subMesh.position.copy(mesh.position);
      subMesh.rotation.copy(mesh.rotation);
      subMesh.scale.copy(mesh.scale);
      subMesh.userData = {
        ...mesh.userData,
        organId,
        meshName,
        systemId,
        subPartId: subId,
      };

      parent.add(subMesh);
      meshes.push(subMesh);
      originalMaterials.set(subMesh, subMat.clone());
    }
  }
}

