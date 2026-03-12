import slugify from 'slugify';

export function generateSlug(value: string): string {
  return slugify(value, {
    lower: true,
    strict: true,
    locale: 'fr',
    trim: true,
  });
}


/**
 * Générer un slug unique
 * @param name Nom de la ressource
 * @returns Le slug unique
 * @throws Error si le slug existe déjà
 */
export function generateUniqueSlug(name: string): string {
  // Générer le slug à partir du nom
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug;
}
