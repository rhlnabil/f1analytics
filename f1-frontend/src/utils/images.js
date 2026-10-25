import { API_BASE } from '../api/axios';

/**
 * Convertit une URL relative (/uploads/xxx.jpg) en URL absolue.
 * Laisse passer les URLs http(s) telles quelles.
 */
export const imgSrc = url =>
  !url
    ? null
    : url.startsWith('http')
    ? url
    : API_BASE + url;

/**
 * Renvoie l'URL du drapeau animé (GIF) depuis public/flags/.
 * Ex: 'FR' -> '/flags/fr.gif'
 */
export const flagSrc = code =>
  !code
    ? null
    : `/flags/${code.toLowerCase()}.gif`;

/**
 * ✅ NOUVEAU — Renvoie la meilleure photo pour un pilote :
 * 1. transitionPhotoUrl (photo PNG transparent — priorité)
 * 2. actionPhotoUrl (photo d'action)
 * 3. photoUrl (portrait — fallback si jamais)
 */
export const driverPhoto = (driver) =>
  driver?.transitionPhotoUrl ||
  driver?.actionPhotoUrl ||
  driver?.photoUrl ||
  null;