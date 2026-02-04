export const lightTheme = {
  bg: '#f5f7fb',
  panel: '#ffffff',
  panel2: 'rgba(255,255,255,0.78)',
  panelHd: 'rgba(248,250,252,0.92)',
  line: '#dde1ea',
  text: '#0f172a',
  muted: '#64748b',
  accent: '#38bdf8',
  accent2: '#a78bfa',
  good: '#16a34a',
  bad: '#ef4444',
  warn: '#f59e0b',
  inputBg: 'rgba(255,255,255,0.90)',
  btnBg: 'rgba(255,255,255,0.78)',
  btnBgHover: 'rgba(255,255,255,0.96)',
  chipBg: 'rgba(255,255,255,0.66)',
  tableBg: 'rgba(255,255,255,0.70)',
  rowHover: 'rgba(56,189,248,0.10)',
  tableLine: 'rgba(15,23,42,0.10)',
  modalBg: 'rgba(255,255,255,0.99)',
  toastBg: 'rgba(255,255,255,0.96)',
};

export const darkTheme = {
  bg: '#0b1220',
  panel: 'rgba(15,27,51,0.70)',
  panel2: 'rgba(15,27,51,0.75)',
  panelHd: 'rgba(12,22,43,0.75)',
  line: '#233252',
  text: '#e8eefc',
  muted: '#9bb0d0',
  accent: '#38bdf8',
  accent2: '#a78bfa',
  good: '#16a34a',
  bad: '#ef4444',
  warn: '#f59e0b',
  inputBg: 'rgba(11,18,32,0.75)',
  btnBg: 'rgba(11,18,32,0.75)',
  btnBgHover: 'rgba(11,18,32,0.92)',
  chipBg: 'rgba(12,22,43,0.55)',
  tableBg: 'rgba(11,18,32,0.55)',
  rowHover: 'rgba(56,189,248,0.055)',
  tableLine: 'rgba(35,50,82,0.65)',
  modalBg: 'rgba(15,27,51,0.95)',
  toastBg: 'rgba(12,22,43,0.95)',
};

export const providerColors = {
  worldpay: {
    bg: 'rgba(37, 99, 235, 0.14)',
    bgHover: 'rgba(37, 99, 235, 0.22)',
    border: 'rgba(37, 99, 235, 0.55)',
  },
  dojo: {
    bg: 'rgba(52, 211, 153, 0.16)',
    bgHover: 'rgba(52, 211, 153, 0.24)',
    border: 'rgba(52, 211, 153, 0.55)',
  },
  'payment-sense': {
    bg: 'rgba(239, 68, 68, 0.12)',
    bgHover: 'rgba(239, 68, 68, 0.20)',
    border: 'rgba(239, 68, 68, 0.55)',
  },
  teya: {
    bg: 'rgba(234, 179, 8, 0.16)',
    bgHover: 'rgba(234, 179, 8, 0.24)',
    border: 'rgba(234, 179, 8, 0.60)',
  },
  'new-lead': {
    bg: 'rgba(132, 204, 22, 0.16)',
    bgHover: 'rgba(132, 204, 22, 0.24)',
    border: 'rgba(132, 204, 22, 0.60)',
  },
  na: {
    bg: 'rgba(148, 163, 184, 0.14)',
    bgHover: 'rgba(148, 163, 184, 0.22)',
    border: 'rgba(148, 163, 184, 0.60)',
  },
};

export type Theme = typeof lightTheme;
