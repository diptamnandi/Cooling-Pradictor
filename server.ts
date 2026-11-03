import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { generateOfflineAshraeAdvice } from './src/utils/localAdvisor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// API route: Gemini-powered Architectural & HVAC Energy Advisor
app.post('/api/gemini-advice', async (req, res) => {
  try {
    const { buildingFeatures, predictionResult, selectedTopics = [] } = req.body;

    const topicDescriptions: Record<string, string> = {
      thermal_bottleneck: '1. Critical Thermal Bottleneck Analysis (Specific envelope surface driving peak cooling penalty)',
      glazing_shading: '2. Glazing Properties (SHGC, U-Factor) & Architectural Overhang / Louver Design',
      cool_roof: '3. Roof Albedo & Cool Roof Specification (SRI rating, membrane material, surface temp reduction)',
      wall_insulation: '4. Wall Continuous Insulation (ci) & Thermal Bridging Elimination',
      hvac_sizing: '5. HVAC Equipment Type Selection & Tonnage Sizing (TR, BTU/h, safety margins)',
      economizer: '6. Air-Side Economizer Cycle & Free-Cooling Potential in this Climate Zone',
      energy_economics: '7. Annual Utility Bill Savings, kWh reduction, and Carbon Abatement',
      ashrae_compliance: '8. ASHRAE Standard 90.1 & LEED Energy Performance Compliance Pathway',
    };

    const requestedTopicList = (selectedTopics.length > 0 ? selectedTopics : Object.keys(topicDescriptions))
      .map((t: string) => topicDescriptions[t] || t)
      .join('\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a licensed ASHRAE Building Energy & HVAC Engineer.
Analyze this building envelope and its predicted cooling & heating load:

Building Parameters:
- Relative Compactness: ${buildingFeatures.relativeCompactness} (Range: 0.62 - 0.98)
- Surface Area: ${buildingFeatures.surfaceArea} m²
- Wall Area: ${buildingFeatures.wallArea} m²
- Roof Area: ${buildingFeatures.roofArea} m²
- Overall Height: ${buildingFeatures.overallHeight} m (${buildingFeatures.overallHeight >= 5.0 ? '2 Stories' : '1 Story'})
- Orientation: ${buildingFeatures.orientation} (2: North, 3: East, 4: South, 5: West)
- Glazing Area Ratio: ${Math.round(buildingFeatures.glazingArea * 100)}%
- Glazing Distribution: ${buildingFeatures.glazingDistribution}
- Climate Zone: ${buildingFeatures.climateZone || 'temperate'}

ML Model Predictions:
- Cooling Load: ${predictionResult.coolingLoad} kWh/m²
- Heating Load: ${predictionResult.heatingLoad} kWh/m²
- Peak Total Cooling Capacity: ${predictionResult.coolingLoadTotalKW} kW (${predictionResult.hvacTonnageTR} Tons of Refrigeration / TR)
- Annual Cooling Energy: ${predictionResult.annualCoolingEnergyKWh} kWh/yr
- Energy Efficiency Rating: ${predictionResult.energyEfficiencyRating}

CRITICAL INSTRUCTION: The user has selected specific focus areas for your evaluation.
You MUST ONLY provide advice and predictions on the following requested points (do NOT output sections for unselected topics):
${requestedTopicList}

Format with clear headers and bullet points. Ground all advice in ASHRAE 90.1 engineering criteria.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({
        success: true,
        source: 'gemini-2.5-flash',
        advice: response.text,
      });
    }

    // Rule-based analytical advice fallback when no Gemini API key is configured
    const advice = generateOfflineAshraeAdvice(buildingFeatures, predictionResult, selectedTopics);

    return res.json({
      success: true,
      source: 'analytical_expert_engine',
      advice,
    });
  } catch (error: any) {
    console.error('Error generating advice:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate recommendations' });
  }
});

// API route: Explaining what happened to cooling-load-ml-predictor.ai.studio link
app.get('/api/project-diagnostic', (req, res) => {
  res.json({
    originalUrl: 'cooling-load-ml-predictor.ai.studio/',
    status: 'link_expired_or_container_recycled',
    cause: [
      'In Google AI Studio and Cloud Run environments, development instances are ephemeral and sleep after inactivity.',
      'Custom subdomain or preview URLs require an active background container instance; when the host project session closes or gets recreated, the old preview URL stops routing.',
      'The original repository may have lacked persistent container deployment configuration.'
    ],
    reconstructedAppStatus: 'active_and_optimized',
    enhancementsAdded: [
      'UCI Energy Efficiency Dataset (Tsanas & Xifara) ML ensemble models (GBDT, Random Forest, MLP Neural Network, ASHRAE Heat Balance)',
      'Real-time interactive 3D/Isometric building envelope visualizer with thermal heat flux rendering',
      'HVAC sizing calculator (kW, Tons of Refrigeration, BTU/h)',
      'Scenario comparison (A/B baseline vs retrofit)',
      'SHAP-like feature importance waterfall',
      'Batch CSV prediction processor and export',
      'AI Energy Consultant integration via Google Gemini'
    ]
  });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Cooling Load ML Predictor server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
