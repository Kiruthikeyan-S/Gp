export interface OrganSubPart {
  id: string;
  name: string;
  side: 'left' | 'right';
  /**
   * 3D anchor coordinates in the organ group's local space (or world-offset relative to focusCenter).
   */
  localAnchor: [number, number, number];
  color: string;
  description: string;
}

export const ORGAN_SUB_PARTS: Record<string, OrganSubPart[]> = {
  // 1. HEART — All 13 Labeled Cross-Section Parts matching Reference Diagram
  heart: [
    // Left Column (top to bottom)
    {
      id: 'superior_vena_cava',
      name: 'superior vena cava',
      side: 'left',
      localAnchor: [-0.118, 0.21, 0.015],
      color: '#0284C7',
      description:
        'Large venous trunk returning deoxygenated blood from the head, neck, chest, and arms into the right atrium.',
    },
    {
      id: 'pulmonary_vein',
      name: 'pulmonary vein',
      side: 'left',
      localAnchor: [-0.165, 0.082, 0.0],
      color: '#EF4444',
      description:
        'Delivers freshly oxygenated blood from the lungs into the posterior wall of the left atrium.',
    },
    {
      id: 'right_atrium',
      name: 'right atrium',
      side: 'left',
      localAnchor: [-0.102, 0.035, 0.055],
      color: '#9F1239',
      description:
        'Upper-right cardiac chamber that receives deoxygenated venous blood from the venae cavae and coronary sinus.',
    },
    {
      id: 'pulmonary_valve',
      name: 'pulmonary valve',
      side: 'left',
      localAnchor: [-0.022, 0.018, 0.076],
      color: '#F8FAFC',
      description:
        'Three-cusp semilunar valve at the entrance of the pulmonary trunk that prevents backflow into the right ventricle.',
    },
    {
      id: 'tricuspid_valve',
      name: 'tricuspid valve',
      side: 'left',
      localAnchor: [-0.076, -0.024, 0.068],
      color: '#F8FAFC',
      description:
        'Right atrioventricular valve with three leaflets preventing regurgitation from the right ventricle into the right atrium.',
    },
    {
      id: 'inferior_vena_cava',
      name: 'inferior vena cava',
      side: 'left',
      localAnchor: [-0.125, -0.165, -0.01],
      color: '#0284C7',
      description:
        'Largest vein in the human body, carrying deoxygenated blood from the abdomen and lower limbs up into the right atrium.',
    },
    {
      id: 'right_ventricle',
      name: 'right ventricle',
      side: 'left',
      localAnchor: [-0.042, -0.105, 0.062],
      color: '#9F1239',
      description:
        'Muscular lower chamber that pumps deoxygenated blood upward through the pulmonary valve into the pulmonary artery.',
    },

    // Right Column (top to bottom)
    {
      id: 'aorta',
      name: 'aorta',
      side: 'right',
      localAnchor: [0.025, 0.215, 0.015],
      color: '#EF4444',
      description:
        'Main systemic artery arching from the left ventricle with three superior branches supplying oxygenated blood to the body.',
    },
    {
      id: 'pulmonary_artery',
      name: 'pulmonary artery',
      side: 'right',
      localAnchor: [0.095, 0.162, 0.045],
      color: '#0284C7',
      description:
        'Arterial trunk carrying deoxygenated blood from the right ventricle to the left and right lungs for oxygenation.',
    },
    {
      id: 'left_atrium',
      name: 'left atrium',
      side: 'right',
      localAnchor: [0.092, 0.065, 0.052],
      color: '#9F1239',
      description:
        'Upper-left cardiac chamber that receives oxygenated blood from four pulmonary veins and funnels it into the left ventricle.',
    },
    {
      id: 'mitral_valve',
      name: 'mitral valve',
      side: 'right',
      localAnchor: [0.082, 0.005, 0.068],
      color: '#F8FAFC',
      description:
        'Bicuspid valve between the left atrium and left ventricle that seals shut during ventricular systole.',
    },
    {
      id: 'aortic_valve',
      name: 'aortic valve',
      side: 'right',
      localAnchor: [0.032, 0.014, 0.072],
      color: '#F8FAFC',
      description:
        'High-pressure semilunar valve between the left ventricle and ascending aorta.',
    },
    {
      id: 'left_ventricle',
      name: 'left ventricle',
      side: 'right',
      localAnchor: [0.068, -0.095, 0.062],
      color: '#9F1239',
      description:
        'Thickest-walled chamber of the heart; contracts powerfully to pump oxygenated blood through the aortic arch.',
    },
  ],

  // 2. BRAIN — Cortical Lobes, Cerebellum & Brainstem
  brain: [
    {
      id: 'frontal_lobe',
      name: 'frontal lobe',
      side: 'left',
      localAnchor: [-0.095, 2.04, 0.12],
      color: '#F4B4AA',
      description:
        'Anterior cerebral cortex governing executive decision-making, voluntary motor control, and speech production.',
    },
    {
      id: 'temporal_lobe',
      name: 'temporal lobe',
      side: 'left',
      localAnchor: [-0.145, 1.87, 0.05],
      color: '#E89B90',
      description:
        'Lateral cerebral lobe responsible for auditory processing, language comprehension, and memory encoding.',
    },
    {
      id: 'pons_medulla',
      name: 'brainstem',
      side: 'left',
      localAnchor: [0.0, 1.72, -0.04],
      color: '#F5D0C8',
      description:
        'Pons and medulla oblongata regulating autonomous breathing, heart rate, and cranial nerve reflexes.',
    },
    {
      id: 'parietal_lobe',
      name: 'parietal lobe',
      side: 'right',
      localAnchor: [0.098, 2.06, -0.04],
      color: '#F4B4AA',
      description:
        'Superior cortical region integrating somatosensory touch, temperature, proprioception, and spatial awareness.',
    },
    {
      id: 'occipital_lobe',
      name: 'occipital lobe',
      side: 'right',
      localAnchor: [0.085, 1.94, -0.16],
      color: '#E09287',
      description:
        'Posterior cerebral cortex housing the primary visual cortex for processing sight, color, and motion.',
    },
    {
      id: 'cerebellum',
      name: 'cerebellum',
      side: 'right',
      localAnchor: [0.075, 1.79, -0.13],
      color: '#DFA099',
      description:
        'Striated hindbrain structure coordinating fine motor precision, posture, balance, and motor learning.',
    },
  ],

  // 3. LUNGS — Trachea, Bronchi & Pulmonary Lobes
  lungs: [
    {
      id: 'trachea',
      name: 'trachea',
      side: 'left',
      localAnchor: [0.0, 0.34, 0.01],
      color: '#93C5FD',
      description:
        'Cartilaginous C-ringed windpipe conducting inhaled air from the larynx down to the bronchial carina.',
    },
    {
      id: 'right_superior_lobe',
      name: 'right upper lobe',
      side: 'left',
      localAnchor: [-0.175, 0.14, 0.04],
      color: '#E67E76',
      description:
        'Apical section of the three-lobed right lung sitting superior to the horizontal fissure.',
    },
    {
      id: 'right_inferior_lobe',
      name: 'right lower lobe',
      side: 'left',
      localAnchor: [-0.195, -0.14, 0.02],
      color: '#D1655D',
      description:
        'Broad diaphragmatic base of the right lung containing dense alveolar capillary beds for gas exchange.',
    },
    {
      id: 'left_superior_lobe',
      name: 'left upper lobe',
      side: 'right',
      localAnchor: [0.175, 0.14, 0.04],
      color: '#E67E76',
      description:
        'Upper division of the left lung featuring the lingula and oblique interlobar fissure.',
    },
    {
      id: 'cardiac_notch',
      name: 'cardiac notch',
      side: 'right',
      localAnchor: [0.115, -0.04, 0.05],
      color: '#F87171',
      description:
        'Medial concavity on the anterior border of the left lung accommodating the apex of the heart.',
    },
    {
      id: 'left_inferior_lobe',
      name: 'left lower lobe',
      side: 'right',
      localAnchor: [0.195, -0.15, 0.02],
      color: '#D1655D',
      description:
        'Inferior lobe of the left lung resting directly upon the left dome of the thoracic diaphragm.',
    },
  ],

  // 4. LIVER — Hepatic Lobes, Ligament & Gallbladder
  liver: [
    {
      id: 'right_hepatic_lobe',
      name: 'right hepatic lobe',
      side: 'left',
      localAnchor: [-0.14, 0.54, 0.1],
      color: '#853228',
      description:
        'Largest functional lobe of the liver, performing metabolic detoxification, glycogen storage, and bile synthesis.',
    },
    {
      id: 'gallbladder',
      name: 'gallbladder',
      side: 'left',
      localAnchor: [-0.14, 0.41, 0.14],
      color: '#65A30D',
      description:
        'Pear-shaped biliary sac tucked beneath the right lobe that stores and concentrates bile for lipid digestion.',
    },
    {
      id: 'falciform_ligament',
      name: 'falciform ligament',
      side: 'right',
      localAnchor: [-0.03, 0.54, 0.17],
      color: '#F8FAFC',
      description:
        'Fibrous peritoneal fold anatomically dividing the right and left lobes and anchoring the liver to the anterior wall.',
    },
    {
      id: 'left_hepatic_lobe',
      name: 'left hepatic lobe',
      side: 'right',
      localAnchor: [0.06, 0.56, 0.11],
      color: '#993B30',
      description:
        'Tapered medial lobe extending across the epigastrium superior to the lesser curvature of the stomach.',
    },
  ],

  // 5. STOMACH — Cardia, Fundus, Body & Pylorus
  stomach: [
    {
      id: 'cardia',
      name: 'cardia',
      side: 'left',
      localAnchor: [0.04, 0.63, 0.04],
      color: '#F0938C',
      description:
        'Superior inlet where ingested food passes from the esophagus through the lower esophageal sphincter.',
    },
    {
      id: 'lesser_curvature',
      name: 'lesser curvature',
      side: 'left',
      localAnchor: [0.09, 0.48, 0.08],
      color: '#D9726B',
      description:
        'Concave medial border of the stomach anchoring the lesser omentum and gastric vasculature.',
    },
    {
      id: 'pylorus',
      name: 'pyloric sphincter',
      side: 'left',
      localAnchor: [0.02, 0.37, 0.08],
      color: '#C25953',
      description:
        'Muscular outlet valve regulating the release of acidic chyme into the duodenum of the small intestine.',
    },
    {
      id: 'gastric_fundus',
      name: 'gastric fundus',
      side: 'right',
      localAnchor: [0.18, 0.58, 0.06],
      color: '#F0938C',
      description:
        'Dome-shaped superior bulge beneath the left diaphragm that collects digestive gases and secretes pepsinogen.',
    },
    {
      id: 'greater_curvature',
      name: 'greater curvature',
      side: 'right',
      localAnchor: [0.22, 0.45, 0.09],
      color: '#E58079',
      description:
        'Long convex lateral border lined with deep gastric rugae folds that expand during meals.',
    },
  ],

  // 6. KIDNEYS — Renal Cortex, Hilum, Adrenals, Ureters & Bladder
  kidneys: [
    {
      id: 'right_kidney',
      name: 'right kidney',
      side: 'left',
      localAnchor: [-0.17, 0.21, -0.06],
      color: '#A13D2D',
      description:
        'Bean-shaped retroperitoneal organ containing ~1 million nephrons that filter blood plasma and regulate electrolytes.',
    },
    {
      id: 'renal_hilum',
      name: 'renal hilum',
      side: 'left',
      localAnchor: [-0.13, 0.19, -0.05],
      color: '#FEF08A',
      description:
        'Concave medial fissure where the renal artery enters and the renal vein and ureter exit.',
    },
    {
      id: 'urinary_bladder',
      name: 'urinary bladder',
      side: 'left',
      localAnchor: [0.0, -0.45, 0.07],
      color: '#D97757',
      description:
        'Hollow muscular pelvic reservoir lined by transitional epithelium that stores urine prior to micturition.',
    },
    {
      id: 'adrenal_gland',
      name: 'adrenal gland',
      side: 'right',
      localAnchor: [0.155, 0.38, -0.06],
      color: '#F59E0B',
      description:
        'Suprarenal endocrine cap secreting cortisol, aldosterone, adrenaline, and noradrenaline.',
    },
    {
      id: 'left_kidney',
      name: 'left kidney',
      side: 'right',
      localAnchor: [0.17, 0.25, -0.06],
      color: '#A13D2D',
      description:
        'Left renal parenchyma positioned slightly higher than the right kidney beneath the spleen.',
    },
    {
      id: 'ureter',
      name: 'ureter',
      side: 'right',
      localAnchor: [0.11, -0.12, -0.03],
      color: '#FDE047',
      description:
        'Fibromuscular tube propelling urine downward from the renal pelvis to the bladder via peristaltic waves.',
    },
  ],

  // 7. SMALL INTESTINE — Duodenum, Jejunum & Ileum
  small_intestine: [
    {
      id: 'duodenum',
      name: 'duodenum',
      side: 'left',
      localAnchor: [-0.12, 0.14, 0.09],
      color: '#EB8C86',
      description:
        'First C-shaped segment receiving chyme from the stomach along with pancreatic enzymes and bile.',
    },
    {
      id: 'ileum',
      name: 'ileum',
      side: 'left',
      localAnchor: [-0.11, -0.24, 0.09],
      color: '#D9736C',
      description:
        'Distal coiled section absorbing vitamin B12, bile salts, and remaining nutrients before joining the cecum.',
    },
    {
      id: 'jejunum',
      name: 'jejunum',
      side: 'right',
      localAnchor: [0.12, 0.04, 0.11],
      color: '#EB8C86',
      description:
        'Middle intestinal coils lined with dense circular folds and villi for rapid absorption of sugars, amino acids, and fatty acids.',
    },
    {
      id: 'mesenteric_coils',
      name: 'intestinal coils',
      side: 'right',
      localAnchor: [0.1, -0.14, 0.1],
      color: '#E07D77',
      description:
        'Peristaltic smooth-muscle loops providing over 250 square meters of absorptive mucosal surface area.',
    },
  ],

  // 8. LARGE INTESTINE — Cecum, Colon & Rectum
  large_intestine: [
    {
      id: 'ascending_colon',
      name: 'ascending colon',
      side: 'left',
      localAnchor: [-0.24, -0.04, 0.07],
      color: '#E5857B',
      description:
        'Right-sided vertical segment ascending from the cecum to the hepatic flexure while absorbing water and electrolytes.',
    },
    {
      id: 'cecum',
      name: 'cecum',
      side: 'left',
      localAnchor: [-0.22, -0.26, 0.08],
      color: '#D46E64',
      description:
        'Proximal pouch in the right iliac fossa receiving digested material from the terminal ileum.',
    },
    {
      id: 'rectum',
      name: 'rectum',
      side: 'left',
      localAnchor: [0.0, -0.48, -0.03],
      color: '#B84D43',
      description:
        'Terminal pelvic chamber storing formed stool prior to defecation.',
    },
    {
      id: 'transverse_colon',
      name: 'transverse colon',
      side: 'right',
      localAnchor: [0.02, 0.21, 0.14],
      color: '#E5857B',
      description:
        'Horizontal haustrated arch spanning across the upper abdomen from the hepatic flexure to the splenic flexure.',
    },
    {
      id: 'descending_colon',
      name: 'descending colon',
      side: 'right',
      localAnchor: [0.25, -0.04, 0.06],
      color: '#D46E64',
      description:
        'Left-sided vertical colon segment consolidating luminal contents as they move toward the pelvis.',
    },
    {
      id: 'sigmoid_colon',
      name: 'sigmoid colon',
      side: 'right',
      localAnchor: [0.12, -0.32, 0.04],
      color: '#C45B51',
      description:
        'S-shaped muscular segment linking the descending colon to the rectum.',
    },
  ],

  // 9. PANCREAS — Head, Neck, Body & Tail
  pancreas: [
    {
      id: 'pancreas_head',
      name: 'head of pancreas',
      side: 'left',
      localAnchor: [-0.02, 0.28, 0.02],
      color: '#FBBF24',
      description:
        'Broad medial portion nestled within the C-loop of the duodenum where the main pancreatic duct joins the bile duct.',
    },
    {
      id: 'pancreas_neck',
      name: 'neck of pancreas',
      side: 'left',
      localAnchor: [0.04, 0.33, 0.01],
      color: '#F59E0B',
      description:
        'Constricted bridge overlying the superior mesenteric vessels between the pancreatic head and body.',
    },
    {
      id: 'pancreas_body',
      name: 'body of pancreas',
      side: 'right',
      localAnchor: [0.14, 0.36, 0.0],
      color: '#FBBF24',
      description:
        'Elongated lobulated parenchyma containing acinar cells (digestive enzymes) and islets of Langerhans (insulin & glucagon).',
    },
    {
      id: 'pancreas_tail',
      name: 'tail of pancreas',
      side: 'right',
      localAnchor: [0.25, 0.41, -0.02],
      color: '#D97706',
      description:
        'Tapered left extremity extending within the splenorenal ligament to reach the hilum of the spleen.',
    },
  ],

  // 10. SPLEEN — Surfaces, Poles & Hilum
  spleen: [
    {
      id: 'splenic_hilum',
      name: 'splenic hilum',
      side: 'left',
      localAnchor: [0.27, 0.45, 0.01],
      color: '#A855F7',
      description:
        'Medial fissure where the splenic artery and splenic vein enter and exit the lymphoid parenchyma.',
    },
    {
      id: 'inferior_pole',
      name: 'inferior pole',
      side: 'left',
      localAnchor: [0.33, 0.36, -0.03],
      color: '#7E22CE',
      description:
        'Lower margin resting near the left colic flexure and left kidney.',
    },
    {
      id: 'superior_pole',
      name: 'superior pole',
      side: 'right',
      localAnchor: [0.29, 0.56, -0.03],
      color: '#9333EA',
      description:
        'Upper extremity curving medially beneath the left dome of the diaphragm.',
    },
    {
      id: 'diaphragmatic_surface',
      name: 'red & white pulp',
      side: 'right',
      localAnchor: [0.35, 0.46, -0.04],
      color: '#862E73',
      description:
        'Vascular red pulp filters senescent erythrocytes while lymphoid white pulp mounts adaptive immune responses.',
    },
  ],
};
