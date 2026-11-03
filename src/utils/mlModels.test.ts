import test from 'node:test';
import assert from 'node:assert/strict';
import { predictBuildingEnergy, BUILDING_PRESETS, CLIMATE_FACTORS } from './mlModels';

test('predictBuildingEnergy returns realistic values for high efficiency villa', () => {
  const villa = BUILDING_PRESETS.high_efficiency_villa.features;
  const result = predictBuildingEnergy(villa);

  assert.ok(result.coolingLoad > 10, 'Cooling load must be > 10 kWh/m²');
  assert.ok(result.coolingLoad < 35, 'High efficiency villa cooling load should be moderate');
  assert.ok(result.heatingLoad > 5, 'Heating load must be > 5 kWh/m²');
  assert.ok(result.hvacTonnageTR > 0, 'HVAC tonnage should be positive');
  assert.ok(result.annualCoolingEnergyKWh > 0, 'Annual cooling energy should be positive');
  assert.ok(result.annualCostEstimateUSD > 0, 'Annual cost estimate should be positive');
  assert.ok(['A+', 'A', 'B', 'C'].includes(result.energyEfficiencyRating), 'Should have good energy rating');
});

test('heavily glazed commercial office has higher cooling load than compact villa', () => {
  const villa = BUILDING_PRESETS.high_efficiency_villa.features;
  const office = BUILDING_PRESETS.modern_glazed_office.features;

  const villaResult = predictBuildingEnergy(villa);
  const officeResult = predictBuildingEnergy(office);

  assert.ok(
    officeResult.coolingLoad > villaResult.coolingLoad,
    `Office cooling load (${officeResult.coolingLoad}) should be higher than villa (${villaResult.coolingLoad})`
  );
  assert.ok(
    officeResult.hvacTonnageTR > villaResult.hvacTonnageTR,
    `Office HVAC tonnage (${officeResult.hvacTonnageTR}) should exceed villa (${villaResult.hvacTonnageTR})`
  );
});

test('model breakdown includes all 4 ensemble models', () => {
  const sample = BUILDING_PRESETS.typical_suburban_house.features;
  const result = predictBuildingEnergy(sample);

  assert.ok(result.modelBreakdown.gradientBoost > 0);
  assert.ok(result.modelBreakdown.randomForest > 0);
  assert.ok(result.modelBreakdown.neuralNetwork > 0);
  assert.ok(result.modelBreakdown.ashraePhysical > 0);
});

test('feature contributions rank the most impactful thermal drivers', () => {
  const sample = BUILDING_PRESETS.modern_glazed_office.features;
  const result = predictBuildingEnergy(sample);

  assert.ok(result.featureContributions.length >= 4);
  const glazingContrib = result.featureContributions.find(f => f.feature.includes('Glazing'));
  assert.ok(glazingContrib, 'Glazing contribution should exist');
  assert.equal(glazingContrib?.direction, 'increases_cooling');
});

test('climate factors apply proper multipliers', () => {
  const base = BUILDING_PRESETS.typical_suburban_house.features;

  const resTemperate = predictBuildingEnergy({ ...base, climateZone: 'temperate' });
  const resHotHumid = predictBuildingEnergy({ ...base, climateZone: 'hot_humid' });

  assert.ok(
    resHotHumid.coolingLoad > resTemperate.coolingLoad,
    'Hot humid climate should have higher cooling load than temperate'
  );
});
