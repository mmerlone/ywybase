/**
 * Script to generate unified globe data combining Natural Earth timezones and World 110m countries.
 * This script downloads the Natural Earth 10m Time Zones GeoJSON, processes it, and merges it with the World 110m TopoJSON.
 * The resulting simplified TopoJSON is saved to public/data/tz/globe-data.json for use in timezones picker.
 * Meant to be used with the TzGlobePicker, which became a dedicated module.
 * TODO: tidy and streamline the script removing the unused globe data.
 */
import fs from 'node:fs'
import path from 'node:path'
import * as topojsonServer from 'topojson-server'
import * as topojsonClient from 'topojson-client'
import * as topojsonSimplify from 'topojson-simplify'
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import type { Topology, Objects } from 'topojson-specification'
import { safeJsonParse } from '@/lib/utils/json'

// Handle process.exit properly for Node.js environment
const processExit = (code: number): never => {
  throw new Error(`Process exit with code ${code}`)
}

/** Directory where generated timezone-related files live (public/data/tz) */
const TZ_OUTPUT_DIR = path.join(process.cwd(), 'public', 'data', 'tz')

/** Output path for the generated canonical timezone regions TypeScript file */
const CANONICAL_TZ_OUTPUT = path.join(process.cwd(), 'src', 'lib', 'utils', 'canonicalTzRegions.generated.ts')

/** Path to the visionscarto-world-atlas 110m TopoJSON in node_modules */
const WORLD_SOURCE = path.join(process.cwd(), 'node_modules', 'visionscarto-world-atlas', 'world', '110m.json')

/**
 * Natural Earth 10m Time Zones (GeoJSON).
 * Standard source for high-quality, closed polygon timezone data.
 * @see {@link https://github.com/nvkelso/natural-earth-vector}
 */
const NE_TZ_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_time_zones.geojson'

// ── Helpers ──────────────────────────────────────────────────────

async function downloadFile(url: string): Promise<FeatureCollection> {
  console.log(`  Downloading: ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`)

  const jsonText = await response.text()
  const parsed = safeJsonParse(jsonText)
  if (parsed === null) {
    throw new Error(`Failed to parse JSON from ${url}`)
  }

  return parsed as FeatureCollection
}

/**
 * Simplify topology while preserving shared borders.
 */
function simplifyTopology(topology: Topology, quantileVal = 0.05): Topology {
  // The topojson-simplify library expects Objects<object> but we have Objects<GeoJsonProperties>
  // Cast to satisfy library requirements while maintaining our type structure
  const topologyForLib = topology as Topology<Objects<object>>
  const presimplified = topojsonSimplify.presimplify(topologyForLib)
  const minWeight = topojsonSimplify.quantile(presimplified, quantileVal)
  const simplified = topojsonSimplify.simplify(presimplified, minWeight)
  // Cast back to our original Topology type
  return simplified as Topology
}

// ── Main ──────────────────────────────────────────────────────────

async function generateGlobeData(): Promise<void> {
  console.log('🌍 Generating unified globe data (Natural Earth + World 110m)...\n')

  if (!fs.existsSync(TZ_OUTPUT_DIR)) {
    fs.mkdirSync(TZ_OUTPUT_DIR, { recursive: true })
  }

  try {
    // 1. Load World 110m (Countries)
    if (!fs.existsSync(WORLD_SOURCE)) {
      throw new Error(`visionscarto-world-atlas not found at ${WORLD_SOURCE}`)
    }
    console.log('📦 Step 1: Loading World 110m (Countries)...')
    const worldData = fs.readFileSync(WORLD_SOURCE, 'utf-8')
    const worldTopoParsed = safeJsonParse(worldData)
    if (worldTopoParsed === null) {
      throw new Error(`Failed to parse world topology from ${WORLD_SOURCE}`)
    }
    const worldTopo = worldTopoParsed as Topology
    // Extract logical "countries" layer (usually named "countries" or "land")
    // visionscarto uses "countries"
    const countriesObject = worldTopo.objects['countries']
    if (!countriesObject) {
      throw new Error('Countries object not found in world topology')
    }
    const countriesGeo = topojsonClient.feature(worldTopo, countriesObject) as FeatureCollection<
      Geometry,
      GeoJsonProperties
    >

    // 2. Download Natural Earth Time Zones
    console.log('\n📦 Step 2: Downloading Natural Earth Time Zones (10m)...')
    const timezonesGeo = await downloadFile(NE_TZ_URL)
    console.log(`  Parsed ${timezonesGeo.features.length} timezone features`)

    // 3. Process Timezones
    // Filter properties to reduce size and normalize IDs
    console.log('  Processing timezone features...')
    const processedTzFeatures = timezonesGeo.features.map((f) => {
      const p = f.properties ?? {}
      // Use tz_name1st (e.g. "America/New_York") or name (e.g. "-5")
      // We prioritize exact TZIDs for the picker
      const tzid = (p.tz_name1st ?? p.name) as string
      const offset = typeof p.zone === 'number' ? p.zone : 0 // zone is offset

      return {
        ...f,
        properties: {
          tzid,
          name: p.name as string,
          offset,
          iso_a2: p.iso_a2 as string,
        },
      }
    })

    const processedTzGeo: FeatureCollection = {
      type: 'FeatureCollection',
      features: processedTzFeatures, // features are compatible
    }

    // 4. Create Combined Topology
    console.log('\n📦 Step 3: Creating TopoJSON (Countries + Timezones)...')
    const combinedTopology = topojsonServer.topology({
      countries: countriesGeo,
      timezones: processedTzGeo,
    })

    // 5. Simplify
    console.log('  Simplifying topology (quantile=0.04)...')
    // Use slightly higher detail (4%) given 10m source
    const simplified = simplifyTopology(combinedTopology, 0.04)

    // 6. Write Output
    const outputPath = path.join(TZ_OUTPUT_DIR, 'globe-data.json')
    const outputJson = JSON.stringify(simplified)
    fs.writeFileSync(outputPath, outputJson)
    const sizeMB = (Buffer.byteLength(outputJson) / 1024 / 1024).toFixed(2)
    console.log(`  ✅ Saved unified data: ${outputPath}`)
    console.log(`     Size: ${sizeMB} MB`)

    // 7. Verify Size Warning
    if (parseFloat(sizeMB) > 5) {
      console.warn('  ⚠️  Warning: File size > 5MB. Consider reducing quantile or stripping properties.')
    }

    // 8. Generate Canonical Regions List
    console.log('\n📦 Step 4: Generating canonical timezone list...')
    const uniqueRegions = new Set<string>()
    for (const f of processedTzFeatures) {
      // Natural Earth sometimes has null tzid but "name" (offset)
      // Pick decent identifiers. exclude pure offsets?
      // For now keep what we have in tzid
      const id = f.properties.tzid
      if (id && typeof id === 'string' && id !== 'Antarctica' && !id.startsWith('UTC')) {
        uniqueRegions.add(id)
      }
    }

    const sortedRegions = Array.from(uniqueRegions).sort()
    const fileContent = `// Generated by scripts/generate-globe-data.ts
// Source: Natural Earth 10m Time Zones

export const CANONICAL_TZ_REGIONS = ${JSON.stringify(sortedRegions, null, 2)} as const

export type CanonicalTzRegion = typeof CANONICAL_TZ_REGIONS[number]
`
    fs.writeFileSync(CANONICAL_TZ_OUTPUT, fileContent)
    console.log(`  ✅ Generated: ${CANONICAL_TZ_OUTPUT} (${sortedRegions.length} regions)`)

    console.log('\n🎉 Globe data generation complete!')
  } catch (err) {
    console.error('❌ Error generating globe data:', err)
    processExit(1)
  }
}

generateGlobeData().catch(() => {})
