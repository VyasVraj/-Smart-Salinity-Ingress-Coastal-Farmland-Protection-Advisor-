/**
 * Risk Engine Tests
 * Run: node src/tests/riskEngine.test.js
 */

import { calculateRisk, selectAgents } from '../engine/riskEngine.js'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`  ✗ ${name}: ${err.message}`)
    failed++
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed')
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message || ''}: expected ${expected}, got ${actual}`)
}

console.log('\n🧪 Risk Engine Tests\n')

// ---- LOW Risk ----
console.log('--- LOW Risk ---')
test('Low EC values produce LOW risk', () => {
  const result = calculateRisk({ soilEC: 1.0, groundwaterEC: 0.8, tds: 400, soilPH: 6.8, moisture: 50, waterLevel: 10 }, [])
  assertEqual(result.riskLevel, 'LOW')
  assert(result.riskScore < 25, `Score should be < 25, got ${result.riskScore}`)
})

test('LOW risk with no history has STABLE trend', () => {
  const result = calculateRisk({ soilEC: 1.0, groundwaterEC: 0.8, tds: 400, soilPH: 6.8, moisture: 50, waterLevel: 10 }, [])
  assertEqual(result.trend, 'STABLE')
  assertEqual(result.trendChangePercent, 0)
})

// ---- MEDIUM Risk ----
console.log('--- MEDIUM Risk ---')
test('Medium EC values produce MEDIUM risk', () => {
  const result = calculateRisk({ soilEC: 3.0, groundwaterEC: 2.0, tds: 1500, soilPH: 7.2, moisture: 40, waterLevel: 6 }, [])
  assertEqual(result.riskLevel, 'MEDIUM')
  assert(result.riskScore >= 25 && result.riskScore < 50, `Score should be 25-50, got ${result.riskScore}`)
})

// ---- HIGH Risk ----
console.log('--- HIGH Risk ---')
test('High EC values produce HIGH risk', () => {
  const result = calculateRisk({ soilEC: 6.0, groundwaterEC: 5.0, tds: 3000, soilPH: 7.8, moisture: 30, waterLevel: 4 }, [])
  assertEqual(result.riskLevel, 'HIGH')
  assert(result.riskScore >= 50 && result.riskScore < 75, `Score should be 50-75, got ${result.riskScore}`)
})

// ---- CRITICAL Risk ----
console.log('--- CRITICAL Risk ---')
test('Critical EC values produce CRITICAL risk', () => {
  const result = calculateRisk({ soilEC: 12.0, groundwaterEC: 10.0, tds: 6000, soilPH: 8.5, moisture: 20, waterLevel: 2 }, [])
  assertEqual(result.riskLevel, 'CRITICAL')
  assert(result.riskScore >= 75, `Score should be >= 75, got ${result.riskScore}`)
})

// ---- Trend Detection ----
console.log('--- Trend Detection ---')
test('Stable values produce STABLE trend', () => {
  const history = [
    { soilEC: 3.0, groundwaterEC: 2.0 },
    { soilEC: 3.1, groundwaterEC: 2.1 },
    { soilEC: 2.9, groundwaterEC: 2.0 },
  ]
  const result = calculateRisk({ soilEC: 3.0, groundwaterEC: 2.0, tds: 1500, soilPH: 7.0, moisture: 40, waterLevel: 6 }, history)
  assertEqual(result.trend, 'STABLE')
})

test('Increasing values produce WORSENING trend', () => {
  const history = [
    { soilEC: 2.0, groundwaterEC: 1.5 },
    { soilEC: 2.5, groundwaterEC: 2.0 },
    { soilEC: 3.0, groundwaterEC: 2.5 },
  ]
  const result = calculateRisk({ soilEC: 5.0, groundwaterEC: 4.0, tds: 2500, soilPH: 7.5, moisture: 30, waterLevel: 5 }, history)
  assertEqual(result.trend, 'RAPIDLY_WORSENING')
})

test('Decreasing values produce IMPROVING trend', () => {
  const history = [
    { soilEC: 6.0, groundwaterEC: 5.0 },
    { soilEC: 5.0, groundwaterEC: 4.0 },
    { soilEC: 4.0, groundwaterEC: 3.0 },
  ]
  const result = calculateRisk({ soilEC: 3.0, groundwaterEC: 2.5, tds: 1500, soilPH: 7.0, moisture: 40, waterLevel: 6 }, history)
  assertEqual(result.trend, 'IMPROVING')
})

// ---- Agent Selection ----
console.log('--- Agent Selection ---')
test('LOW risk triggers only MonitoringAgent', () => {
  const agents = selectAgents('LOW', 'STABLE')
  assertEqual(agents.length, 1)
  assert(agents.includes('MonitoringAgent'))
})

test('MEDIUM risk triggers Monitoring + Crop agents', () => {
  const agents = selectAgents('MEDIUM', 'STABLE')
  assert(agents.includes('MonitoringAgent'))
  assert(agents.includes('CropAdvisoryAgent'))
})

test('HIGH risk triggers all main agents', () => {
  const agents = selectAgents('HIGH', 'WORSENING')
  assert(agents.includes('MonitoringAgent'))
  assert(agents.includes('CropAdvisoryAgent'))
  assert(agents.includes('IrrigationAgent'))
  assert(agents.includes('LandReclamationAgent'))
  assert(agents.includes('FarmerAlertAgent'))
})

test('CRITICAL risk triggers all agents', () => {
  const agents = selectAgents('CRITICAL', 'RAPIDLY_WORSENING')
  assert(agents.length >= 5)
})

test('triggerAgents is false for LOW/STABLE', () => {
  const result = calculateRisk({ soilEC: 1.0, groundwaterEC: 0.8, tds: 400, soilPH: 6.8, moisture: 50, waterLevel: 10 }, [
    { soilEC: 1.0, groundwaterEC: 0.8 },
    { soilEC: 1.1, groundwaterEC: 0.9 },
  ])
  assertEqual(result.triggerAgents, false)
})

test('triggerAgents is true for HIGH risk', () => {
  const result = calculateRisk({ soilEC: 6.0, groundwaterEC: 5.0, tds: 3000, soilPH: 7.8, moisture: 30, waterLevel: 4 }, [])
  assertEqual(result.triggerAgents, true)
})

// ---- Results ----
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
} else {
  console.log('✅ All tests passed!\n')
}
