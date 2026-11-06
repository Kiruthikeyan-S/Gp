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
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:3001';

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
    lower.includes('ureter')
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
    lower.includes('bone') ||
    lower.includes('skelet') ||
    lower.includes('femur') ||
    lower.includes('skull') ||
    lower.includes('spine')
  ) {
    return 'skeleton';
  }
  if (
    lower.includes('muscle') ||
    lower.includes('bicep') ||
    lower.includes('tricep') ||
    lower.includes('myosin')
  ) {
    return 'muscles';
  }
  return undefined;
}

/**
 * Calls the secure backend proxy to generate an educational AI response
 */
async function callBackendChat(
  history: ChatMessagePayload[],
  newQuestion: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const targets = [
    BACKEND_BASE_URL,
    'http://localhost:3001',
    'http://10.0.2.2:3001',
  ];

  let lastError: Error | null = null;
  for (const baseUrl of targets) {
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

      if (response.ok) {
        const json = await response.json();
        if (json && json.text) {
          clearTimeout(timeoutId);
          return json.text;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  clearTimeout(timeoutId);
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
    // Graceful offline educational fallback
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
 * Offline educational anatomy knowledge base
 */
function getOfflineEducationalAnswer(query: string): string {
  const lower = query.toLowerCase();

  if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('circulation')) {
    return (
      'The human heart is a four-chambered muscular organ that circulates blood through systemic and pulmonary circuits.\n\n' +
      '• Atria: The right atrium receives deoxygenated blood from the body, and the left atrium receives oxygenated blood from the lungs.\n' +
      '• Ventricles: The thicker left ventricle pumps blood into the aorta to supply the whole body, while the right ventricle pumps to the lungs.\n' +
      '• Cardiac Cycle: Generates 60 to 100 beats per minute, circulating about 5 liters of blood every minute.'
    );
  }

  if (lower.includes('brain') || lower.includes('cerebr') || lower.includes('neuron')) {
    return (
      'The human brain contains roughly 86 billion neurons and coordinates all sensory, motor, and cognitive activities.\n\n' +
      '• Cerebrum: Comprises four major lobes: Frontal (decision making), Parietal (somatosensory), Temporal (auditory & memory), and Occipital (vision).\n' +
      '• Cerebellum: Fine-tunes motor coordination, posture, and balance.\n' +
      '• Brainstem: Controls vital autonomic functions including respiration, heart rate, and blood pressure.'
    );
  }

  if (lower.includes('lung') || lower.includes('respirat') || lower.includes('alveol')) {
    return (
      'The respiratory system exchanges oxygen and carbon dioxide between the atmosphere and blood capillaries.\n\n' +
      '• Gas Exchange: Over 300 million micro-alveoli provide an enormous ~70 m² surface area for rapid gas diffusion.\n' +
      '• Mechanics: Diaphragm contraction creates negative intrapleural pressure, drawing air down the trachea and bronchial tree.\n' +
      '• Lobes: The right lung has 3 lobes (superior, middle, inferior) while the left lung has 2 lobes to fit the cardiac notch.'
    );
  }

  if (lower.includes('kidney') || lower.includes('nephron') || lower.includes('renal')) {
    return (
      'The kidneys maintain fluid and electrolyte homeostasis while filtering metabolic wastes from blood plasma.\n\n' +
      '• Nephrons: Each kidney houses over 1 million functional nephrons that continuously filter blood, reabsorbing 99% of water and essential ions.\n' +
      '• Glomerular Filtration: Clears approximately 180 liters of plasma filtrate every 24 hours.\n' +
      '• Endocrine Role: Secretes erythropoietin (stimulating red blood cell production) and renin (regulating arterial pressure).'
    );
  }

  if (lower.includes('liver') || lower.includes('bile') || lower.includes('hepat')) {
    return (
      'The liver is the largest internal organ and performs over 500 vital metabolic, digestive, and synthetic functions.\n\n' +
      '• Dual Inflow: Receives oxygenated blood via the hepatic artery and nutrient-rich venous blood from the GI tract via the portal vein.\n' +
      '• Digestion: Continuously produces bile salts to emulsify dietary lipids in the small intestine.\n' +
      '• Storage & Synthesis: Stores glycogen, synthesizes major plasma proteins (albumin, clotting factors), and detoxifies xenobiotics.'
    );
  }

  if (lower.includes('bone') || lower.includes('skeleton') || lower.includes('skelet')) {
    return (
      'The adult human skeleton consists of 206 bones divided into axial and appendicular frameworks.\n\n' +
      '• Axial Skeleton (80 bones): Includes skull, vertebral column, ribs, and sternum to protect the central nervous system and thoracic viscera.\n' +
      '• Appendicular Skeleton (126 bones): Comprises shoulder girdles, upper limbs, pelvic girdle, and lower limbs for locomotion.\n' +
      '• Mineral Reservoir: Stores 99% of body calcium and houses hematopoietic bone marrow.'
    );
  }

  if (lower.includes('muscle') || lower.includes('muscular')) {
    return (
      'The muscular system comprises over 600 skeletal muscles plus cardiac and smooth muscle tissues.\n\n' +
      '• Skeletal Muscle: Voluntary, striated muscle fibers contracting via sliding actin and myosin filaments.\n' +
      '• Cardiac Muscle: Involuntary, branched, striated fibers with intercalated discs enabling synchronized contractions.\n' +
      '• Smooth Muscle: Non-striated, involuntary muscle in blood vessel walls, bronchioles, and digestive tracts.'
    );
  }

  if (lower.includes('water') || lower.includes('hydration') || lower.includes('drink')) {
    return (
      'Daily Fluid Intake & Physiological Reference:\n\n' +
      '• Adult Reference: Healthy adults typically require ~2.0 to 3.0 liters (8 to 12 cups) of fluid per day from beverages and foods.\n' +
      '• Key Regulators: The hypothalamic thirst center and renal vasopressin (ADH) dynamically adjust water retention.\n' +
      '• Factors: Physical exertion, climate, and metabolic demand increase hydration requirements.'
    );
  }

  return (
    'Educational Anatomy Reference:\n\n' +
    'The human body functions as an integrated network of 10 organ systems working together to maintain homeostasis.\n' +
    '• You can tap any organ name to inspect its anatomical structure in our interactive 3D Atlas.\n' +
    '• For clinical health concerns or symptoms, always consult a qualified medical professional.'
  );
}
