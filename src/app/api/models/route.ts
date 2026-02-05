import { NextRequest, NextResponse } from 'next/server'

// Marka-model eşleştirmesi
const BRAND_MODELS: { [key: string]: string[] } = {
  'ROBOTPOS': ['M', 'MK', 'VINTEC', 'EC-LINE', 'EL-LINE', 'RP-81'],
  'HUGIN': ['POS-80', 'POS-58', 'THERMAL-80'],
  'POSSIFY': ['P1', 'P2', 'P3', 'MINI'],
  'POSSAFE': ['PS-100', 'PS-200', 'PS-300'],
  'POSINESS': ['PN-80', 'PN-58'],
  'DESMAK': ['D-100', 'D-200', 'THERMAL'],
  'INGENIGO': ['IG-100', 'IG-200', 'SMART'],
  'SERVIS POINT': ['SP-80', 'SP-58', 'MINI'],
  'TECPRO': ['TP-100', 'TP-200', 'PRO'],
  'PERKON': ['PK-80', 'PK-58'],
  'ERAY': ['E-100', 'E-200'],
  'AFANDA': ['AF-80', 'AF-58'],
  'SETSIS': ['ST-100', 'ST-200'],
  'DENIZ YUKSEL': ['DY-80', 'DY-100'],
  'SAFIR TEKNOLOJI': ['SF-100', 'SF-200'],
  'CAS': ['CAS-80', 'CAS-100', 'SCALE'],
  'ALATEL': ['AL-100', 'AL-200']
}

// GET models for a specific brand
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand')

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand parameter is required' },
        { status: 400 }
      )
    }

    const models = BRAND_MODELS[brand] || []
    return NextResponse.json(models.sort())
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

