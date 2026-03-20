const MAP_SCRIPT_ID = 'lookforgrim-yandex-maps-script';
const DEFAULT_YANDEX_MAPS_API_KEY = 'ed792bc6-fd33-414a-91f2-58a64b6677dd';

export const createYandexMapsScriptSrc = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || DEFAULT_YANDEX_MAPS_API_KEY;
  const baseUrl = 'https://api-maps.yandex.ru/2.1/?lang=ru_RU';
  return `${baseUrl}&apikey=${encodeURIComponent(apiKey)}`;
};

export const ensureYandexMapsScript = (): HTMLScriptElement => {
  const existingScript = document.getElementById(MAP_SCRIPT_ID) as HTMLScriptElement | null;

  if (existingScript) {
    return existingScript;
  }

  const script = document.createElement('script');
  script.id = MAP_SCRIPT_ID;
  script.src = createYandexMapsScriptSrc();
  script.async = true;
  document.head.append(script);

  return script;
};
