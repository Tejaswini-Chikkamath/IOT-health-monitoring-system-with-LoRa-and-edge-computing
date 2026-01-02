# preprocess_mitbih.py
# Usage: python preprocess_mitbih.py
import os, sys, json, numpy as np, pandas as pd
import wfdb
from wfdb import processing
from scipy.signal import butter, filtfilt, welch
from scipy.stats import skew, kurtosis

OUTCSV = "ecg_features.csv"
MITDIR = "C:/Users/sachi/Desktop/CAPSTONE1/mitbih"   # folder you downloaded wfdb files into
RECORDS = [f.split('.')[0] for f in os.listdir(MITDIR) if f.endswith('.dat')]
RECORDS = sorted(list(set(RECORDS)))  # unique record ids

# Bandpass
def butter_bandpass(lowcut, highcut, fs, order=4):
    ny = 0.5*fs
    b, a = butter(order, [lowcut/ny, highcut/ny], btype='band')
    return b, a

def bandpass_filter(sig, fs, low=0.5, high=40.0):
    b,a = butter_bandpass(low, high, fs, order=4)
    return filtfilt(b,a,sig)

rows = []
for rec in RECORDS:
    try:
        record = wfdb.rdrecord(os.path.join(MITDIR, rec))
        ann = wfdb.rdann(os.path.join(MITDIR, rec), 'atr')
    except Exception as e:
        print("skip", rec, e); continue

    # choose lead: if MLII present, use channel 0 or 1 heuristics
    sig = record.p_signal[:,0]
    fs = record.fs

    # filter
    sig_f = bandpass_filter(sig, fs)

    # R-peak detection: prefer xqrs then gqrs fallback
    try:
        xqrs = processing.XQRS(sig=sig_f, fs=fs)
        xqrs.detect()
        rpeaks = xqrs.qrs_inds
    except Exception:
        try:
            gqrs = processing.gqrs_detect(sig_f, fs)
            rpeaks = gqrs
        except Exception:
            print("no qrs for", rec); continue

    # compute RR intervals in seconds
    rr = np.diff(rpeaks)/fs
    if len(rr) < 5:
        continue

    # sliding windows: for each beat, compute features from window [-0.5, +0.5]s around R
    win = int(0.5*fs)
    for i, r in enumerate(rpeaks[1:-1], start=1):
        left = max(0, r - win)
        right = min(len(sig_f)-1, r + win)
        seg = sig_f[left:right]
        if len(seg) < int(0.6*fs): continue

        # time features: beats around index i -> local RR stats using rr[i-1] and neighbors
        rr_local = rr[max(0,i-3):min(len(rr), i+2)]
        mean_rr = np.mean(rr_local)
        std_rr = np.std(rr_local)
        rmssd = np.sqrt(np.mean(np.diff(rr_local)**2)) if len(rr_local)>1 else 0.0
        pnn50 = np.sum(np.abs(np.diff(rr_local))>0.05)/max(1,len(rr_local)-1)

        hr_bpm = 60.0/(rr[i-1]) if rr[i-1]>0 else 0.0

        # QRS amplitude and width: approximate via threshold around R
        r_amp = sig_f[r]
        # width: find crossing at 50% amplitude on left/right
        half = 0.5 * r_amp
        # left edge
        le = r
        while le>left and sig_f[le] > half:
            le -= 1
        ri = r
        while ri<right and sig_f[ri] > half:
            ri += 1
        qrs_width = (ri - le) / fs

        # spectral features (Welch)
        f, Pxx = welch(seg, fs=fs, nperseg=min(256, len(seg)))
        # band power
        def bandpow(fmin,fmax):
            idx = np.logical_and(f>=fmin, f<=fmax)
            return np.trapz(Pxx[idx], f[idx]) if np.any(idx) else 0.0
        p_tot = bandpow(0.5,40)
        p_low = bandpow(0.5,5)
        p_mid = bandpow(5,15)
        p_high = bandpow(15,40)

        # shape stats
        sk = float(skew(seg))
        kt = float(kurtosis(seg))

        # build row
        row = {
            "record": rec,
            "sample": int(r),
            "mean_rr": float(mean_rr),
            "std_rr": float(std_rr),
            "rmssd": float(rmssd),
            "pnn50": float(pnn50),
            "hr_bpm": float(hr_bpm),
            "qrs_width": float(qrs_width),
            "r_amp": float(r_amp),
            "p_tot": float(p_tot),
            "p_low": float(p_low),
            "p_mid": float(p_mid),
            "p_high": float(p_high),
            "skew": sk,
            "kurtosis": kt,
            "label": None
        }

        # LABEL: map original annotation symbol to simple classes
        # MIT-BIH beat types: use ann.symbols list (same length as samples)
        # find index in ann.sample closest to r
        idx = np.argmin(np.abs(ann.sample - r))
        sym = ann.symbol[idx]
        # map: normal:'N' , ventricular ectopic:'V','/','E' -> 'V'
        if sym == 'N':
            lab = "Normal"
        elif sym in ('V','E'):
            lab = "Ventricular"
        elif sym in ('A','a','J'):
            lab = "Supraventricular"
        elif sym in ('F',):
            lab = "Fusion"
        else:
            lab = "Other"
        row["label"] = lab
        rows.append(row)

    print("done", rec, "beats:", len(rpeaks))

df = pd.DataFrame(rows)
print("Total rows:", len(df))
df.to_csv(OUTCSV, index=False)
print("Wrote", OUTCSV)
