import { findAgencyBySlug } from '../_module-engine.js'

export default function handler(request, response) {
  const slug = request.query?.slug
  const agency = findAgencyBySlug(slug)

  if (!agency) {
    response.status(404).json({
      ok: false,
      error: 'Agence introuvable.',
    })
    return
  }

  response.status(200).json({
    ok: true,
    agency,
  })
}
