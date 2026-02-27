/* eslint-disable no-console */
/**
 * Minimal workflow smoke checks.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 \
 *   CLOSED_CARGO_ID=... \
 *   VENDOR_PRODUCT_ID=... \
 *   node scripts/workflow-api-smoke.mjs
 */

const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
const closedCargoId = process.env.CLOSED_CARGO_ID
const vendorProductId = process.env.VENDOR_PRODUCT_ID

async function call(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, options)
  const body = await res.text()
  return { status: res.status, ok: res.ok, body }
}

function printResult(name, passed, details) {
  const mark = passed ? 'PASS' : 'FAIL'
  console.log(`[${mark}] ${name} -> ${details}`)
}

async function main() {
  let failed = 0

  if (closedCargoId) {
    const dispatchRes = await call('/api/cargo/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cargoId: closedCargoId,
        deviceIds: ['dummy-device-id'],
        targetLocationId: 'dummy-location-id',
        notes: 'smoke-test',
      }),
    })
    const pass = dispatchRes.status === 400 || dispatchRes.status === 404
    printResult('Guard: closed cargo cannot be dispatched', pass, `status=${dispatchRes.status}`)
    if (!pass) failed++
  } else {
    console.log('[SKIP] CLOSED_CARGO_ID not provided')
  }

  if (vendorProductId) {
    const patchRes = await call(`/api/vendor-tracking/${vendorProductId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentStatus: 'COMPLETED',
      }),
    })
    const pass = patchRes.status === 400
    printResult('Guard: vendor cannot complete without technical service', pass, `status=${patchRes.status}`)
    if (!pass) failed++
  } else {
    console.log('[SKIP] VENDOR_PRODUCT_ID not provided')
  }

  if (failed > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
