import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export const isNative = () => Capacitor.isNativePlatform();

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
    window.open(mailtoUrl);
  }
};

export const openSms = async (smsUrl: string) => {
  if (isNative()) {
    await Browser.open({ url: smsUrl });
  } else {
    window.open(smsUrl);
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
