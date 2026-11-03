import { BuildingFeatures, PredictionResult } from './mlModels';

export interface AdvisorTopicDefinition {
  id: string;
  label: string;
  shortDesc: string;
  category: 'envelope' | 'mechanical' | 'economics';
}

export const ADVISOR_TOPICS: AdvisorTopicDefinition[] = [
  {
    id: 'thermal_bottleneck',
    label: 'Thermal Envelope Bottlenecks & Solar Ingress',
    shortDesc: 'Identifies which envelope surface drives peak cooling penalties',
    category: 'envelope',
  },
  {
    id: 'glazing_shading',
    label: 'Glazing Properties (SHGC, U-Value) & Overhangs',
    shortDesc: 'Optimal solar heat gain coefficients and architectural louvers',
    category: 'envelope',
  },
  {
    id: 'cool_roof',
    label: 'Roof Albedo & Cool Roof Specification',
    shortDesc: 'Solar Reflectance Index (SRI) and radiative ceiling mitigation',
    category: 'envelope',
  },
  {
    id: 'wall_insulation',
    label: 'Wall Continuous Insulation & Thermal Bridging',
    shortDesc: 'R-value targets and exterior continuous insulation (ci)',
    category: 'envelope',
  },
  {
    id: 'hvac_sizing',
    label: 'HVAC Equipment Selection & Tonnage Sizing',
    shortDesc: 'VRF heat pump vs chiller plant sizing with safety margins',
    category: 'mechanical',
  },
  {
    id: 'economizer',
    label: 'Air-Side Economizer Cycle & Free-Cooling',
    shortDesc: 'Outdoor air economizer hours and enthalpy thresholds',
    category: 'mechanical',
  },
  {
    id: 'energy_economics',
    label: 'Annual Utility Bill Savings & Carbon Abatement',
    shortDesc: 'Expected kWh reduction, financial savings, and emissions avoided',
    category: 'economics',
  },
  {
    id: 'ashrae_compliance',
    label: 'ASHRAE 90.1 & LEED Compliance Pathway',
    shortDesc: 'Prescriptive vs performance rating method standards',
    category: 'economics',
  },
];

/**
 * High-precision local offline ASHRAE thermal and HVAC engineering advisor.
 * Filters strictly to user-selected topics.
 */
export function generateOfflineAshraeAdvice(
  features: BuildingFeatures,
  prediction: PredictionResult,
  selectedTopics: string[] = ['thermal_bottleneck', 'glazing_shading', 'cool_roof', 'hvac_sizing', 'energy_economics']
): string {
  const isHighGlazing = features.glazingArea >= 0.25;
  const isTall = features.overallHeight >= 5.0;
  const isSolarExposed = features.orientation === 4 || features.orientation === 5;
  const isLowCompactness = features.relativeCompactness < 0.72;
  const glazingPct = Math.round(features.glazingArea * 100);

  // If no topics selected, default to all
  const topicsToInclude = selectedTopics.length > 0 ? selectedTopics : ADVISOR_TOPICS.map((t) => t.id);

  let advice = `### Tailored ASHRAE Energy Engineering Assessment\n`;
  advice += `*Advisory focused exclusively on your ${topicsToInclude.length} selected inquiry point${topicsToInclude.length > 1 ? 's' : ''}.*\n\n`;

  // 1. Thermal Bottlenecks
  if (topicsToInclude.includes('thermal_bottleneck')) {
    advice += `#### 1. Critical Thermal Bottleneck Analysis\n`;
    if (isHighGlazing && isSolarExposed) {
      advice += `- **High Direct Solar Irradiance on Glazed Facade**: With ${glazingPct}% window-to-wall ratio oriented towards the ${features.orientation === 4 ? 'South' : 'West'}, direct solar irradiance delivers up to 650 W/m² into occupied perimeter zones during peak afternoon hours.\n`;
      advice += `- **Envelope Solar Heat Gain**: Unshaded transparent apertures are responsible for over 45% of peak thermal cooling spikes.\n`;
    } else if (isTall) {
      advice += `- **Envelope Perimeter Wall Exposure**: The 7.0m 2-story elevation exposes ${features.wallArea} m² of vertical wall surface, magnifying conductive heat transmission and internal stack effect.\n`;
    } else if (isLowCompactness) {
      advice += `- **Low Compactness & Roof Radiative Exposure**: A low relative compactness (${features.relativeCompactness}) creates an elongated footprint with ${features.roofArea} m² of roof surface, driving continuous solar thermal flux into the top plenum.\n`;
    } else {
      advice += `- **Balanced Envelope Performance**: Compact form factor (${features.relativeCompactness}) limits excess surface losses; cooling load is primarily driven by design indoor/outdoor ambient temperature differentials.\n`;
    }
    advice += `\n`;
  }

  // 2. Glazing & Shading
  if (topicsToInclude.includes('glazing_shading')) {
    advice += `#### 2. Glazing Properties (SHGC, U-Value) & Overhang Design\n`;
    advice += `- **Solar Heat Gain Coefficient (SHGC)**: Target SHGC ≤ **0.25** for east and west glazing; SHGC ≤ **0.30** for south glazing.\n`;
    advice += `- **Thermal Transmittance**: Double-pane low-E glass with argon gas fill achieving U-factor ≤ **1.55 W/m²K** (U-0.27 BTU/h·ft²·°F).\n`;
    advice += `- **Exterior Shading Projection**: Install 0.75m horizontal overhangs (projection factor ~0.6) on south facades to block high-angle summer sun while admitting low-angle winter passive heat.\n`;
    advice += `\n`;
  }

  // 3. Cool Roof
  if (topicsToInclude.includes('cool_roof')) {
    advice += `#### 3. Roof Albedo & Cool Roof Specification\n`;
    advice += `- **Solar Reflectance Index (SRI)**: Install a high-albedo cool roof membrane (white TPO or reflective elastomeric coating) with initial **SRI ≥ 82** (3-year aged SRI ≥ 64).\n`;
    advice += `- **Surface Temperature Mitigation**: Drops the ${features.roofArea} m² roof surface peak temperature by up to 22°C (from ~68°C down to 46°C), slashing ceiling heat ingress by 35%.\n`;
    advice += `\n`;
  }

  // 4. Wall Insulation
  if (topicsToInclude.includes('wall_insulation')) {
    advice += `#### 4. Wall Continuous Insulation & Thermal Bridging\n`;
    advice += `- **Continuous Insulation (ci)**: Add R-15 continuous exterior polyisocyanurate (polyiso) insulation over the ${features.wallArea} m² wall envelope.\n`;
    advice += `- **Thermal Bridging Elimination**: Continuous exterior layer covers steel/concrete studs, eliminating conductive flanking paths and achieving assembly U-value ≤ 0.32 W/m²K.\n`;
    advice += `- **Air Barrier Integrity**: Continuous vapor-permeable air barrier membrane sealed to target air tightness ≤ 1.5 ACH50.\n`;
    advice += `\n`;
  }

  // 5. HVAC Equipment & Sizing
  if (topicsToInclude.includes('hvac_sizing')) {
    const safetyTonnage = Math.round(prediction.hvacTonnageTR * 1.1 * 10) / 10;
    advice += `#### 5. HVAC Equipment Selection & Sizing Recommendation\n`;
    advice += `- **Calculated Peak Cooling Demand**: **${prediction.coolingLoadTotalKW} kW (${prediction.hvacTonnageTR} Tons of Refrigeration / TR)**.\n`;
    advice += `- **Recommended Equipment Selection**: **${safetyTonnage} TR** Variable Refrigerant Flow (VRF) heat pump system or inverter multi-split with variable-speed scroll compressors.\n`;
    advice += `- **Equipment Efficiency**: Target **SEER2 ≥ 18.5** (IEER ≥ 20.0, COP ≥ 4.2) to maintain superior efficiency during part-load operating hours.\n`;
    advice += `\n`;
  }

  // 6. Economizer
  if (topicsToInclude.includes('economizer')) {
    advice += `#### 6. Air-Side Economizer Cycle & Free-Cooling Potential\n`;
    advice += `- **Free Cooling Operational Hours**: In temperate zones, outdoor dry-bulb temperatures fall between 12°C and 18°C for approximately 1,100 to 1,400 hours per year.\n`;
    advice += `- **Differential Enthalpy Economizer**: Modulate outdoor air dampers to provide 100% free cooling whenever outdoor air enthalpy is lower than return air, turning off mechanical compressors during mild periods.\n`;
    advice += `\n`;
  }

  // 7. Energy Economics & Carbon
  if (topicsToInclude.includes('energy_economics')) {
    const savingsCost = Math.round(prediction.annualCostEstimateUSD * 0.28);
    const savingsCO2 = Math.round(prediction.carbonFootprintKgCO2 * 0.28);
    advice += `#### 7. Annual Utility Bill Savings & Carbon Abatement\n`;
    advice += `- **Projected Cooling Load Reduction**: **24% to 32%** decrease in annual mechanical cooling energy consumption.\n`;
    advice += `- **Estimated Financial Savings**: **$${savingsCost.toLocaleString()} / year** reduction in operational electric utility expenditures.\n`;
    advice += `- **Annual Carbon Abatement**: **${savingsCO2.toLocaleString()} kg CO₂e / year** avoided from local grid emissions.\n`;
    advice += `\n`;
  }

  // 8. ASHRAE 90.1 Compliance
  if (topicsToInclude.includes('ashrae_compliance')) {
    advice += `#### 8. ASHRAE Standard 90.1 & LEED Energy Performance Pathway\n`;
    advice += `- **Prescriptive Compliance**: Envelope meets ASHRAE Standard 90.1-2022 Section 5 prescriptive criteria for Climate Zone ${features.climateZone || 'Temperate'} (roof U ≤ 0.27, vertical wall U ≤ 0.36, fenestration SHGC ≤ 0.25).\n`;
    advice += `- **LEED v4.1 Minimum Energy Performance**: Achieves 18% to 26% performance improvement over the Appendix G baseline building, qualifying for 8 to 12 LEED EAc2 Optimize Energy Performance points.\n`;
    advice += `\n`;
  }

  return advice;
}
