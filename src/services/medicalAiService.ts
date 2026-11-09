/**
 * Educational Anatomy AI Service
 * Calls the secure backend proxy when available, or provides rich offline educational anatomy references.
 *
 * NOTE: Private API keys are kept exclusively on the server and are NEVER bundled into frontend mobile code.
 */

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface EducationalAiResponse {
  text: string;
  organId?: string;
  isEducational?: boolean;
}

// Backend URLs to try: configurable via environment variable or default local dev targets
const BACKEND_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || '';

/**
 * Strips raw markdown tables or pipe columns to keep formatting clean on mobile
 */
function cleanMobileResponse(raw: string): string {
  let cleaned = raw;
  if (cleaned.includes('|') && (cleaned.includes('---') || cleaned.includes(':---'))) {
    const lines = cleaned.split('\n');
    const processedLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\|?[\s-:]+\|[\s-:|]+$/.test(trimmed)) {
        continue;
      }
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        if (cells.length > 0) {
          processedLines.push(`• ${cells.join(' — ')}`);
          continue;
        }
      }
      processedLines.push(line);
    }
    cleaned = processedLines.join('\n');
  }

  // Remove excessive consecutive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

/**
 * Detects if a major modeled organ is the subject of discussion
 */
export function detectOrganMention(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (
    lower.includes('heart') ||
    lower.includes('cardiac') ||
    lower.includes('ventricle') ||
    lower.includes('atrium') ||
    lower.includes('aorta') ||
    lower.includes('blood pressure') ||
    lower.includes('coronary')
  ) {
    return 'heart';
  }
  if (
    lower.includes('lung') ||
    lower.includes('respirat') ||
    lower.includes('alveol') ||
    lower.includes('bronch') ||
    lower.includes('trachea') ||
    lower.includes('breath')
  ) {
    return 'lungs';
  }
  if (
    lower.includes('brain') ||
    lower.includes('cerebr') ||
    lower.includes('cerebell') ||
    lower.includes('neuron') ||
    lower.includes('cortex') ||
    lower.includes('cranial') ||
    lower.includes('temporal lobe') ||
    lower.includes('frontal lobe')
  ) {
    return 'brain';
  }
  if (
    lower.includes('liver') ||
    lower.includes('hepat') ||
    lower.includes('bile') ||
    lower.includes('gallbladder')
  ) {
    return 'liver';
  }
  if (
    lower.includes('kidney') ||
    lower.includes('renal') ||
    lower.includes('nephron') ||
    lower.includes('ureter') ||
    lower.includes('bladder')
  ) {
    return 'kidneys';
  }
  if (
    lower.includes('stomach') ||
    lower.includes('gastric') ||
    lower.includes('chyme')
  ) {
    return 'stomach';
  }
  if (
    lower.includes('pancrea') ||
    lower.includes('insulin') ||
    lower.includes('glucagon')
  ) {
    return 'pancreas';
  }
  if (
    lower.includes('spleen') ||
    lower.includes('splenic')
  ) {
    return 'spleen';
  }
  if (
    lower.includes('small intestine') ||
    lower.includes('duodenum') ||
    lower.includes('jejunum') ||
    lower.includes('ileum')
  ) {
    return 'small_intestine';
  }
  if (
    lower.includes('large intestine') ||
    lower.includes('colon') ||
    lower.includes('cecum') ||
    lower.includes('rectum')
  ) {
    return 'large_intestine';
  }
  if (
    lower.includes('thyroid') ||
    lower.includes('endocrine')
  ) {
    return 'thyroid';
  }
  if (
    lower.includes('uterus') ||
    lower.includes('ovary') ||
    lower.includes('fallopian') ||
    lower.includes('reproduct')
  ) {
    return 'reproductive';
  }
  if (
    lower.includes('lymph') ||
    lower.includes('immune') ||
    lower.includes('thoracic duct')
  ) {
    return 'lymph_nodes';
  }
  if (
    lower.includes('bone') ||
    lower.includes('skelet') ||
    lower.includes('femur') ||
    lower.includes('skull') ||
    lower.includes('spine') ||
    lower.includes('rib') ||
    lower.includes('pelvis')
  ) {
    return 'skeleton';
  }
  if (
    lower.includes('muscle') ||
    lower.includes('bicep') ||
    lower.includes('tricep') ||
    lower.includes('myosin') ||
    lower.includes('deltoid') ||
    lower.includes('pectoral')
  ) {
    return 'muscles';
  }
  return undefined;
}

/**
 * Calls the secure backend proxy to generate an educational AI response.
 * Uses fast 2.5s timeouts per unique host so users never experience hangs or duplicate checks.
 */
async function callBackendChat(
  history: ChatMessagePayload[],
  newQuestion: string
): Promise<string> {
  const candidateTargets: string[] = [];
  if (BACKEND_BASE_URL) {
    candidateTargets.push(BACKEND_BASE_URL);
  }
  // Try local developer server targets
  candidateTargets.push(
    'http://localhost:3001',
    'http://10.0.2.2:3001',
    'http://192.168.88.3:3001'
  );

  // Strictly deduplicate targets so no address is ever polled or checked twice
  const uniqueTargets = Array.from(new Set(candidateTargets));

  let lastError: Error | null = null;
  for (const baseUrl of uniqueTargets) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newQuestion,
          history,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json && json.text) {
          return json.text;
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
    }
  }

  throw lastError || new Error('Backend server unreachable');
}

/**
 * Sends conversation to the Educational Anatomy Assistant
 * Deduplicates the latest message and gracefully falls back to offline anatomy knowledge.
 */
export async function queryAnatomyAiAssistant(
  history: ChatMessagePayload[],
  newQuestion: string
): Promise<EducationalAiResponse> {
  const trimmed = newQuestion.trim();

  // Deduplicate: if the last element of history is already this user question, do NOT send it twice
  const cleanedHistory = [...history];
  const lastMsg = cleanedHistory[cleanedHistory.length - 1];
  if (lastMsg && lastMsg.role === 'user' && lastMsg.content === trimmed) {
    cleanedHistory.pop();
  }

  let rawReply = '';
  try {
    rawReply = await callBackendChat(cleanedHistory, trimmed);
  } catch {
    // Immediate, seamless offline educational anatomy fallback
    rawReply = getOfflineEducationalAnswer(trimmed);
  }

  const cleanedText = cleanMobileResponse(rawReply);
  const organId = detectOrganMention(trimmed + ' ' + cleanedText);

  return {
    text: cleanedText,
    organId,
    isEducational: true,
  };
}

// Backward-compatible alias for existing imports
export const queryDoctorChatbot = queryAnatomyAiAssistant;

/**
 * Comprehensive offline educational anatomy knowledge base covering all 10 body systems and key organs
 */
function getOfflineEducationalAnswer(query: string): string {
  const lower = query.toLowerCase();

  // 1. Cardiovascular / Heart
  if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('circulation') || lower.includes('aorta')) {
    return (
      'The human heart is a four-chambered muscular pump that powers pulmonary and systemic circulation.\n\n' +
      '• Cardiac Chambers: Right atrium (receives deoxygenated venous blood), right ventricle (pumps to pulmonary trunk), left atrium (receives oxygenated blood via pulmonary veins), left ventricle (pumps into aorta under high pressure).\n' +
      '• Heart Valves: Atrioventricular valves (Tricuspid, Mitral/Bicuspid) prevent backflow during systole; Semilunar valves (Aortic, Pulmonary) prevent backflow during diastole.\n' +
      '• Cardiac Conduction: Sinoatrial (SA) node acts as natural pacemaker (~60-100 bpm), conducting electrical impulses through AV node and Purkinje fibers.\n' +
      '• Hemodynamics: Circulates roughly 7,200 liters (1,900 gallons) of blood through ~60,000 miles of vessels daily.'
    );
  }

  // 2. Nervous System / Brain
  if (lower.includes('brain') || lower.includes('cerebr') || lower.includes('neuron') || lower.includes('nervous')) {
    return (
      'The human nervous system coordinates sensory input, motor output, and higher cognition through 86 billion neurons.\n\n' +
      '• Cerebral Lobes: Frontal (executive planning, motor speech in Broca\'s area), Parietal (somatosensory processing, spatial awareness), Temporal (auditory processing, language comprehension in Wernicke\'s area, memory encoding in hippocampus), Occipital (primary visual cortex).\n' +
      '• Cerebellum: Integrates vestibular and proprioceptive signals for muscular coordination, posture, and fine motor precision.\n' +
      '• Brainstem: Midbrain, Pons, and Medulla oblongata govern vital autonomic centers for heart rate, respiratory rhythm, and vasomotor tone.\n' +
      '• Synaptic Transmission: Action potentials trigger neurotransmitter exocytosis across synapses to communicate at speeds up to 120 m/s.'
    );
  }

  // 3. Respiratory System / Lungs
  if (lower.includes('lung') || lower.includes('respirat') || lower.includes('alveol') || lower.includes('trachea')) {
    return (
      'The respiratory system ventilates pulmonary air and exchanges blood gases across alveolar membranes.\n\n' +
      '• Conducting Zone: Trachea, primary bronchi, and bronchioles warm, humidify, and filter incoming air via ciliated pseudostratified epithelium.\n' +
      '• Alveolar Gas Exchange: Over 300 million micro-alveoli provide an enormous ~70-100 m² diffusion barrier just 0.5 µm thick, where oxygen diffuses into capillary erythrocytes and CO₂ diffuses into alveolar air.\n' +
      '• Ventilation Mechanics: Diaphragm and external intercostals contract to increase thoracic volume, decreasing intrapleural pressure (Boyle\'s law) to draw air inward.\n' +
      '• Anatomy: Right lung has 3 lobes separated by horizontal and oblique fissures; Left lung has 2 lobes with the cardiac notch accommodating the pericardium.'
    );
  }

  // 4. Urinary System / Kidneys
  if (lower.includes('kidney') || lower.includes('nephron') || lower.includes('renal') || lower.includes('bladder')) {
    return (
      'The kidneys maintain plasma volume, electrolyte balance, and acid-base equilibrium while removing metabolic wastes.\n\n' +
      '• Functional Unit (Nephron): Over 1 million nephrons per kidney perform filtration, reabsorption, and secretion.\n' +
      '• Glomerular Filtration: Clears ~180 liters of blood filtrate daily; over 99% of water and electrolytes are reabsorbed along proximal tubules, loops of Henle, and distal convoluted tubules.\n' +
      '• Excretory Pathway: Urine drains from renal calyces into renal pelvis, descends bilateral ureters via peristalsis into the detrusor-lined urinary bladder, and exits via urethra.\n' +
      '• Endocrine Secretions: Produces Erythropoietin (EPO) for RBC hematopoiesis, Renin for systemic blood pressure regulation, and activates Vitamin D (calcitriol).'
    );
  }

  // 5. Digestive: Liver & Gallbladder
  if (lower.includes('liver') || lower.includes('hepat') || lower.includes('bile') || lower.includes('gallbladder')) {
    return (
      'The liver is the body\'s metabolic powerhouse, executing over 500 chemical and synthetic processes.\n\n' +
      '• Dual Vascular Supply: Receives nutrient-rich venous blood from GI tract via Hepatic Portal Vein (75%) and oxygenated blood via Hepatic Artery (25%).\n' +
      '• Biliary Synthesis: Hepatocytes continuously synthesize bile from cholesterol and bilirubin, stored and concentrated in the gallbladder, to emulsify dietary fats in the duodenum.\n' +
      '• Metabolism & Storage: Converts glucose to glycogen for storage, performs gluconeogenesis, synthesizes serum albumin and coagulation factors, and detoxifies drugs and ammonia into urea.'
    );
  }

  // 6. Digestive: Stomach
  if (lower.includes('stomach') || lower.includes('gastric') || lower.includes('chyme') || lower.includes('pepsin')) {
    return (
      'The stomach is a J-shaped muscular organ performing mechanical churning and chemical breakdown of ingested food.\n\n' +
      '• Anatomical Regions: Cardia (esophageal junction), Fundus (superior dome), Body (central reservoir), and Pylorus (distal sphincter regulating chyme release into duodenum).\n' +
      '• Gastric Secretions: Parietal cells secrete Hydrochloric Acid (pH 1.5-2.0) and Intrinsic Factor (for Vitamin B12 absorption); Chief cells secrete Pepsinogen (activated into pepsin to digest proteins).\n' +
      '• Protective Mucosa: Bicarbonate-rich mucus barrier protects the gastric epithelium against autodigestion and ulceration.'
    );
  }

  // 7. Digestive: Pancreas
  if (lower.includes('pancrea') || lower.includes('insulin') || lower.includes('glucagon')) {
    return (
      'The pancreas is a retroperitoneal gland operating as both a vital exocrine digestive organ and an endocrine endocrine regulator.\n\n' +
      '• Exocrine Function (98% of tissue): Acinar cells secrete alkaline pancreatic juice loaded with amylase (carbohydrates), trypsin/chymotrypsin (proteins), and lipase (lipids) into the duodenum via pancreatic duct.\n' +
      '• Endocrine Function (Islets of Langerhans): Beta cells secrete Insulin to promote cellular glucose uptake and glycogen storage; Alpha cells secrete Glucagon to stimulate glycogenolysis during fasting.'
    );
  }

  // 8. Immune / Lymphatic: Spleen
  if (lower.includes('spleen') || lower.includes('splenic')) {
    return (
      'The spleen is the largest lymphoid organ, positioned in the left upper quadrant under the ribcage.\n\n' +
      '• Red Pulp: Inspects systemic circulation, filters and phagocytoses senescent or abnormal red blood cells (erythrocytes), and stores platelets and reserve blood.\n' +
      '• White Pulp: Dense lymphoid follicles surrounding central arterioles that mount adaptive B-cell and T-cell immune responses against blood-borne pathogens.'
    );
  }

  // 9. Digestive: Small & Large Intestines
  if (lower.includes('intestin') || lower.includes('colon') || lower.includes('duodenum') || lower.includes('ileum') || lower.includes('digest')) {
    return (
      'The intestinal tract spans over 25 feet and is responsible for nutrient digestion, absorption, and water reclamation.\n\n' +
      '• Small Intestine (~20 ft): Duodenum (mixes chyme with bile and pancreatic enzymes), Jejunum (primary site of nutrient absorption across microvilli-lined villi), Ileum (absorbs Vitamin B12 and bile salts, ending at ileocecal valve).\n' +
      '• Large Intestine (~5 ft): Cecum (with appendix), Ascending, Transverse, Descending, Sigmoid colon, and Rectum. Absorbs remaining water and electrolytes, houses trillions of commensal gut microbiota producing Vitamin K, and forms solid stool.'
    );
  }

  // 10. Skeletal System & Bones
  if (lower.includes('bone') || lower.includes('skeleton') || lower.includes('skelet') || lower.includes('skull') || lower.includes('femur') || lower.includes('spine')) {
    return (
      'The human skeletal framework contains 206 articulated bones providing mechanical support, protection, and mineral storage.\n\n' +
      '• Axial Skeleton (80 bones): Cranium (protects brain), Vertebral Column (33 vertebrae: 7 cervical, 12 thoracic, 5 lumbar, sacrum, coccyx), and Thoracic Cage (12 pairs of ribs and sternum protecting thoracic viscera).\n' +
      '• Appendicular Skeleton (126 bones): Upper extremities (pectoral girdle, humerus, radius, ulna, carpals, phalanges) and Lower extremities (pelvic girdle, femur, patella, tibia, fibula, tarsals, phalanges).\n' +
      '• Bone Biology: Compact cortical bone provides structural strength; cancellous trabecular bone contains red marrow for hematopoiesis (blood cell production) and yellow marrow for lipid storage.'
    );
  }

  // 11. Muscular System & Contraction
  if (lower.includes('muscle') || lower.includes('muscular') || lower.includes('myosin') || lower.includes('actin') || lower.includes('bicep') || lower.includes('contraction')) {
    return (
      'The muscular system comprises over 600 skeletal muscles plus involuntary smooth and cardiac muscular tissues.\n\n' +
      '• Muscle Types: Skeletal (voluntary, multinucleated, striated fibers attached to bones via tendons), Cardiac (involuntary, branched striated fibers with intercalated discs for synchronous pumping), Smooth (involuntary, non-striated, lining visceral organs and blood vessels).\n' +
      '• Sliding Filament Mechanism: Motor nerve action potentials release calcium from the sarcoplasmic reticulum. Calcium binds troponin, shifting tropomyosin and allowing myosin heads to pull actin filaments, shortening sarcomeres.'
    );
  }

  // 12. Lymphatic & Immune System
  if (lower.includes('lymph') || lower.includes('immune') || lower.includes('node') || lower.includes('antibody') || lower.includes('infection')) {
    return (
      'The lymphatic system drains excess tissue interstitial fluid, absorbs dietary fats, and mounts immune defenses.\n\n' +
      '• Lymphatic Drainage: Blind-ended lymph capillaries collect ~3 liters of interstitial fluid daily into lymphatic vessels, flowing through chains of lymph nodes before rejoining the venous circulation via the Thoracic Duct and Right Lymphatic Duct.\n' +
      '• Lymph Nodes: Clustered at cervical, axillary, mediastinal, and inguinal sites; packed with macrophages that filter foreign particulate matter and B/T lymphocytes that proliferate during infections.\n' +
      '• Immune Defense: Innate immunity provides immediate non-specific barriers and phagocytosis; Adaptive immunity provides antigen-specific memory through antibodies and cytotoxic T cells.'
    );
  }

  // 13. Endocrine System & Thyroid
  if (lower.includes('thyroid') || lower.includes('endocrine') || lower.includes('hormone') || lower.includes('adrenal') || lower.includes('pituitary')) {
    return (
      'The endocrine system regulates growth, metabolism, reproduction, and stress responses through ductless chemical messengers (hormones).\n\n' +
      '• Master Axis: Hypothalamus and Pituitary Gland coordinate peripheral glands through releasing and stimulating hormones.\n' +
      '• Thyroid Gland: Butterfly-shaped organ on anterior larynx; follicular cells synthesize Triiodothyronine (T3) and Thyroxine (T4) using dietary iodine to set basal metabolic rate; C-cells secrete calcitonin.\n' +
      '• Adrenal Glands: Adrenal cortex produces cortisol (glucocorticoids) and aldosterone (mineral balance); Adrenal medulla produces epinephrine and norepinephrine for acute sympathetic fight-or-flight responses.'
    );
  }

  // 14. Reproductive System
  if (lower.includes('reproduct') || lower.includes('uterus') || lower.includes('ovary') || lower.includes('testis') || lower.includes('fallopian')) {
    return (
      'The reproductive system produces gametes and sex steroid hormones for human procreation.\n\n' +
      '• Female Anatomy: Paired ovaries produce secondary oocytes and estrogen/progesterone; Fallopian salpinges guide oocytes and serve as primary fertilization site; muscular uterus sustains embryonic and fetal gestation.\n' +
      '• Male Anatomy: Bilateral testes produce spermatozoa through spermatogenesis and secrete testosterone; Epididymis and vas deferens store and transmit sperm.\n' +
      '• Gametogenesis: Meiotic division reduces chromosome count to haploid (23 chromosomes), creating unique diploid zygotes upon fertilization.'
    );
  }

  // 15. Skin / Integumentary System
  if (lower.includes('skin') || lower.includes('integument') || lower.includes('dermis') || lower.includes('epidermis')) {
    return (
      'The skin (integumentary system) is the body\'s largest protective organ, comprising ~16% of total body weight.\n\n' +
      '• Epidermis: Avascular stratified squamous keratinized epithelium; keratinocytes provide waterproofing, while melanocytes synthesize UV-protective melanin.\n' +
      '• Dermis: Dense irregular connective tissue housing collagen, elastic fibers, sensory receptors (touch, pain, temperature), blood vessels, sweat glands, and hair follicles.\n' +
      '• Hypodermis (Subcutis): Adipose tissue layer providing thermal insulation, energy storage, and mechanical shock absorption.'
    );
  }

  // 16. Fluids & Homeostasis
  if (lower.includes('water') || lower.includes('hydration') || lower.includes('fluid') || lower.includes('drink')) {
    return (
      'Fluid Balance & Physiological Regulation:\n\n' +
      '• Daily Intake: Healthy adults typically require ~2.0 to 3.0 liters (8 to 12 cups) of fluid per day from beverages and moisture-rich foods.\n' +
      '• Homeostatic Regulation: Hypothalamic osmoreceptors stimulate the thirst mechanism, while the pituitary hormone Vasopressin (ADH) signals renal collecting ducts to conserve water.\n' +
      '• Compartments: Total body water constitutes ~60% of body weight, divided into intracellular fluid (67%) and extracellular plasma/interstitial fluid (33%).'
    );
  }

  // Default Comprehensive Response
  return (
    'Educational Anatomy Assistant:\n\n' +
    'The human body operates through 10 integrated organ systems cooperating to maintain biological homeostasis:\n' +
    '• Circulatory & Respiratory: Deliver oxygen and nutrients while clearing metabolic wastes.\n' +
    '• Nervous & Endocrine: Coordinate electrochemical communication and hormonal equilibrium.\n' +
    '• Skeletal & Muscular: Provide protective framework, calcium storage, and biomechanical locomotion.\n' +
    '• Digestive & Urinary: Process nutrition, regulate electrolytes, and filter blood plasma.\n' +
    '• Lymphatic & Immune: Drain interstitial fluids and guard against viral/bacterial pathogens.\n\n' +
    'Tip: Ask specifically about any organ or system (e.g., "How does the heart beat?" or "What does the liver do?") to inspect it directly in our interactive 3D Atlas!'
  );
}
