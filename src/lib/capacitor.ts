import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = () => Capacitor.isNativePlatform();

export async function initNativeUI(): Promise<void> {
  probeSafeAreaInsets();
  if (!Capacitor.isNativePlatform()) return;
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({ color: '#176F91' });
      await StatusBar.setStyle({ style: Style.Dark });
    } else {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });
    }
  } catch (err) {
    console.warn('[initNativeUI] StatusBar setup failed:', err);
  }
}

function applySafeAreaInsets(): void {
  if (typeof document === 'undefined') return;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;' +
    'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const top = cs.paddingTop || '0px';
  const bottom = cs.paddingBottom || '0px';
  document.body.removeChild(probe);
  const root = document.documentElement;
  if (parseFloat(top) > 0) root.style.setProperty('--sat', top);
  if (parseFloat(bottom) > 0) root.style.setProperty('--sab', bottom);
}

function probeSafeAreaInsets(): void {
  applySafeAreaInsets();
  setTimeout(applySafeAreaInsets, 100);
  setTimeout(applySafeAreaInsets, 500);
  window.addEventListener('resize', applySafeAreaInsets);
  window.addEventListener('orientationchange', applySafeAreaInsets);
}

export const APP_URL = 'https://pandastracker.web.app';

export const openUrl = async (url: string) => {
  if (isNative()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

export const openMailto = async (mailtoUrl: string) => {
  if (isNative()) {
    await Browser.open({ url: mailtoUrl });
  } else {
    window.open(mailtoUrl, '_self');
  }
};

export const openSms = async (smsUrl: string) => {
  if (isNative()) {
    await Browser.open({ url: smsUrl });
  } else {
    window.open(smsUrl, '_self');
  }
};

export const saveFile = async (filename: string, data: string, mimeType: string) => {
  if (isNative()) {
    await Filesystem.writeFile({
      path: filename,
      data,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
    return true;
  }
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
};

export const saveBlobFile = async (filename: string, blob: Blob) => {
  if (isNative()) {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
    await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
    });
    return true;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
};
