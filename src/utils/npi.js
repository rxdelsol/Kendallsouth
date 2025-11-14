export async function lookupNPI(npi){
  const clean = String(npi||'').replace(/\D/g,'')
  if(clean.length !== 10) throw new Error('NPI must be 10 digits')

  const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${clean}`

  // Helper to parse the API payload
  const parse = (data) => {
    if(!data || !data.results || !data.results.length) throw new Error('No results for that NPI')
    const r = data.results[0]
    const basic = r.basic || {}
    const addresses = r.addresses || []
    const practice = addresses.find(a=>a.address_purpose==='LOCATION') || addresses[0] || {}
    const tax = (r.taxonomies && r.taxonomies[0]) || {}
    return {
      npi: clean,
      name: [basic.first_name, basic.middle_name, basic.last_name].filter(Boolean).join(' ') || basic.organization_name || '',
      taxonomy: tax.desc || tax.code || '',
      city: practice.city || '',
      state: practice.state || '',
    }
  }

  // Try direct call first
  try{
    const res = await fetch(url, { method: 'GET' })
    if(!res.ok) throw new Error(`NPI API error: ${res.status}`)
    const data = await res.json()
    return parse(data)
  }catch(e){
    // Fallback: AllOrigins CORS proxy (read-only, GET only)
    try{
      const wrapped = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url)
      const res2 = await fetch(wrapped, { method: 'GET' })
      if(!res2.ok) throw new Error(`Proxy error: ${res2.status}`)
      const data2 = await res2.json()
      return parse(data2)
    }catch(e2){
      // Surface the more useful message
      throw new Error(`NPI lookup failed. Details: ${e2.message || e.message}`)
    }
  }
}
