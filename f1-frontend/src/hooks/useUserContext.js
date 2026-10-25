import { useState, useEffect } from 'react';

const WEATHER_CODES = {
  0:  { emoji: '☀️', label: 'clear' },
  1:  { emoji: '🌤️', label: 'mostly clear' },
  2:  { emoji: '⛅', label: 'partly cloudy' },
  3:  { emoji: '☁️', label: 'cloudy' },
  45: { emoji: '🌫️', label: 'fog' },
  48: { emoji: '🌫️', label: 'fog' },
  51: { emoji: '🌦️', label: 'drizzle' },
  53: { emoji: '🌦️', label: 'drizzle' },
  55: { emoji: '🌧️', label: 'drizzle' },
  61: { emoji: '🌧️', label: 'rain' },
  63: { emoji: '🌧️', label: 'rain' },
  65: { emoji: '🌧️', label: 'heavy rain' },
  71: { emoji: '🌨️', label: 'snow' },
  73: { emoji: '🌨️', label: 'snow' },
  75: { emoji: '❄️', label: 'heavy snow' },
  80: { emoji: '🌦️', label: 'showers' },
  81: { emoji: '🌧️', label: 'showers' },
  82: { emoji: '⛈️', label: 'heavy showers' },
  95: { emoji: '⛈️', label: 'storm' },
  96: { emoji: '⛈️', label: 'storm' },
  99: { emoji: '⛈️', label: 'storm' },
};

/* ============================================================ */
/* ================ GET LOCATION VIA IP ======================== */
/* ============================================================ */

async function getLocationFromIpWho() {
  try {
    const r = await fetch('https://ipwho.is/');
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.success) return null;
    return {
      lat: d.latitude,
      lon: d.longitude,
      city: d.city || d.region || null,
      country: d.country_code || null,
    };
  } catch {
    return null;
  }
}

async function getLocationFromIpApi() {
  try {
    const r = await fetch('https://ipapi.co/json/');
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error) return null;
    return {
      lat: d.latitude,
      lon: d.longitude,
      city: d.city || d.region || null,
      country: d.country_code || null,
    };
  } catch {
    return null;
  }
}

async function getLocationFromGps() {
  if (!('geolocation' in navigator)) return null;
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 600000,
      });
    });
    return {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      city: null,
      country: null,
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeNominatim(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=fr`;
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const a = d.address || {};
    return {
      city: a.city || a.town || a.village || a.municipality || a.county || null,
      country: a.country_code ? a.country_code.toUpperCase() : null,
    };
  } catch {
    return null;
  }
}

/* ============================================================ */
/* ===================== MAIN HOOK ============================== */
/* ============================================================ */

export function useUserContext() {
  const [data, setData] = useState({
    city: null,
    country: null,
    weather: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let lat = null, lon = null, city = null, country = null;

        // ===== 1. GPS d'abord (précis) =====
        const gps = await getLocationFromGps();
        if (gps) {
          lat = gps.lat;
          lon = gps.lon;
          console.log('[Weather] GPS OK:', lat, lon);

          // Reverse geocoding pour avoir le nom de la ville
          const geo = await reverseGeocodeNominatim(lat, lon);
          if (geo) {
            city = geo.city;
            country = geo.country;
            console.log('[Weather] Nominatim OK:', city, country);
          }
        }

        // ===== 2. Si pas de GPS, fallback IP =====
        if (lat == null || lon == null) {
          let ipLoc = await getLocationFromIpWho();
          if (!ipLoc) {
            console.log('[Weather] ipwho.is échoué, essai ipapi.co');
            ipLoc = await getLocationFromIpApi();
          }
          if (ipLoc) {
            lat = ipLoc.lat;
            lon = ipLoc.lon;
            city = ipLoc.city;
            country = ipLoc.country;
            console.log('[Weather] IP OK:', city, country, lat, lon);
          }
        }

        // ===== 3. Si GPS mais pas de ville → compléter via IP =====
        if ((lat != null && lon != null) && !city) {
          const ipLoc = await getLocationFromIpWho() || await getLocationFromIpApi();
          if (ipLoc) {
            city = ipLoc.city;
            country = country || ipLoc.country;
            console.log('[Weather] Ville complétée via IP:', city);
          }
        }

        if (lat == null || lon == null) {
          throw new Error('Position introuvable');
        }

        // ===== 4. Météo =====
        let weatherInfo = null;
        try {
          const wUrl = new URL('https://api.open-meteo.com/v1/forecast');
          wUrl.searchParams.set('latitude', lat);
          wUrl.searchParams.set('longitude', lon);
          wUrl.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m');
          wUrl.searchParams.set('timezone', 'auto');

          const wRes = await fetch(wUrl.toString());
          const wData = await wRes.json();

          const wc = wData.current?.weather_code;
          const info = WEATHER_CODES[wc] || { emoji: '🌡️', label: 'n/a' };

          weatherInfo = {
            temperature: wData.current?.temperature_2m,
            windSpeed: wData.current?.wind_speed_10m,
            humidity: wData.current?.relative_humidity_2m,
            code: wc,
            emoji: info.emoji,
            label: info.label,
          };
          console.log('[Weather] Météo OK:', weatherInfo);
        } catch (wErr) {
          console.warn('[Weather] Météo échouée:', wErr.message);
        }

        if (!cancelled) {
          setData({
            city,
            country,
            weather: weatherInfo,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error('[Weather] Erreur globale:', err);
        if (!cancelled) {
          setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return data;
}