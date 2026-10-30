import { useEffect, useState } from 'react';

/** What the browser can tell about the computer it runs on, for the "Current Device" row. */
export type CurrentDevice = { name: string; icon: string; os: string; browser: string; place: string };

// Chromium's User-Agent Client Hints (not in TypeScript's DOM types yet)
type Brand = { brand: string; version: string };
type UAData = {
  brands: Brand[];
  mobile: boolean;
  platform: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ platformVersion?: string; model?: string; fullVersionList?: Brand[] }>;
};

const uaData = () => (navigator as Navigator & { userAgentData?: UAData }).userAgentData;

/** "America/Phoenix" → "Phoenix"; the time zone stands in for location (no permission prompt). */
function place() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  return zone.split('/').pop()?.replace(/_/g, ' ') || 'Unknown location';
}

function browserFrom(brands: Brand[] | undefined, ua: string) {
  const known = brands?.find(b => /Edge|Opera|Chrome|Brave/i.test(b.brand) && !/Not.?A.?Brand|Chromium/i.test(b.brand));
  if (known) return `${known.brand.replace('Microsoft ', '').replace('Google ', '')} ${known.version.split('.')[0]}`;
  const m =
    ua.match(/Edg\/(\d+)/) ? ['Edge', ua.match(/Edg\/(\d+)/)![1]] :
    ua.match(/Firefox\/(\d+)/) ? ['Firefox', ua.match(/Firefox\/(\d+)/)![1]] :
    ua.match(/Chrome\/(\d+)/) ? ['Chrome', ua.match(/Chrome\/(\d+)/)![1]] :
    ua.match(/Version\/(\d+).*Safari/) ? ['Safari', ua.match(/Version\/(\d+)/)![1]] : null;
  return m ? `${m[0]} ${m[1]}` : 'Web browser';
}

/** A first guess from the user agent string, available straight away. */
function basic(): CurrentDevice {
  const ua = navigator.userAgent;
  const data = uaData();
  const platform = data?.platform || (/Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : 'Unknown');
  const browser = browserFrom(data?.brands, ua);
  const common = { browser, place: place() };
  switch (platform) {
    case 'Windows':
      return { name: 'Windows PC', icon: 'monitor', os: 'Windows', ...common };
    case 'macOS':
      return { name: 'Mac', icon: 'monitor', os: 'macOS', ...common };
    case 'iOS':
      return /iPad/.test(ua) ? { name: 'iPad', icon: 'tablet', os: 'iPadOS', ...common } : { name: 'iPhone', icon: 'iphone', os: 'iOS', ...common };
    case 'Android':
      return { name: data?.mobile ?? /Mobile/.test(ua) ? 'Android Phone' : 'Android Tablet', icon: /Mobile/.test(ua) ? 'iphone' : 'tablet', os: 'Android', ...common };
    case 'Chrome OS':
      return { name: 'Chromebook', icon: 'monitor', os: 'ChromeOS', ...common };
    default:
      return { name: `${platform} Computer`, icon: 'monitor', os: platform, ...common };
  }
}

/**
 * The computer this page runs on. Starts from the user agent, then (in Chromium browsers) refines it with the
 * high-entropy client hints: Windows 11 vs 10 (platform version 13+ is Windows 11), the macOS version, the full
 * browser version. Location is the time zone's city, so nothing asks for permission.
 */
export function useCurrentDevice() {
  const [device, setDevice] = useState<CurrentDevice>(basic);
  useEffect(() => {
    const data = uaData();
    if (!data?.getHighEntropyValues) return;
    let live = true;
    data
      .getHighEntropyValues(['platformVersion', 'model', 'fullVersionList'])
      .then(v => {
        if (!live) return;
        setDevice(d => {
          const major = Number(v.platformVersion?.split('.')[0] ?? 0);
          if (data.platform === 'Windows' && v.platformVersion) {
            const os = major >= 13 ? 'Windows 11' : 'Windows 10';
            return { ...d, name: `${os} PC`, os };
          }
          if (data.platform === 'macOS' && v.platformVersion) return { ...d, os: `macOS ${v.platformVersion.split('.').slice(0, 2).join('.')}` };
          if (v.model) return { ...d, name: v.model };
          return d;
        });
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return device;
}
