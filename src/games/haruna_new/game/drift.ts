/**
 * MODE DRIFT — parameter & preset.
 *
 * Model fisika (lihat car.ts → dynamicsDrift) memakai ban bergaya Pacejka dengan lingkaran gesek
 * (friction circle), perpindahan beban longitudinal, dan teknik inisiasi yang dipakai pengemudi drift:
 *   • power-over      : tenaga melebihi grip ban belakang
 *   • clutch kick     : angkat gas lalu tekan lagi saat menyetir → lonjakan torsi ke roda belakang
 *   • handbrake       : mengunci roda belakang
 *   • brake / feint   : pengereman & setir berlawanan memindahkan beban ke depan → belakang ringan
 *
 * Mode 'rc' (Sakura RC Drift Pro) memakai mesin yang sama, tetapi tuning-nya diturunkan dari
 * setelan sasis RC (gyro, knuckle, compound ban, ESC turbo, caster/camber/damper/spring) → rcTune().
 */

export type DriftMode = 'normal' | 'sedang' | 'pas' | 'best' | 'rc';

export interface DriftTune {
  rearGrip: number; // μ ban belakang — makin kecil makin licin (mudah lepas)
  frontGrip: number; // μ ban depan
  power: number; // kelipatan tenaga mesin (1 = standar)
  maxSteer: number; // rad — sudut setir maksimum pada kecepatan rendah
  counterSteer: number; // 0..1 — bantuan counter-steer otomatis (self-centering)
  angleAssist: number; // 0..1 — perlindungan spin (grip pulih & peredam yaw di sudut ekstrem)
  maxAngle: number; // rad — sudut drift "target"; di atas ini bantuan mulai menahan
  falloff: number; // bentuk kurva ban (C) — makin besar makin licin setelah lepas
  kick: number; // kekuatan clutch kick
  steerRate: number; // kecepatan respons setir (1/detik)
  speedFade: number; // 0..1 — pengurangan sudut setir di kecepatan tinggi
  // --- khusus mode RC (nilai netral di mode lain) ---
  gyro: number; // 0..1 — gain gyro elektronik
  turbo: number; // 0..1 — ESC turbo boost
  wtGain: number; // besar perpindahan beban (spring lunak = besar)
  wtRate: number; // kecepatan perpindahan beban (oli damper kental = lambat)
  rollVis: number; // pengali rolling bodi visual
  expo: number; // kurva eksponensial setir (1 = linear)
}

export const DRIFT_ORDER: DriftMode[] = ['normal', 'sedang', 'pas', 'best', 'rc'];

export const DRIFT_LABEL: Record<DriftMode, string> = {
  normal: 'Normal',
  sedang: 'Sedang',
  pas: 'Pas',
  best: 'Best',
  rc: 'RC Drift',
};

export const DRIFT_DESC: Record<DriftMode, string> = {
  normal: 'Engine lama: arcade grip tinggi, tikungan bersih, drift hanya sesekali.',
  sedang: 'Drift ringan & mudah dijaga. Bantuan counter-steer kuat, sudut dibatasi ±26°.',
  pas: 'Titik manis: sudut ±41°, gas mengatur sudut, handbrake & clutch kick bekerja penuh.',
  best: 'Gaya pro: ban belakang licin, tenaga besar, sudut setir lebar, drift sampai ±56°.',
  rc: 'Sakura RC Drift Pro: sasis RC 1:10 RWD — gyro, knuckle 76°+, ban HDPE, ESC turbo, suara RB26 & Pit Bench.',
};

const BASE = { gyro: 0, turbo: 0, wtGain: 1, wtRate: 8, rollVis: 1, expo: 1 };

export const DRIFT_PRESETS: Record<'sedang' | 'pas' | 'best', DriftTune> = {
  sedang: {
    ...BASE,
    rearGrip: 1.08,
    frontGrip: 1.22,
    power: 0.92,
    maxSteer: 0.58,
    counterSteer: 0.82,
    angleAssist: 0.88,
    maxAngle: 0.52,
    falloff: 1.22,
    kick: 0.95,
    steerRate: 7.2,
    speedFade: 0.42,
  },
  pas: {
    ...BASE,
    rearGrip: 0.92,
    frontGrip: 1.15,
    power: 0.95,
    maxSteer: 0.66,
    counterSteer: 0.6,
    angleAssist: 0.6,
    maxAngle: 0.72,
    falloff: 1.38,
    kick: 1.1,
    steerRate: 7.5,
    speedFade: 0.45,
  },
  best: {
    ...BASE,
    rearGrip: 0.86,
    frontGrip: 1.2,
    power: 1.2,
    maxSteer: 0.86,
    counterSteer: 0.45,
    angleAssist: 0.4,
    maxAngle: 0.98,
    falloff: 1.5,
    kick: 1.5,
    steerRate: 9,
    speedFade: 0.35,
  },
};

export type SliderKey = 'rearGrip' | 'power' | 'maxSteer' | 'counterSteer' | 'maxAngle';

export interface SliderDef {
  key: SliderKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}

const deg = (r: number) => `${Math.round((r * 180) / Math.PI)}°`;

/** Slider penyesuaian halus (di atas preset) untuk mode non-RC. */
export const DRIFT_SLIDERS: SliderDef[] = [
  { key: 'rearGrip', label: 'Grip ban belakang', hint: 'Kecil = ekor gampang keluar', min: 0.7, max: 1.25, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'power', label: 'Tenaga mesin', hint: 'Besar = gas lebih cepat mematahkan grip', min: 0.5, max: 1.6, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'maxSteer', label: 'Sudut setir maks', hint: 'Lebar = ruang koreksi lebih besar', min: 0.35, max: 1.0, step: 0.01, fmt: deg },
  { key: 'counterSteer', label: 'Bantuan counter-steer', hint: '0 = manual murni, 100% = otomatis penuh', min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: 'maxAngle', label: 'Batas sudut drift', hint: 'Sudut tempat anti-spin mulai menahan', min: 0.3, max: 1.15, step: 0.01, fmt: deg },
];

// =====================================================================================
//  SAKURA RC DRIFT PRO — setelan sasis RC 1:10 RWD
// =====================================================================================

export type RcTire = 'hdpe' | 'poly' | 'rubber';

export interface RcTireDef {
  label: string;
  sub: string;
  mu: number; // koefisien grip ban belakang
  falloff: number; // seberapa licin setelah melewati puncak grip
  note: string;
}

export const RC_TIRES: Record<RcTire, RcTireDef> = {
  hdpe: { label: 'HDPE / P-Tile', sub: 'standar karpet', mu: 0.8, falloff: 1.55, note: 'Licin, slide panjang & terkendali.' },
  poly: { label: 'Polycarbonate', sub: 'sangat licin', mu: 0.68, falloff: 1.7, note: 'Hampir tanpa grip — butuh gyro tinggi.' },
  rubber: { label: 'Soft Rubber', sub: 'lengket', mu: 1.12, falloff: 1.15, note: 'Grip tinggi: drift nyaris mustahil.' },
};

export interface RcSetup {
  gyroGain: number; // 0..100 %
  escBoost: number; // 0..100 % — ESC turbo boost / timing
  knuckle: number; // derajat — sudut belok roda depan (high-angle knuckle)
  tire: RcTire;
  caster: number; // derajat
  camber: number; // derajat, negatif
  damperCst: number; // viskositas oli damper, cSt
  springRate: number; // N/mm
}

export const DEFAULT_RC: RcSetup = {
  gyroGain: 88,
  escBoost: 55,
  knuckle: 72,
  tire: 'hdpe',
  caster: 11,
  camber: -6,
  damperCst: 550,
  springRate: 0.55,
};

export const RC_PRESETS: { id: string; label: string; sub: string; setup: RcSetup }[] = [
  {
    id: 'rookie',
    label: 'Pemula',
    sub: 'gyro tinggi, enteng & responsif - REQUEST',
    setup: { gyroGain: 88, escBoost: 55, knuckle: 72, tire: 'hdpe', caster: 12, camber: -6, damperCst: 550, springRate: 0.55 },
  },
  { id: 'comp', label: 'Kompetisi', sub: 'setelan seimbang', setup: { ...DEFAULT_RC } },
  {
    id: 'pro',
    label: 'Agresif',
    sub: 'polycarbonate, gyro rendah',
    setup: { gyroGain: 35, escBoost: 90, knuckle: 80, tire: 'poly', caster: 6, camber: -8, damperCst: 400, springRate: 0.8 },
  },
];

export interface RcSliderDef {
  key: Exclude<keyof RcSetup, 'tire'>;
  group: 'elektronik' | 'kemudi' | 'suspensi';
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}

export const RC_SLIDERS: RcSliderDef[] = [
  {
    key: 'gyroGain',
    group: 'elektronik',
    label: 'Gyro gain',
    hint: 'Membaca yaw rate & memberi counter-steer otomatis. 0% = manual murni',
    min: 0,
    max: 100,
    step: 1,
    fmt: (v) => `${Math.round(v)}%`,
  },
  {
    key: 'escBoost',
    group: 'elektronik',
    label: 'ESC turbo boost',
    hint: 'Timing brushless: tenaga ekstra di RPM tinggi',
    min: 0,
    max: 100,
    step: 1,
    fmt: (v) => `${Math.round(v)}%`,
  },
  {
    key: 'knuckle',
    group: 'kemudi',
    label: 'Sudut knuckle (steering lock)',
    hint: 'High-angle knuckle: makin lebar, makin dalam drift yang bisa ditahan',
    min: 50,
    max: 80,
    step: 1,
    fmt: (v) => `${Math.round(v)}°`,
  },
  {
    key: 'caster',
    group: 'suspensi',
    label: 'Caster',
    hint: 'Besar = setir lebih self-centering & stabil; kecil = respons masuk lebih tajam',
    min: 0,
    max: 20,
    step: 0.5,
    fmt: (v) => `${v.toFixed(1)}°`,
  },
  {
    key: 'camber',
    group: 'suspensi',
    label: 'Camber depan',
    hint: 'Negatif menambah grip saat belok (optimum ± −6°), terlalu banyak malah menurun',
    min: -12,
    max: 0,
    step: 0.5,
    fmt: (v) => `${v.toFixed(1)}°`,
  },
  {
    key: 'damperCst',
    group: 'suspensi',
    label: 'Oli damper',
    hint: 'Kental = perpindahan beban lambat & stabil; encer = tajam & responsif',
    min: 300,
    max: 800,
    step: 10,
    fmt: (v) => `${Math.round(v)} cSt`,
  },
  {
    key: 'springRate',
    group: 'suspensi',
    label: 'Spring rate',
    hint: 'Lunak = beban berpindah banyak & bodi miring; keras = datar & kaku',
    min: 0.3,
    max: 1.2,
    step: 0.01,
    fmt: (v) => `${v.toFixed(2)} N/mm`,
  },
];

/** Menurunkan tuning fisika dari setelan sasis RC. */
export function rcTune(rc: RcSetup): DriftTune {
  const tire = RC_TIRES[rc.tire];
  const c = Math.abs(rc.camber);
  const camberGain = 1 + 0.028 * c - 0.0022 * c * c; // puncak ≈ −6,4°
  const spring = (rc.springRate - 0.3) / 0.9; // 0 lunak … 1 keras
  const oil = (rc.damperCst - 300) / 500; // 0 encer … 1 kental
  return {
    rearGrip: tire.mu,
    frontGrip: 1.12 * camberGain,
    power: 1.05,
    maxSteer: (rc.knuckle * Math.PI) / 180,
    counterSteer: Math.min(0.5, (rc.caster / 20) * 0.45), // self-centering dari caster
    angleAssist: 0.3,
    maxAngle: 1.25,
    falloff: tire.falloff,
    kick: 1.3,
    steerRate: 10,
    speedFade: 0.5,
    gyro: rc.gyroGain / 100,
    turbo: rc.escBoost / 100,
    wtGain: 1.3 - 0.55 * spring,
    wtRate: 14 - 10 * oil,
    rollVis: 1.5 - 0.9 * spring,
    expo: 1.5,
  };
}

export function cloneTune(mode: DriftMode, rc: RcSetup = DEFAULT_RC): DriftTune {
  if (mode === 'rc') return rcTune(rc);
  return { ...DRIFT_PRESETS[mode === 'normal' ? 'pas' : mode] };
}

export const DRIFT_STORE_KEY = 'haruna_drift_v2_sedang_pemula';
