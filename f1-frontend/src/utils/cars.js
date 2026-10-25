export const CAR_IMAGES = {
  'Ferrari':      '/cars/ferrari.png',
  'Red Bull':     '/cars/redbull.png',
  'McLaren':      '/cars/mclaren.png',
  'Mercedes':     '/cars/mercedes.png',
  'Aston Martin': '/cars/astonmartin.png',
  'Alpine':       '/cars/alpine.png',
  'Williams':     '/cars/williams.png',
  'Haas':         '/cars/haas.png',
  'RB':           '/cars/rb.png',
  'Audi':         '/cars/audi.png',
  'Cadillac':     '/cars/cadillac.png',
  'Racing Bulls': '/cars/rb.png',
};

/**
 * Cherche l'image de voiture correspondant à un nom d'écurie
 * (match exact, puis match partiel insensible à la casse).
 */
export const findCarImage = teamName => {
  if (!teamName) return null;
  if (CAR_IMAGES[teamName]) return CAR_IMAGES[teamName];
  const lower = teamName.toLowerCase();
  return (
    Object.entries(CAR_IMAGES).find(([k]) =>
      lower.includes(k.toLowerCase())
    )?.[1] || null
  );
};