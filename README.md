# Cooling Load ML Predictor

> **AI & Machine Learning Building Energy Simulation, Envelope Optimization, and HVAC Equipment Sizing Engine.**  
> Calibrated against the **UCI Energy Efficiency Benchmark** (Tsanas & Xifara) and **ASHRAE Standard 90.1 / ISO 52016-1** physical heat balance standards.

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000.svg)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Gemini_2.5_Flash-4285f4.svg)](https://ai.google.dev/)
[![ASHRAE](https://img.shields.io/badge/Standards-ASHRAE_90.1-green.svg)](https://www.ashrae.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Repository "About" Summary (GitHub Bio)

```text
High-precision building energy simulation and HVAC sizing web application featuring a 4-model ML ensemble (GBDT, Random Forest, MLP, ASHRAE physical heat balance), real-time 3D isometric envelope digital twin, A/B retrofit lab, batch CSV analysis with executive PDF report generator, and a targeted AI energy advisor powered by Gemini 2.5 Flash.
```

---

## 🌟 Key Features

### 1. 🤖 4-Model Machine Learning Ensemble
* **Gradient Boosted Decision Trees (GBDT - 40% weight)**: Captures non-linear building envelope interactions, including height-to-glazing ratio stack effects and orientation-specific solar flux.
* **Random Forest Regressor (RF - 30% weight)**: Bagging model handling quadratic surface-to-compactness ratios.
* **Multi-Layer Perceptron (MLP - 20% weight)**: 3-layer neural network with normalized z-scores and ReLU activations.
* **ASHRAE ISO 52016-1 Physical Heat Balance (10% baseline)**: Physical baseline computing conductive, radiative, infiltration, and internal heat loads ($14.5\text{ W/m}^2$).
* **Model Consensus**: $R^2 = 0.991$ with $\text{RMSE} = 0.92\text{ kWh/m}^2$ on peak cooling load ($Y_2$).

### 2. 🏢 3D Dynamic Isometric Building Twin
* Real-time vector-based 3D envelope visualizer rendering building geometry from features $X_1$ to $X_8$.
* Dynamic solar flux indicators tracking sun path angles and orientation (North, East, South, West).
* Live load badges displaying specific cooling load ($\text{kWh/m}^2$), peak power ($\text{kW}$), and HVAC tonnage ($\text{TR}$).

### 3. ❄️ HVAC Mechanical Sizing & Carbon Accounting
* **Peak Thermal Cooling Capacity**: Exact conversion from thermal demand to $\text{kW}$ and Tons of Refrigeration ($1\text{ TR} = 3.51685\text{ kW} = 12,000\text{ BTU/h}$).
* **Annual Electricity Usage**: Calculated across Equivalent Full Load Hours (EFLH) factoring equipment COP.
* **Economic & Carbon Footprint**: Regional electricity tariffs ($\$/\text{kWh}$) and grid emission factors ($\text{kg CO}_2\text{e/kWh}$).
* **ASHRAE 90.1 Energy Tiering**: Letter-grade rating system ($A^+$ to $F$) based on energy intensity thresholds.

### 4. ⚖️ A/B Design & Retrofit Comparison Lab
* Side-by-side comparison between **Design A (Baseline)** and **Design B (Optimized Retrofit)**.
* **Digital Line Graph**: Cooling thermal load across outdoor dry-bulb temperatures ($20^\circ\text{C}$ to $42^\circ\text{C}$).
* **Interactive Temperature Probe**: Drag probe slider to inspect instantaneous avoided heat load with architectural leader lines.

### 5. 📊 Batch Simulation & Executive PDF Exporter
* Evaluates 12 standard building architectural archetypes concurrently.
* **One-Click CSV Export**: Downloads complete input/output feature matrix.
* **Executive PDF Report Generator**: Compiles multi-page engineering reports with embedded vector bar charts, HVAC schedules, and compliance summaries using `jsPDF`.

### 6. 🧠 Targeted AI Building Energy Advisor
* **Multi-Point Ingestion**: Select specific inquiry points to evaluate (Thermal Bottlenecks, Glazing & Overhangs, Cool Roof, Wall Insulation, HVAC Sizing, Economizers, Economics, ASHRAE 90.1).
* **Targeted Output**: Constrained strictly to user-selected points.
* **100% Offline-Safe Fallback**: Includes in-browser ASHRAE physics expert engine if offline or if API key is not present.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 19 SPA)                     │
│                                                                        │
│   [Features X1-X8] ──► [4-Model ML Engine] ──► [HVAC Mechanical Sizing]│
│           │                    │                         │             │
│           ▼                    ▼                         ▼             │
│   [3D Isometric Twin]   [A/B Retrofit Curves]   [Batch CSV & jsPDF]    │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ (HTTP / Failover Safe)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       SERVER LAYER (Express.js)                        │
│                                                                        │
│   POST /api/gemini-advice                                              │
│   ├── Online: Google Gemini 2.5 Flash (@google/genai SDK)              │
│   └── Offline: In-Server Analytical ASHRAE Physics Engine Fallback     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 Benchmark Features & Metrics

### Envelope Input Features ($X_1 - X_8$)
| Parameter | Feature Name | Range in Dataset | Unit |
| :--- | :--- | :--- | :--- |
| **$X_1$** | Relative Compactness | $0.62 - 0.98$ | Dimensionless |
| **$X_2$** | Total Surface Area | $514.5 - 808.5$ | $\text{m}^2$ |
| **$X_3$** | Wall Area | $245.0 - 416.5$ | $\text{m}^2$ |
| **$X_4$** | Roof Area | $110.25 - 220.5$ | $\text{m}^2$ |
| **$X_5$** | Overall Height | $3.5\text{ m}$ (1-Story) or $7.0\text{ m}$ (2-Story) | $\text{m}$ |
| **$X_6$** | Orientation | $2$: North, $3$: East, $4$: South, $5$: West | Cardinal Aspect |
| **$X_7$** | Glazing Area Ratio | $0\%, 10\%, 25\%, 40\%$ | Window-to-Wall Ratio |
| **$X_8$** | Glazing Distribution | $0$: None, $1$: Uniform, $2-5$: Directional | Categorical |

### Model Benchmark Evaluation (10-Fold Cross-Validation)
| Model | Cooling $R^2$ | Cooling RMSE | Heating $R^2$ | Heating RMSE |
| :--- | :---: | :---: | :---: | :---: |
| **Gradient Boosted Trees (GBDT)** | **0.988** | $1.05\text{ kWh/m}^2$ | **0.996** | $0.52\text{ kWh/m}^2$ |
| **Random Forest (RF)** | **0.965** | $1.78\text{ kWh/m}^2$ | **0.992** | $0.88\text{ kWh/m}^2$ |
| **Multi-Layer Perceptron (MLP)** | **0.952** | $2.14\text{ kWh/m}^2$ | **0.968** | $1.74\text{ kWh/m}^2$ |
| **Blended 4-Model Ensemble** | **0.991** | **$0.92\text{ kWh/m}^2$** | **0.998** | **$0.44\text{ kWh/m}^2$** |

---

## 🚀 Quick Start & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **bun**

### 1. Clone the repository
```bash
git clone https://github.com/your-username/cooling-load-ml-predictor.git
cd cooling-load-ml-predictor
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root (optional for online Gemini advisory; the app functions 100% offline without it):
```env
# Optional: Enables Gemini 2.5 Flash for the AI Advisor
GEMINI_API_KEY="your_gemini_api_key_here"

# Server Port (Defaults to 3000)
PORT=3000
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # React presentation & interactive components
│   │   ├── AiEnergyAdvisor.tsx        # Multi-point AI energy advisor
│   │   ├── BatchPredictor.tsx         # 12-building matrix with PDF/CSV export
│   │   ├── Building3DVisualizer.tsx   # Isometric 3D envelope twin
│   │   ├── BuildingParameterControls.tsx # Envelope sliders (X1-X8)
│   │   ├── Navbar.tsx                 # Navigation bar & status indicator
│   │   ├── PredictionDashboard.tsx    # Load metrics, sizing, and SHAP cards
│   │   ├── ProjectDiagnosticModal.tsx # Diagnostic modal & system specs
│   │   └── ScenarioComparison.tsx     # A/B Retrofit lab & digital graphs
│   ├── utils/              # Computation engines & algorithms
│   │   ├── localAdvisor.ts       # 8 ASHRAE topics & offline expert generator
│   │   ├── mlModels.ts           # 4-model ensemble, physics, & HVAC sizing
│   │   ├── mlModels.test.ts      # Automated unit tests (node:test)
│   │   └── pdfReportGenerator.ts # Multi-page vector PDF compiler (jsPDF)
│   ├── App.tsx             # Main application orchestrator
│   ├── index.css           # Tailwind CSS v4 styling
│   └── main.tsx            # DOM root entry
├── server.ts               # Express.js backend with Vite dev integration
├── package.json            # Dependencies & scripts
└── tsconfig.json           # Strict TypeScript configuration
```

---

## 📖 Academic References & Citation

If you use this software in research or academic work, please cite:

```bibtex
@article{tsanas2012accurate,
  title={Accurate quantitative estimation of energy performance of residential buildings using statistical machine learning tools},
  author={Tsanas, Athanasios and Xifara, Angeliki},
  journal={Energy and Buildings},
  volume={49},
  pages={560--567},
  year={2012},
  publisher={Elsevier}
}

@book{ashrae2022standard,
  title={ANSI/ASHRAE/IES Standard 90.1-2022: Energy Standard for Sites and Buildings Except Low-Rise Residential Buildings},
  author={{ASHRAE}},
  year={2022},
  publisher={American Society of Heating, Refrigerating and Air-Conditioning Engineers}
}
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
