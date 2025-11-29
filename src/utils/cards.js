export const FALLBACK_CARD_IMAGE = 'https://images.pokemontcg.io/base1/4.png'

export const formatCurrency = (amount) => {
  const value = Number(amount)
  if (Number.isNaN(value) || value <= 0) {
    return 'S/ 0.00'
  }
  return `S/ ${value.toFixed(2)}`
}

export const getCardPrice = (card) => {
  const priceCandidates = [
    card?.price,
    card?.marketPrice,
    card?.market_price,
    card?.tcgplayerPrice,
    card?.tcgplayer_price,
  ]

  const numeric = priceCandidates
    .map((candidate) => Number(candidate))
    .find((value) => !Number.isNaN(value) && value > 0)

  if (numeric) {
    return Number(numeric.toFixed(2))
  }

  const seedSource = (card?.id ?? card?.name ?? 'pikacards').toString()
  const hash = seedSource
    .split('')
    .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0)

  const pseudoPrice = 5 + (hash % 100) / 5 // Between 5 and 25
  return Number(pseudoPrice.toFixed(2))
}

export const getCardImage = (card) =>
  card?.image ??
  card?.images?.large ??
  card?.images?.small ??
  card?.imageUrl ??
  FALLBACK_CARD_IMAGE

export const getCardSetName = (card) =>
  card?.set ??
  card?.set_name ??
  card?.setId ??
  card?.set_id ??
  'Colección secreta'


