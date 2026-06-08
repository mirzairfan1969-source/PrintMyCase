import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   PHONE DATABASE — 200+ models with dimensions (mm), camera module
   position (cam) and fingerprint type (fp) for accurate cut guides.
   cam: { x, y, w, h, r } — top-left origin on phone BACK (mm)
   fp:  { type: 'none'|'side'|'udp'|'rear', x?, y?, r? }
        rear = needs cutout on back insert (x,y from top-left, r=radius)
        side/udp = no back cutout needed
═══════════════════════════════════════════════════════════════════ */
const PHONES = {
  Apple: {
    "iPhone 16 Pro Max": { w:77.6,h:163.0,t:8.25, cam:{x:5.0,y:5.5,w:43,h:43,r:10}, fp:{type:"none"} },
    "iPhone 16 Pro":     { w:71.5,h:149.6,t:8.25, cam:{x:5.0,y:5.0,w:38,h:38,r:9},  fp:{type:"none"} },
    "iPhone 16 Plus":    { w:77.6,h:163.0,t:7.8,  cam:{x:7.5,y:8.0,w:26,h:48,r:8},  fp:{type:"none"} },
    "iPhone 16":         { w:71.5,h:147.6,t:7.8,  cam:{x:6.5,y:7.5,w:23,h:23,r:7},  fp:{type:"none"} },
    "iPhone 15 Pro Max": { w:76.7,h:159.9,t:8.25, cam:{x:5.0,y:5.5,w:40,h:40,r:10}, fp:{type:"none"} },
    "iPhone 15 Pro":     { w:70.6,h:146.6,t:8.25, cam:{x:5.0,y:5.0,w:36,h:36,r:9},  fp:{type:"none"} },
    "iPhone 15 Plus":    { w:77.8,h:160.9,t:7.8,  cam:{x:7.5,y:8.0,w:24,h:46,r:8},  fp:{type:"none"} },
    "iPhone 15":         { w:71.5,h:155.7,t:7.8,  cam:{x:6.5,y:7.5,w:22,h:42,r:8},  fp:{type:"none"} },
    "iPhone 14 Pro Max": { w:77.6,h:160.7,t:7.85, cam:{x:5.0,y:5.5,w:38,h:38,r:10}, fp:{type:"none"} },
    "iPhone 14 Pro":     { w:71.5,h:147.5,t:7.85, cam:{x:5.0,y:5.0,w:34,h:34,r:9},  fp:{type:"none"} },
    "iPhone 14 Plus":    { w:77.8,h:160.8,t:7.8,  cam:{x:7.5,y:7.5,w:23,h:44,r:8},  fp:{type:"none"} },
    "iPhone 14":         { w:71.5,h:146.7,t:7.8,  cam:{x:7.0,y:7.5,w:22,h:42,r:8},  fp:{type:"none"} },
    "iPhone 13 Pro Max": { w:78.1,h:160.8,t:7.65, cam:{x:5.0,y:5.5,w:36,h:36,r:9},  fp:{type:"none"} },
    "iPhone 13 Pro":     { w:71.5,h:146.7,t:7.65, cam:{x:5.0,y:5.0,w:33,h:33,r:9},  fp:{type:"none"} },
    "iPhone 13":         { w:71.5,h:146.7,t:7.65, cam:{x:7.0,y:7.5,w:21,h:21,r:7},  fp:{type:"none"} },
    "iPhone 13 mini":    { w:64.2,h:131.5,t:7.65, cam:{x:6.5,y:7.0,w:19,h:19,r:7},  fp:{type:"none"} },
    "iPhone 12 Pro Max": { w:78.1,h:160.8,t:7.4,  cam:{x:5.0,y:5.5,w:34,h:34,r:8},  fp:{type:"none"} },
    "iPhone 12 Pro":     { w:71.5,h:146.7,t:7.4,  cam:{x:5.0,y:5.0,w:31,h:31,r:8},  fp:{type:"none"} },
    "iPhone 12":         { w:71.5,h:146.7,t:7.4,  cam:{x:7.0,y:7.5,w:19,h:19,r:7},  fp:{type:"none"} },
    "iPhone 12 mini":    { w:64.2,h:131.5,t:7.4,  cam:{x:6.5,y:7.0,w:17,h:17,r:7},  fp:{type:"none"} },
    "iPhone 11 Pro Max": { w:77.8,h:158.0,t:8.1,  cam:{x:5.5,y:5.5,w:32,h:32,r:8},  fp:{type:"none"} },
    "iPhone 11 Pro":     { w:71.4,h:144.0,t:8.1,  cam:{x:5.0,y:5.0,w:29,h:29,r:8},  fp:{type:"none"} },
    "iPhone 11":         { w:75.7,h:150.9,t:8.3,  cam:{x:7.0,y:7.0,w:20,h:34,r:7},  fp:{type:"none"} },
    "iPhone XR":         { w:75.7,h:150.9,t:8.3,  cam:{x:8.0,y:8.0,w:16,h:16,r:6},  fp:{type:"none"} },
    "iPhone SE (3rd gen)":{ w:67.3,h:138.4,t:7.3, cam:{x:6.5,y:7.0,w:14,h:14,r:5},  fp:{type:"none"} },
    "iPhone SE (2nd gen)":{ w:67.3,h:138.4,t:7.3, cam:{x:6.5,y:7.0,w:14,h:14,r:5},  fp:{type:"none"} },
  },
  Samsung: {
    "Galaxy S25 Ultra":  { w:77.6,h:162.8,t:8.2,  cam:{x:8.0,y:7.5,w:14,h:60,r:5},  fp:{type:"udp"} },
    "Galaxy S25+":       { w:75.8,h:158.4,t:7.3,  cam:{x:8.5,y:8.0,w:12,h:50,r:4},  fp:{type:"udp"} },
    "Galaxy S25":        { w:70.5,h:146.9,t:7.2,  cam:{x:8.0,y:9.0,w:11,h:38,r:4},  fp:{type:"udp"} },
    "Galaxy S24 Ultra":  { w:79.0,h:162.3,t:8.6,  cam:{x:8.5,y:7.5,w:14,h:58,r:5},  fp:{type:"udp"} },
    "Galaxy S24+":       { w:75.9,h:158.5,t:7.7,  cam:{x:9.0,y:8.0,w:13,h:50,r:4},  fp:{type:"udp"} },
    "Galaxy S24":        { w:70.6,h:147.0,t:7.6,  cam:{x:8.0,y:9.0,w:12,h:40,r:4},  fp:{type:"udp"} },
    "Galaxy S23 Ultra":  { w:78.1,h:163.4,t:8.9,  cam:{x:8.5,y:8.0,w:13,h:56,r:5},  fp:{type:"udp"} },
    "Galaxy S23+":       { w:76.2,h:157.8,t:7.6,  cam:{x:9.0,y:8.5,w:12,h:48,r:4},  fp:{type:"udp"} },
    "Galaxy S23":        { w:70.9,h:146.3,t:7.6,  cam:{x:8.0,y:9.5,w:11,h:38,r:4},  fp:{type:"udp"} },
    "Galaxy S22 Ultra":  { w:77.9,h:163.3,t:8.9,  cam:{x:8.5,y:7.5,w:13,h:54,r:5},  fp:{type:"udp"} },
    "Galaxy S22+":       { w:75.8,h:157.4,t:7.6,  cam:{x:9.0,y:8.0,w:12,h:46,r:4},  fp:{type:"udp"} },
    "Galaxy S22":        { w:70.6,h:146.0,t:7.6,  cam:{x:8.0,y:9.0,w:11,h:36,r:4},  fp:{type:"udp"} },
    "Galaxy S21 Ultra":  { w:75.6,h:167.1,t:8.9,  cam:{x:5.0,y:5.0,w:17,h:60,r:5},  fp:{type:"udp"} },
    "Galaxy S21+":       { w:75.6,h:161.4,t:7.8,  cam:{x:5.0,y:5.0,w:14,h:50,r:4},  fp:{type:"udp"} },
    "Galaxy S21":        { w:71.2,h:151.7,t:7.9,  cam:{x:0.0,y:0.0,w:14,h:40,r:4},  fp:{type:"udp"} },
    "Galaxy A55":        { w:76.5,h:161.1,t:8.2,  cam:{x:8.5,y:9.0,w:12,h:42,r:5},  fp:{type:"side",y:67} },
    "Galaxy A54":        { w:76.7,h:158.2,t:8.2,  cam:{x:8.5,y:9.0,w:12,h:40,r:5},  fp:{type:"side",y:65} },
    "Galaxy A35":        { w:76.7,h:161.7,t:8.2,  cam:{x:8.0,y:9.0,w:11,h:38,r:5},  fp:{type:"side",y:67} },
    "Galaxy A34":        { w:78.1,h:161.3,t:8.2,  cam:{x:8.5,y:9.0,w:12,h:38,r:5},  fp:{type:"side",y:66} },
    "Galaxy A25":        { w:76.5,h:161.0,t:7.8,  cam:{x:8.5,y:9.0,w:12,h:36,r:5},  fp:{type:"side",y:66} },
    "Galaxy A15 5G":     { w:76.8,h:160.1,t:8.4,  cam:{x:8.5,y:9.0,w:13,h:34,r:5},  fp:{type:"side",y:65} },
    "Galaxy A15":        { w:76.8,h:160.1,t:8.4,  cam:{x:8.5,y:9.0,w:13,h:34,r:5},  fp:{type:"side",y:65} },
    "Galaxy A14":        { w:76.8,h:167.7,t:9.1,  cam:{x:8.5,y:9.0,w:13,h:32,r:5},  fp:{type:"rear",x:38.4,y:115,r:4} },
    "Galaxy A13":        { w:76.4,h:165.1,t:8.8,  cam:{x:8.5,y:9.0,w:12,h:32,r:5},  fp:{type:"rear",x:38.2,y:112,r:4} },
    "Galaxy A05s":       { w:76.8,h:167.1,t:9.1,  cam:{x:8.5,y:9.0,w:12,h:30,r:5},  fp:{type:"side",y:68} },
    "Galaxy M55":        { w:76.5,h:163.8,t:7.8,  cam:{x:8.5,y:9.0,w:12,h:40,r:5},  fp:{type:"side",y:68} },
    "Galaxy M34":        { w:76.7,h:165.4,t:8.6,  cam:{x:8.5,y:9.0,w:12,h:36,r:5},  fp:{type:"side",y:69} },
    "Galaxy M14":        { w:77.2,h:167.0,t:9.4,  cam:{x:8.5,y:9.0,w:12,h:32,r:5},  fp:{type:"rear",x:38.6,y:113,r:4} },
    "Galaxy F55":        { w:76.5,h:163.8,t:7.8,  cam:{x:8.5,y:9.0,w:12,h:40,r:5},  fp:{type:"side",y:68} },
    "Galaxy F34":        { w:76.7,h:165.4,t:8.6,  cam:{x:8.5,y:9.0,w:12,h:36,r:5},  fp:{type:"side",y:69} },
  },
  OnePlus: {
    "OnePlus 12":            { w:75.8,h:163.1,t:9.15, cam:{x:5.0,y:6.0,w:34,h:40,r:12}, fp:{type:"udp"} },
    "OnePlus 12R":           { w:75.8,h:163.1,t:8.8,  cam:{x:6.0,y:7.0,w:28,h:36,r:10}, fp:{type:"udp"} },
    "OnePlus 11":            { w:74.1,h:163.1,t:8.53, cam:{x:5.0,y:6.0,w:32,h:38,r:12}, fp:{type:"udp"} },
    "OnePlus 11R":           { w:74.0,h:162.2,t:8.7,  cam:{x:6.0,y:7.0,w:26,h:36,r:10}, fp:{type:"udp"} },
    "OnePlus 10 Pro":        { w:73.9,h:163.0,t:8.55, cam:{x:5.0,y:5.0,w:32,h:40,r:12}, fp:{type:"udp"} },
    "OnePlus 10T":           { w:75.0,h:163.3,t:8.75, cam:{x:6.0,y:6.5,w:28,h:36,r:10}, fp:{type:"udp"} },
    "OnePlus 10R":           { w:74.1,h:160.7,t:8.0,  cam:{x:6.5,y:7.5,w:24,h:36,r:9},  fp:{type:"side",y:65} },
    "OnePlus 9 Pro":         { w:73.6,h:163.2,t:8.7,  cam:{x:5.5,y:6.0,w:30,h:38,r:12}, fp:{type:"udp"} },
    "OnePlus 9":             { w:74.2,h:160.7,t:8.7,  cam:{x:6.0,y:7.0,w:26,h:36,r:10}, fp:{type:"udp"} },
    "OnePlus 9R":            { w:74.9,h:162.9,t:8.4,  cam:{x:6.5,y:7.5,w:22,h:34,r:8},  fp:{type:"side",y:66} },
    "OnePlus 9RT":           { w:75.0,h:163.6,t:8.4,  cam:{x:6.0,y:7.0,w:24,h:36,r:9},  fp:{type:"side",y:67} },
    "OnePlus 8T":            { w:74.1,h:160.7,t:8.4,  cam:{x:6.5,y:7.5,w:22,h:34,r:8},  fp:{type:"side",y:65} },
    "OnePlus Nord 4":        { w:74.0,h:162.6,t:8.0,  cam:{x:7.0,y:8.0,w:22,h:40,r:8},  fp:{type:"side",y:67} },
    "OnePlus Nord CE 4":     { w:74.0,h:162.6,t:7.9,  cam:{x:7.5,y:9.0,w:18,h:36,r:7},  fp:{type:"side",y:67} },
    "OnePlus Nord CE 4 Lite":{ w:75.0,h:165.3,t:7.9,  cam:{x:8.0,y:9.0,w:16,h:32,r:6},  fp:{type:"side",y:68} },
    "OnePlus Nord CE 3":     { w:73.7,h:162.5,t:8.2,  cam:{x:7.5,y:9.0,w:18,h:34,r:7},  fp:{type:"side",y:66} },
    "OnePlus Nord 3":        { w:74.0,h:162.4,t:8.1,  cam:{x:7.0,y:8.0,w:20,h:38,r:8},  fp:{type:"side",y:66} },
    "OnePlus Nord CE 3 Lite":{ w:73.7,h:165.7,t:8.3,  cam:{x:8.0,y:9.0,w:16,h:32,r:6},  fp:{type:"side",y:68} },
    "OnePlus Nord 2T":       { w:73.0,h:159.1,t:8.5,  cam:{x:6.5,y:7.5,w:22,h:36,r:8},  fp:{type:"side",y:64} },
    "OnePlus Nord CE 2":     { w:73.5,h:159.2,t:7.8,  cam:{x:7.5,y:8.5,w:18,h:34,r:7},  fp:{type:"side",y:64} },
    "OnePlus Nord CE 2 Lite":{ w:73.5,h:163.3,t:8.3,  cam:{x:8.0,y:9.0,w:16,h:30,r:6},  fp:{type:"side",y:67} },
    "OnePlus Ace 3 Pro":     { w:75.1,h:162.0,t:9.4,  cam:{x:5.0,y:6.0,w:32,h:38,r:11}, fp:{type:"udp"} },
    "OnePlus Ace 3":         { w:74.9,h:161.6,t:8.8,  cam:{x:5.5,y:6.5,w:28,h:36,r:10}, fp:{type:"udp"} },
    "OnePlus Ace 2 Pro":     { w:75.2,h:163.0,t:9.3,  cam:{x:5.0,y:6.0,w:30,h:36,r:11}, fp:{type:"udp"} },
    "OnePlus Ace 2V":        { w:74.2,h:161.5,t:8.1,  cam:{x:6.5,y:7.5,w:22,h:36,r:8},  fp:{type:"side",y:66} },
  },
  Xiaomi: {
    "Xiaomi 14 Ultra":   { w:75.3,h:161.4,t:9.35, cam:{x:3.0,y:3.5,w:50,h:50,r:18}, fp:{type:"udp"} },
    "Xiaomi 14 Pro":     { w:74.9,h:160.9,t:9.55, cam:{x:4.5,y:5.0,w:40,h:40,r:14}, fp:{type:"udp"} },
    "Xiaomi 14":         { w:71.5,h:152.8,t:8.2,  cam:{x:6.0,y:7.0,w:22,h:38,r:8},  fp:{type:"udp"} },
    "Xiaomi 14T Pro":    { w:75.1,h:160.5,t:8.39, cam:{x:4.5,y:5.0,w:38,h:38,r:12}, fp:{type:"udp"} },
    "Xiaomi 14T":        { w:75.1,h:160.5,t:7.8,  cam:{x:5.0,y:6.0,w:34,h:34,r:10}, fp:{type:"udp"} },
    "Xiaomi 13T Pro":    { w:75.0,h:162.2,t:8.49, cam:{x:5.0,y:6.0,w:34,h:34,r:10}, fp:{type:"udp"} },
    "Xiaomi 13T":        { w:75.0,h:162.2,t:8.49, cam:{x:5.0,y:6.0,w:34,h:34,r:10}, fp:{type:"udp"} },
    "Xiaomi 13 Pro":     { w:74.6,h:162.9,t:8.38, cam:{x:4.0,y:4.5,w:38,h:38,r:12}, fp:{type:"udp"} },
    "Xiaomi 13":         { w:71.5,h:152.8,t:8.0,  cam:{x:6.0,y:7.0,w:22,h:36,r:8},  fp:{type:"udp"} },
    "Xiaomi 12 Pro":     { w:74.6,h:163.6,t:8.16, cam:{x:5.0,y:5.5,w:32,h:38,r:10}, fp:{type:"udp"} },
    "Xiaomi 12":         { w:69.9,h:152.7,t:8.16, cam:{x:6.0,y:7.0,w:20,h:34,r:8},  fp:{type:"udp"} },
    "Xiaomi 11T Pro":      { w:76.9,h:164.1,t:8.8,  cam:{x:5.0,y:5.5,w:30,h:36,r:10}, fp:{type:"udp"} },
    "Xiaomi 11T":          { w:76.9,h:164.1,t:8.8,  cam:{x:5.0,y:5.5,w:28,h:34,r:10}, fp:{type:"side",y:67} },
    "Xiaomi 11 Lite 5G":   { w:75.7,h:160.5,t:6.81, cam:{x:7.0,y:8.0,w:20,h:36,r:7},  fp:{type:"side",y:65} },
    "Xiaomi Civi 4 Pro":   { w:73.9,h:159.2,t:7.46, cam:{x:6.5,y:7.0,w:24,h:36,r:8},  fp:{type:"udp"} },
    "Xiaomi Civi 3":       { w:73.8,h:160.0,t:7.24, cam:{x:7.0,y:7.5,w:20,h:34,r:7},  fp:{type:"udp"} },
    "Xiaomi 15 Ultra":     { w:75.9,h:164.1,t:9.45, cam:{x:3.0,y:3.5,w:52,h:52,r:18}, fp:{type:"udp"} },
    "Xiaomi 15 Pro":       { w:74.8,h:161.3,t:8.35, cam:{x:4.5,y:5.0,w:42,h:42,r:14}, fp:{type:"udp"} },
    "Xiaomi 15":           { w:71.4,h:151.9,t:8.08, cam:{x:5.5,y:6.0,w:34,h:34,r:11}, fp:{type:"udp"} },
    "Xiaomi 12T Pro":      { w:75.9,h:163.1,t:8.65, cam:{x:5.0,y:5.5,w:32,h:38,r:10}, fp:{type:"side",y:67} },
    "Xiaomi 12T":          { w:75.9,h:163.1,t:8.65, cam:{x:5.5,y:6.0,w:28,h:34,r:9},  fp:{type:"side",y:67} },
    "Xiaomi 12S Ultra":    { w:74.2,h:163.2,t:9.06, cam:{x:3.5,y:4.0,w:50,h:50,r:18}, fp:{type:"udp"} },
    "Xiaomi MIX Fold 4":   { w:85.3,h:157.8,t:10.4, cam:{x:4.5,y:5.0,w:48,h:48,r:16}, fp:{type:"udp"} },
    "Xiaomi Redmi Turbo 3":{ w:75.1,h:161.3,t:8.1,  cam:{x:5.5,y:6.5,w:28,h:36,r:10}, fp:{type:"side",y:66} },
    "Xiaomi Note 12 Turbo":{ w:74.2,h:161.5,t:8.01, cam:{x:6.0,y:7.0,w:24,h:38,r:9},  fp:{type:"side",y:66} },
  },
  Redmi: {
    "Redmi Note 13 Pro+":  { w:76.0,h:161.4,t:8.9,  cam:{x:7.5,y:8.5,w:14,h:40,r:6},  fp:{type:"side",y:66} },
    "Redmi Note 13 Pro":   { w:76.0,h:161.4,t:8.0,  cam:{x:7.5,y:8.5,w:14,h:38,r:6},  fp:{type:"side",y:66} },
    "Redmi Note 13 5G":    { w:76.0,h:161.4,t:7.6,  cam:{x:8.0,y:9.0,w:13,h:34,r:5},  fp:{type:"side",y:66} },
    "Redmi Note 13":       { w:76.0,h:161.4,t:7.6,  cam:{x:8.0,y:9.0,w:13,h:34,r:5},  fp:{type:"side",y:66} },
    "Redmi Note 12 Pro+":  { w:76.0,h:162.9,t:8.7,  cam:{x:7.5,y:8.5,w:13,h:38,r:6},  fp:{type:"side",y:67} },
    "Redmi Note 12 Pro":   { w:76.0,h:162.9,t:8.03, cam:{x:7.5,y:8.5,w:13,h:36,r:6},  fp:{type:"side",y:67} },
    "Redmi Note 12":       { w:73.9,h:159.9,t:7.98, cam:{x:8.0,y:9.0,w:12,h:32,r:5},  fp:{type:"side",y:65} },
    "Redmi Note 11 Pro+":  { w:76.1,h:164.2,t:8.12, cam:{x:7.5,y:8.5,w:13,h:36,r:6},  fp:{type:"side",y:67} },
    "Redmi Note 11 Pro":   { w:76.1,h:164.2,t:8.12, cam:{x:7.5,y:8.5,w:13,h:34,r:6},  fp:{type:"side",y:67} },
    "Redmi Note 11":       { w:73.9,h:159.9,t:8.09, cam:{x:8.0,y:9.0,w:12,h:30,r:5},  fp:{type:"side",y:65} },
    "Redmi 13C":           { w:75.6,h:167.2,t:8.1,  cam:{x:8.5,y:9.5,w:12,h:30,r:5},  fp:{type:"rear",x:37.8,y:115,r:4} },
    "Redmi 12":            { w:76.3,h:167.6,t:8.17, cam:{x:8.5,y:9.5,w:12,h:30,r:5},  fp:{type:"side",y:70} },
    "Redmi 12C":           { w:76.6,h:168.8,t:8.77, cam:{x:8.5,y:9.5,w:12,h:28,r:5},  fp:{type:"rear",x:38.3,y:115,r:4} },
    "Redmi A2+":           { w:75.9,h:166.8,t:8.9,  cam:{x:8.5,y:9.5,w:11,h:26,r:4},  fp:{type:"rear",x:37.9,y:113,r:4} },
    "Redmi A3":            { w:76.3,h:167.1,t:8.3,  cam:{x:8.5,y:9.5,w:11,h:26,r:4},  fp:{type:"side",y:69} },
  },
  POCO: {
    "POCO X6 Pro":  { w:74.3,h:160.5,t:8.26, cam:{x:6.5,y:7.5,w:20,h:38,r:8},  fp:{type:"udp"} },
    "POCO X6":      { w:74.3,h:160.5,t:8.0,  cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"side",y:65} },
    "POCO X5 Pro":  { w:76.7,h:162.0,t:8.01, cam:{x:7.5,y:8.5,w:16,h:36,r:6},  fp:{type:"side",y:66} },
    "POCO X5":      { w:76.7,h:162.9,t:8.08, cam:{x:7.5,y:8.5,w:15,h:34,r:6},  fp:{type:"side",y:66} },
    "POCO X4 Pro":  { w:76.1,h:164.5,t:8.1,  cam:{x:7.5,y:8.5,w:15,h:34,r:6},  fp:{type:"side",y:67} },
    "POCO F5 Pro":  { w:74.2,h:162.8,t:8.49, cam:{x:6.0,y:7.0,w:22,h:38,r:8},  fp:{type:"udp"} },
    "POCO F5":      { w:74.2,h:158.9,t:7.9,  cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"side",y:64} },
    "POCO F4":      { w:73.9,h:163.2,t:7.7,  cam:{x:7.0,y:8.0,w:16,h:34,r:6},  fp:{type:"side",y:67} },
    "POCO F4 GT":   { w:76.7,h:162.5,t:8.5,  cam:{x:7.0,y:8.0,w:16,h:34,r:6},  fp:{type:"side",y:66} },
    "POCO M6 Pro":  { w:75.2,h:162.6,t:8.3,  cam:{x:8.0,y:9.0,w:13,h:32,r:5},  fp:{type:"side",y:66} },
    "POCO M6":      { w:76.8,h:168.2,t:8.3,  cam:{x:8.0,y:9.0,w:12,h:28,r:5},  fp:{type:"rear",x:38.4,y:114,r:4} },
    "POCO M5s":     { w:76.6,h:163.1,t:8.09, cam:{x:8.0,y:9.0,w:12,h:30,r:5},  fp:{type:"side",y:66} },
    "POCO C65":     { w:76.8,h:168.2,t:8.3,  cam:{x:8.0,y:9.5,w:11,h:26,r:4},  fp:{type:"rear",x:38.4,y:114,r:4} },
  },
  OPPO: {
    "OPPO Find X8 Pro":    { w:76.0,h:162.8,t:9.1,  cam:{x:4.0,y:4.5,w:44,h:44,r:15}, fp:{type:"udp"} },
    "OPPO Find X8":        { w:74.9,h:161.1,t:8.24, cam:{x:4.5,y:5.0,w:38,h:38,r:13}, fp:{type:"udp"} },
    "OPPO Find X7 Ultra":  { w:75.1,h:163.5,t:9.5,  cam:{x:3.5,y:4.0,w:48,h:48,r:16}, fp:{type:"udp"} },
    "OPPO Find X7":        { w:74.9,h:161.6,t:9.0,  cam:{x:4.5,y:5.0,w:38,h:38,r:13}, fp:{type:"udp"} },
    "OPPO Find X6 Pro":    { w:74.9,h:162.5,t:9.11, cam:{x:4.0,y:4.5,w:44,h:44,r:15}, fp:{type:"udp"} },
    "OPPO Find N3 Flip":   { w:75.8,h:166.2,t:7.84, cam:{x:6.5,y:7.0,w:22,h:38,r:8},  fp:{type:"side",y:68} },
    "OPPO Reno 13 Pro":    { w:74.7,h:161.5,t:7.9,  cam:{x:6.0,y:7.0,w:24,h:42,r:9},  fp:{type:"udp"} },
    "OPPO Reno 13":        { w:74.7,h:161.5,t:7.4,  cam:{x:7.0,y:8.0,w:20,h:38,r:7},  fp:{type:"udp"} },
    "OPPO Reno 12 Pro":    { w:74.7,h:161.5,t:8.0,  cam:{x:6.5,y:7.5,w:22,h:40,r:8},  fp:{type:"udp"} },
    "OPPO Reno 12":        { w:74.7,h:161.5,t:7.4,  cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"udp"} },
    "OPPO Reno 12F":       { w:74.7,h:162.0,t:7.5,  cam:{x:7.5,y:8.5,w:16,h:32,r:6},  fp:{type:"side",y:66} },
    "OPPO Reno 11 Pro":    { w:74.2,h:161.5,t:8.02, cam:{x:6.5,y:7.5,w:22,h:40,r:8},  fp:{type:"udp"} },
    "OPPO Reno 11":        { w:74.2,h:161.5,t:7.93, cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"udp"} },
    "OPPO Reno 11F":       { w:74.2,h:162.0,t:7.6,  cam:{x:7.5,y:8.5,w:16,h:30,r:6},  fp:{type:"side",y:66} },
    "OPPO Reno 10 Pro+":   { w:74.2,h:161.5,t:8.96, cam:{x:6.0,y:7.0,w:24,h:42,r:9},  fp:{type:"udp"} },
    "OPPO Reno 10 Pro":    { w:74.2,h:161.5,t:8.2,  cam:{x:6.5,y:7.5,w:22,h:40,r:8},  fp:{type:"udp"} },
    "OPPO Reno 10":        { w:74.2,h:161.5,t:7.9,  cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"udp"} },
    "OPPO Reno 8 Pro":     { w:74.2,h:161.5,t:7.99, cam:{x:7.0,y:7.5,w:20,h:38,r:8},  fp:{type:"udp"} },
    "OPPO Reno 8":         { w:74.1,h:161.5,t:7.99, cam:{x:7.5,y:8.5,w:17,h:34,r:7},  fp:{type:"udp"} },
    "OPPO Reno 8T":        { w:74.1,h:162.7,t:8.0,  cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"side",y:67} },
    "OPPO F27 Pro+":       { w:75.5,h:162.3,t:7.72, cam:{x:7.0,y:8.0,w:18,h:34,r:7},  fp:{type:"udp"} },
    "OPPO F27 Pro":        { w:75.4,h:162.1,t:7.7,  cam:{x:7.0,y:8.0,w:18,h:34,r:7},  fp:{type:"udp"} },
    "OPPO F25 Pro":        { w:75.4,h:161.7,t:7.52, cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"udp"} },
    "OPPO F23":            { w:75.6,h:162.7,t:7.99, cam:{x:7.5,y:8.5,w:16,h:30,r:6},  fp:{type:"side",y:67} },
    "OPPO A3 Pro":         { w:75.0,h:162.6,t:7.5,  cam:{x:7.5,y:8.5,w:16,h:30,r:6},  fp:{type:"side",y:66} },
    "OPPO A79 5G":         { w:75.6,h:164.3,t:7.99, cam:{x:8.0,y:9.0,w:14,h:32,r:5},  fp:{type:"side",y:68} },
    "OPPO A78 5G":         { w:74.7,h:163.8,t:8.0,  cam:{x:8.0,y:9.0,w:14,h:30,r:5},  fp:{type:"side",y:67} },
    "OPPO A58 5G":         { w:75.6,h:164.3,t:8.0,  cam:{x:8.0,y:9.0,w:14,h:30,r:5},  fp:{type:"side",y:68} },
    "OPPO A38":            { w:75.6,h:163.7,t:7.99, cam:{x:8.0,y:9.0,w:14,h:28,r:5},  fp:{type:"side",y:67} },
    "OPPO A17":            { w:74.1,h:163.8,t:8.3,  cam:{x:8.0,y:9.0,w:13,h:26,r:5},  fp:{type:"rear",x:37.0,y:112,r:4} },
    "OPPO A16":            { w:75.6,h:163.7,t:8.4,  cam:{x:8.5,y:9.5,w:12,h:24,r:4},  fp:{type:"rear",x:37.8,y:112,r:4} },
  },
  Realme: {
    "Realme GT 7 Pro":       { w:74.5,h:162.5,t:8.5,  cam:{x:4.5,y:5.0,w:40,h:40,r:13}, fp:{type:"udp"} },
    "Realme GT 7":           { w:74.6,h:162.0,t:7.9,  cam:{x:5.5,y:6.5,w:30,h:38,r:11}, fp:{type:"udp"} },
    "Realme GT 6T":          { w:74.2,h:162.0,t:8.0,  cam:{x:5.5,y:6.5,w:28,h:38,r:10}, fp:{type:"udp"} },
    "Realme GT 6":           { w:74.2,h:162.0,t:8.0,  cam:{x:5.5,y:6.5,w:28,h:38,r:10}, fp:{type:"udp"} },
    "Realme GT 5 Pro":       { w:74.2,h:162.5,t:9.0,  cam:{x:5.0,y:6.0,w:32,h:40,r:12}, fp:{type:"udp"} },
    "Realme GT 5":           { w:74.2,h:162.5,t:8.9,  cam:{x:5.0,y:6.0,w:30,h:38,r:11}, fp:{type:"udp"} },
    "Realme GT Neo 6":       { w:74.2,h:161.5,t:8.0,  cam:{x:6.0,y:7.0,w:24,h:38,r:9},  fp:{type:"udp"} },
    "Realme GT Neo 6 SE":    { w:74.2,h:161.5,t:7.8,  cam:{x:6.5,y:7.5,w:22,h:36,r:8},  fp:{type:"udp"} },
    "Realme GT Neo 5":       { w:74.2,h:161.5,t:8.9,  cam:{x:6.0,y:7.0,w:24,h:38,r:9},  fp:{type:"udp"} },
    "Realme GT Neo 5 SE":    { w:74.2,h:161.5,t:8.0,  cam:{x:6.5,y:7.5,w:22,h:36,r:8},  fp:{type:"udp"} },
    "Realme GT Neo 3":       { w:74.2,h:162.5,t:8.2,  cam:{x:6.0,y:7.0,w:24,h:38,r:9},  fp:{type:"udp"} },
    "Realme GT Neo 3T":      { w:74.2,h:162.5,t:8.4,  cam:{x:6.5,y:7.5,w:22,h:36,r:8},  fp:{type:"side",y:67} },
    "Realme 13 Pro+":        { w:74.7,h:161.5,t:8.1,  cam:{x:6.0,y:7.0,w:24,h:40,r:9},  fp:{type:"udp"} },
    "Realme 13 Pro":         { w:74.7,h:161.5,t:7.9,  cam:{x:6.5,y:7.5,w:20,h:36,r:7},  fp:{type:"udp"} },
    "Realme 13+":            { w:76.1,h:161.6,t:7.8,  cam:{x:7.5,y:8.5,w:16,h:34,r:6},  fp:{type:"side",y:66} },
    "Realme 13":             { w:75.1,h:161.3,t:7.95, cam:{x:7.5,y:8.5,w:15,h:32,r:6},  fp:{type:"side",y:66} },
    "Realme 12 Pro+":        { w:76.1,h:161.5,t:8.78, cam:{x:6.5,y:7.5,w:22,h:38,r:8},  fp:{type:"udp"} },
    "Realme 12 Pro":         { w:76.1,h:161.5,t:7.99, cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"udp"} },
    "Realme 12+":            { w:76.1,h:161.6,t:7.8,  cam:{x:7.5,y:8.5,w:16,h:34,r:6},  fp:{type:"side",y:66} },
    "Realme 12":             { w:75.1,h:161.3,t:7.95, cam:{x:7.5,y:8.5,w:15,h:32,r:6},  fp:{type:"side",y:66} },
    "Realme 11 Pro+":        { w:74.2,h:161.5,t:8.2,  cam:{x:5.5,y:6.5,w:28,h:36,r:10}, fp:{type:"udp"} },
    "Realme 11 Pro":         { w:74.2,h:161.5,t:7.9,  cam:{x:6.0,y:7.0,w:22,h:34,r:8},  fp:{type:"udp"} },
    "Realme 11":             { w:73.9,h:163.4,t:7.8,  cam:{x:7.5,y:8.5,w:15,h:30,r:5},  fp:{type:"side",y:67} },
    "Realme 11x":            { w:76.1,h:166.6,t:8.1,  cam:{x:8.0,y:9.0,w:13,h:28,r:5},  fp:{type:"side",y:69} },
    "Realme 10 Pro+":        { w:74.2,h:161.5,t:8.4,  cam:{x:6.0,y:7.0,w:22,h:36,r:8},  fp:{type:"udp"} },
    "Realme 10 Pro":         { w:74.2,h:161.5,t:7.99, cam:{x:7.0,y:8.0,w:18,h:32,r:7},  fp:{type:"side",y:66} },
    "Realme 10":             { w:74.2,h:164.1,t:8.0,  cam:{x:8.0,y:9.0,w:14,h:28,r:5},  fp:{type:"side",y:67} },
    "Realme Narzo 70 Turbo": { w:75.6,h:162.5,t:7.9,  cam:{x:6.5,y:7.5,w:18,h:36,r:7},  fp:{type:"side",y:66} },
    "Realme Narzo 70 Pro":   { w:75.6,h:162.5,t:8.1,  cam:{x:7.0,y:8.0,w:16,h:34,r:6},  fp:{type:"udp"} },
    "Realme Narzo 70":       { w:75.6,h:162.5,t:7.99, cam:{x:7.5,y:8.5,w:15,h:30,r:5},  fp:{type:"side",y:66} },
    "Realme Narzo 60 Pro":   { w:75.6,h:162.5,t:7.99, cam:{x:6.5,y:7.5,w:18,h:34,r:7},  fp:{type:"udp"} },
    "Realme Narzo 60":       { w:75.6,h:162.5,t:7.9,  cam:{x:7.5,y:8.5,w:15,h:28,r:5},  fp:{type:"side",y:66} },
    "Realme Narzo 60x":      { w:76.8,h:167.8,t:8.1,  cam:{x:8.0,y:9.0,w:13,h:26,r:5},  fp:{type:"side",y:69} },
    "Realme C67 5G":         { w:76.0,h:165.7,t:7.99, cam:{x:8.0,y:9.0,w:13,h:26,r:5},  fp:{type:"side",y:68} },
    "Realme C65":            { w:76.0,h:165.0,t:7.79, cam:{x:8.0,y:9.0,w:13,h:28,r:5},  fp:{type:"rear",x:38.0,y:113,r:4} },
    "Realme C63":            { w:75.6,h:166.4,t:7.69, cam:{x:8.0,y:9.0,w:12,h:26,r:4},  fp:{type:"side",y:68} },
    "Realme C55":            { w:74.9,h:162.9,t:7.89, cam:{x:7.5,y:8.5,w:22,h:22,r:8},  fp:{type:"side",y:66} },
    "Realme C53":            { w:74.4,h:167.3,t:7.99, cam:{x:8.0,y:9.0,w:14,h:24,r:5},  fp:{type:"side",y:69} },
    "Realme C51":            { w:75.1,h:167.9,t:8.1,  cam:{x:8.0,y:9.0,w:13,h:22,r:4},  fp:{type:"rear",x:37.5,y:114,r:4} },
    "Realme C35":            { w:75.6,h:164.4,t:8.1,  cam:{x:8.0,y:9.0,w:13,h:24,r:4},  fp:{type:"side",y:67} },
  },
  Vivo: {
    "Vivo X100 Ultra": { w:75.8,h:164.9,t:9.8,  cam:{x:3.5,y:4.0,w:48,h:48,r:16}, fp:{type:"udp"} },
    "Vivo X100 Pro":   { w:75.3,h:164.1,t:9.5,  cam:{x:4.0,y:4.5,w:44,h:44,r:15}, fp:{type:"udp"} },
    "Vivo X100":       { w:75.0,h:163.0,t:9.1,  cam:{x:4.5,y:5.0,w:38,h:38,r:12}, fp:{type:"udp"} },
    "Vivo V30 Pro":    { w:74.0,h:163.3,t:7.46, cam:{x:6.0,y:7.0,w:24,h:40,r:9},  fp:{type:"udp"} },
    "Vivo V30":        { w:74.0,h:163.3,t:7.25, cam:{x:6.5,y:7.5,w:20,h:38,r:8},  fp:{type:"udp"} },
    "Vivo V29 Pro":    { w:73.9,h:162.6,t:7.94, cam:{x:6.5,y:7.5,w:22,h:38,r:8},  fp:{type:"udp"} },
    "Vivo V29":        { w:74.2,h:163.2,t:7.39, cam:{x:7.0,y:8.0,w:20,h:36,r:7},  fp:{type:"udp"} },
    "Vivo T3x":        { w:77.0,h:168.0,t:8.09, cam:{x:7.5,y:8.5,w:14,h:32,r:5},  fp:{type:"side",y:70} },
    "Vivo T3 Pro":     { w:74.5,h:163.6,t:7.69, cam:{x:6.5,y:7.5,w:18,h:36,r:7},  fp:{type:"side",y:67} },
    "Vivo Y200 Pro":   { w:75.1,h:163.6,t:7.69, cam:{x:7.5,y:8.5,w:16,h:32,r:6},  fp:{type:"side",y:67} },
    "Vivo Y200":       { w:74.5,h:162.5,t:7.79, cam:{x:7.5,y:8.5,w:15,h:30,r:5},  fp:{type:"side",y:66} },
    "Vivo Y100":       { w:74.5,h:162.5,t:7.79, cam:{x:7.5,y:8.5,w:15,h:28,r:5},  fp:{type:"side",y:66} },
    "Vivo Y27":        { w:76.4,h:164.1,t:8.19, cam:{x:8.0,y:9.0,w:14,h:26,r:5},  fp:{type:"side",y:67} },
    "Vivo Y16":        { w:76.8,h:164.3,t:8.04, cam:{x:8.0,y:9.0,w:13,h:24,r:4},  fp:{type:"rear",x:38.4,y:112,r:4} },
  },
  Motorola: {
    "Edge 50 Ultra":   { w:74.0,h:161.1,t:8.59, cam:{x:5.5,y:6.0,w:28,h:42,r:10}, fp:{type:"udp"} },
    "Edge 50 Pro":     { w:72.4,h:158.4,t:8.19, cam:{x:6.0,y:7.0,w:24,h:38,r:9},  fp:{type:"udp"} },
    "Edge 50":         { w:73.0,h:161.6,t:7.99, cam:{x:6.5,y:7.5,w:22,h:36,r:8},  fp:{type:"udp"} },
    "Edge 50 Fusion":  { w:72.0,h:160.9,t:7.8,  cam:{x:6.5,y:7.5,w:20,h:34,r:7},  fp:{type:"udp"} },
    "Edge 50 Neo":     { w:71.6,h:155.8,t:8.1,  cam:{x:7.0,y:8.0,w:18,h:32,r:7},  fp:{type:"udp"} },
    "Moto G85":        { w:72.2,h:161.7,t:7.59, cam:{x:7.0,y:8.0,w:18,h:34,r:7},  fp:{type:"side",y:66} },
    "Moto G84":        { w:72.2,h:161.7,t:7.59, cam:{x:7.0,y:8.0,w:16,h:32,r:6},  fp:{type:"side",y:66} },
    "Moto G64":        { w:76.0,h:163.5,t:7.99, cam:{x:7.5,y:8.5,w:16,h:32,r:6},  fp:{type:"side",y:67} },
    "Moto G54":        { w:76.0,h:163.5,t:7.99, cam:{x:7.5,y:8.5,w:15,h:30,r:5},  fp:{type:"side",y:67} },
    "Moto G34":        { w:76.6,h:166.9,t:8.29, cam:{x:8.0,y:9.0,w:13,h:26,r:5},  fp:{type:"side",y:69} },
    "Moto G24":        { w:76.6,h:166.9,t:8.29, cam:{x:8.0,y:9.0,w:13,h:24,r:5},  fp:{type:"rear",x:38.3,y:113,r:4} },
    "Moto G14":        { w:76.6,h:166.9,t:8.29, cam:{x:8.0,y:9.0,w:12,h:24,r:4},  fp:{type:"rear",x:38.3,y:112,r:4} },
    "Moto E13":        { w:74.8,h:164.9,t:9.0,  cam:{x:8.0,y:9.0,w:11,h:22,r:4},  fp:{type:"rear",x:37.4,y:112,r:4} },
    "Moto E40":        { w:75.9,h:165.1,t:9.0,  cam:{x:7.5,y:8.5,w:12,h:24,r:4},  fp:{type:"rear",x:37.9,y:112,r:4} },
  },
  Nothing: {
    "Phone (2a) Plus": { w:76.3,h:162.1,t:8.55, cam:{x:7.0,y:8.0,w:16,h:36,r:7},  fp:{type:"side",y:66} },
    "Phone (2a)":      { w:76.3,h:162.1,t:8.55, cam:{x:7.0,y:8.0,w:16,h:36,r:7},  fp:{type:"side",y:66} },
    "Phone (2)":       { w:76.4,h:162.1,t:8.6,  cam:{x:6.5,y:7.5,w:20,h:38,r:8},  fp:{type:"side",y:66} },
    "Phone (1)":       { w:75.8,h:159.2,t:8.3,  cam:{x:7.0,y:8.0,w:18,h:36,r:7},  fp:{type:"side",y:64} },
    "CMF Phone 1":     { w:76.7,h:163.9,t:7.8,  cam:{x:7.5,y:8.5,w:15,h:30,r:5},  fp:{type:"side",y:67} },
  },
  "Google Pixel": {
    "Pixel 9 Pro XL":   { w:76.6,h:162.8,t:8.5, cam:{x:5.0,y:6.0,w:66,h:18,r:7},  fp:{type:"udp"} },
    "Pixel 9 Pro Fold": { w:88.0,h:155.2,t:10.5,cam:{x:5.5,y:6.0,w:55,h:18,r:7},  fp:{type:"udp"} },
    "Pixel 9 Pro":      { w:72.0,h:152.8,t:8.5, cam:{x:5.0,y:6.0,w:62,h:16,r:7},  fp:{type:"udp"} },
    "Pixel 9":          { w:72.0,h:152.8,t:8.5, cam:{x:5.0,y:6.0,w:62,h:15,r:7},  fp:{type:"udp"} },
    "Pixel 8 Pro":      { w:75.9,h:162.6,t:8.8, cam:{x:5.0,y:6.0,w:66,h:18,r:7},  fp:{type:"udp"} },
    "Pixel 8":          { w:70.8,h:150.5,t:8.9, cam:{x:5.0,y:6.0,w:61,h:15,r:7},  fp:{type:"udp"} },
    "Pixel 8a":         { w:72.7,h:154.4,t:8.9, cam:{x:5.0,y:6.0,w:63,h:15,r:7},  fp:{type:"udp"} },
    "Pixel 7a":         { w:72.9,h:152.4,t:9.0, cam:{x:5.0,y:6.0,w:63,h:15,r:7},  fp:{type:"udp"} },
    "Pixel 7 Pro":      { w:76.6,h:162.9,t:8.9, cam:{x:5.0,y:6.0,w:66,h:18,r:7},  fp:{type:"udp"} },
    "Pixel 7":          { w:73.2,h:155.6,t:8.7, cam:{x:5.0,y:6.0,w:63,h:15,r:7},  fp:{type:"udp"} },
    "Pixel 6a":         { w:71.8,h:152.2,t:8.9, cam:{x:5.0,y:6.0,w:62,h:14,r:7},  fp:{type:"udp"} },
    "Pixel 6 Pro":      { w:75.9,h:163.9,t:8.9, cam:{x:5.0,y:5.5,w:66,h:18,r:7},  fp:{type:"udp"} },
    "Pixel 6":          { w:74.8,h:158.6,t:8.9, cam:{x:5.0,y:5.5,w:65,h:15,r:7},  fp:{type:"udp"} },
  },
  iQOO: {
    "iQOO 12":          { w:75.1,h:163.5,t:8.6, cam:{x:4.5,y:5.0,w:38,h:38,r:12}, fp:{type:"udp"} },
    "iQOO 11":          { w:75.2,h:164.9,t:8.9, cam:{x:5.0,y:5.5,w:34,h:34,r:10}, fp:{type:"udp"} },
    "iQOO Neo 9 Pro":   { w:75.1,h:163.5,t:8.6, cam:{x:5.5,y:6.5,w:28,h:38,r:10}, fp:{type:"udp"} },
    "iQOO Neo 7 Pro":   { w:75.2,h:163.1,t:8.4, cam:{x:6.0,y:7.0,w:24,h:36,r:9},  fp:{type:"udp"} },
    "iQOO Z9":          { w:74.7,h:162.5,t:7.98,cam:{x:7.0,y:8.0,w:18,h:34,r:7},  fp:{type:"side",y:66} },
    "iQOO Z9x":         { w:76.8,h:167.7,t:8.0, cam:{x:8.0,y:9.0,w:14,h:28,r:5},  fp:{type:"side",y:69} },
    "iQOO Z7 Pro":      { w:74.2,h:161.5,t:7.98,cam:{x:7.0,y:8.0,w:16,h:32,r:6},  fp:{type:"side",y:66} },
  },
};

const BRANDS = Object.keys(PHONES);
const A4 = { w: 210, h: 297 }; // mm

const BRAND_ACCENT = {
  Apple: "#111",        Samsung: "#1428A0",  OnePlus: "#F50514",
  Xiaomi: "#FF6900",   Redmi: "#E63232",    POCO: "#e8b800",
  OPPO: "#1F6B35",     Realme: "#e0a800",   Vivo: "#415FFF",
  Motorola: "#5C0FC8", Nothing: "#222",     "Google Pixel": "#4285F4",
};

/* ═══════════════════════════════════════════════════════════════════
   SMART LAYOUT ENGINE
   Automatically positions 1-4 phone slots on A4, scaling down if needed
═══════════════════════════════════════════════════════════════════ */
function computeLayout(dims, count, bleed = 3, margin = 8, gap = 5) {
  const sw = dims.w + bleed * 2;
  const sh = dims.h + bleed * 2;
  const aw = A4.w - margin * 2;
  const ah = A4.h - margin * 2;
  const mk = (x, y, s = 1) => ({
    x, y, w: sw * s, h: sh * s, bleed: bleed * s, pw: dims.w * s, ph: dims.h * s,
  });

  if (count === 1)
    return [mk(margin + (aw - sw) / 2, margin + (ah - sh) / 2)];

  if (count === 2) {
    if (sw * 2 + gap <= aw) {
      const ox = margin + (aw - (sw * 2 + gap)) / 2, cy = margin + (ah - sh) / 2;
      return [mk(ox, cy), mk(ox + sw + gap, cy)];
    }
    const ox = margin + (aw - sw) / 2, oy = margin + (ah - (sh * 2 + gap)) / 2;
    return [mk(ox, oy), mk(ox, oy + sh + gap)];
  }

  if (count === 3) {
    if (sw * 2 + gap <= aw && sh * 2 + gap <= ah) {
      const ox = margin + (aw - (sw * 2 + gap)) / 2, oy = margin + (ah - (sh * 2 + gap)) / 2;
      return [mk(ox, oy), mk(ox + sw + gap, oy), mk(margin + (aw - sw) / 2, oy + sh + gap)];
    }
    const s3 = Math.min(1, aw / (sw * 3 + gap * 2), ah / sh);
    const [sw3, sh3, g3] = [sw * s3, sh * s3, gap * s3];
    const ox = margin + (aw - (sw3 * 3 + g3 * 2)) / 2, cy = margin + (ah - sh3) / 2;
    return [0, 1, 2].map(i => mk(ox + i * (sw3 + g3), cy, s3));
  }

  if (count === 4) {
    const s4 = Math.min(1, aw / (sw * 2 + gap), ah / (sh * 2 + gap));
    const [sw4, sh4, g4] = [sw * s4, sh * s4, gap * s4];
    const ox = margin + (aw - (sw4 * 2 + g4)) / 2, oy = margin + (ah - (sh4 * 2 + g4)) / 2;
    return [[ox, oy], [ox + sw4 + g4, oy], [ox, oy + sh4 + g4], [ox + sw4 + g4, oy + sh4 + g4]]
      .map(([x, y]) => mk(x, y, s4));
  }
  return [];
}

/* ═══════════════════════════════════════════════════════════════════
   CANVAS RENDERER
   Draws a complete A4 sheet: photos, bleed guides, cut marks, labels
═══════════════════════════════════════════════════════════════════ */
function renderA4(canvas, phone, layout, photos = [], opts = {}) {
  if (!canvas || !phone) return;
  const ctx = canvas.getContext("2d");
  const sc = canvas.height / A4.h;
  const { showBleed = true, bgColor = "#f8f8f8" } = opts;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  layout.forEach((slot, idx) => {
    const x = slot.x * sc, y = slot.y * sc, w = slot.w * sc, h = slot.h * sc;
    const bl = slot.bleed * sc;
    const ix = x + bl, iy = y + bl, iw = slot.pw * sc, ih = slot.ph * sc;
    const photo = photos[idx];

    // ── Slot background ───────────────────────────────────────
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);

    // ── Photo with transforms ─────────────────────────────────
    if (photo?.img) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const { zoom = 1, rotate = 0, offsetX = 0, offsetY = 0,
              brightness = 100, contrast = 100, saturation = 100 } = photo;
      const ia = photo.img.width / photo.img.height, sa = w / h;
      let fw = ia > sa ? h * ia : w, fh = ia > sa ? h : w / ia;
      fw *= zoom; fh *= zoom;
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      ctx.drawImage(photo.img, -fw / 2 + offsetX * w, -fh / 2 + offsetY * h, fw, fh);
      ctx.filter = "none";
      ctx.restore();
    } else {
      // Placeholder
      ctx.fillStyle = "#ebebeb";
      ctx.fillRect(x, y, w, h);
      // Subtle cross-hatch diagonal lines
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 0.5 * sc;
      for (let i = -h; i < w + h; i += 8 * sc) {
        ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke();
      }
      ctx.restore();
      ctx.fillStyle = "#b0b0b0";
      ctx.font = `600 ${Math.max(7, 6.5 * sc)}px 'Outfit',system-ui,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(`Photo ${idx + 1}`, x + w / 2, y + h / 2 - sc * 4);
      ctx.font = `${Math.max(5, 5 * sc)}px 'Outfit',system-ui,sans-serif`;
      ctx.fillStyle = "#c8c8c8";
      ctx.fillText(`${slot.pw.toFixed(1)} × ${slot.ph.toFixed(1)} mm`, x + w / 2, y + h / 2 + sc * 4);
    }

    // ── Bleed guide — inner blue dashed rectangle ─────────────
    if (showBleed) {
      ctx.strokeStyle = "rgba(99,102,241,0.6)";
      ctx.setLineDash([sc * 2, sc * 2]);
      ctx.lineWidth = sc * 0.45;
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.setLineDash([]);
    }

    // ── Cut border — outer dashed ─────────────────────────────
    ctx.strokeStyle = "#374151";
    ctx.setLineDash([sc * 3.5, sc * 2.5]);
    ctx.lineWidth = sc * 0.7;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // ── Corner registration marks ─────────────────────────────
    const mk = sc * 5;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = sc * 0.75;
    ctx.lineCap = "round";
    [[x, y, -mk, -mk], [x + w, y, mk, -mk], [x, y + h, -mk, mk], [x + w, y + h, mk, mk]]
      .forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(cx + dx, cy); ctx.lineTo(cx, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy + dy); ctx.lineTo(cx, cy); ctx.stroke();
      });

    // ── Camera & fingerprint cutout guides ────────────────────
    // pxMm: canvas pixels per 1 mm of original phone dimension
    // (accounts for any slot scaling in 3/4-photo layouts)
    const pxMm = iw / phone.dims.w;

    // Helper — draw a manual rounded-rect path (no ctx.roundRect needed)
    const rrPath = (rx, ry, rw, rh, rr) => {
      const r = Math.min(rr, rw / 2, rh / 2);
      ctx.beginPath();
      ctx.moveTo(rx + r, ry);
      ctx.lineTo(rx + rw - r, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + r);
      ctx.lineTo(rx + rw, ry + rh - r);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - r, ry + rh);
      ctx.lineTo(rx + r, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - r);
      ctx.lineTo(rx, ry + r);
      ctx.quadraticCurveTo(rx, ry, rx + r, ry);
      ctx.closePath();
    };

    const dims = phone.dims;

    // ── Camera module cutout (red dashed) ─────────────────────
    if (dims.cam) {
      const { x: cx, y: cy, w: cw, h: ch, r: cr = 4 } = dims.cam;
      const px = ix + cx * pxMm, py = iy + cy * pxMm;
      const pw = cw * pxMm,      ph = ch * pxMm;
      const pr = cr * pxMm;
      const lw = Math.max(0.5, sc * 0.7);
      const fs = Math.max(4, 4.5 * sc);

      ctx.save();
      // Tinted fill
      ctx.fillStyle = "rgba(239,68,68,0.09)";
      rrPath(px, py, pw, ph, pr); ctx.fill();
      // Dashed border
      ctx.strokeStyle = "rgba(220,38,38,0.92)";
      ctx.setLineDash([lw * 2.5, lw * 2]);
      ctx.lineWidth = lw;
      rrPath(px, py, pw, ph, pr); ctx.stroke();
      ctx.setLineDash([]);
      // Label above the module
      ctx.fillStyle = "rgba(220,38,38,1)";
      ctx.font = `700 ${fs}px system-ui,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText("✂ CAMERA CUT", px + pw / 2, py - lw);
      ctx.restore();
    }

    // ── Rear fingerprint cutout (green dashed circle) ─────────
    if (dims.fp?.type === "rear") {
      const { x: fpx = dims.w / 2, y: fpy, r: fpr = 5 } = dims.fp;
      const px = ix + fpx * pxMm, py = iy + fpy * pxMm;
      const pr = fpr * pxMm;
      const lw = Math.max(0.5, sc * 0.7);
      const fs = Math.max(4, 4.5 * sc);

      ctx.save();
      ctx.fillStyle = "rgba(16,185,129,0.09)";
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(5,150,105,0.92)";
      ctx.setLineDash([lw * 2.5, lw * 2]);
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(5,150,105,1)";
      ctx.font = `700 ${fs}px system-ui,sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText("✂ FP CUT", px, py - pr - lw);
      ctx.restore();
    }

    // ── Slot label ────────────────────────────────────────────
    ctx.fillStyle = "#9ca3af";
    ctx.font = `${Math.max(4.5, 5 * sc)}px 'Outfit',system-ui,sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    const fpNote = dims.fp?.type === "udp" ? " · FP under-display" : dims.fp?.type === "side" ? " · side FP" : "";
    ctx.fillText(
      `${phone.brand} ${phone.model}  ·  ${phone.dims.w}×${phone.dims.h}mm${fpNote}`,
      x + w / 2, y + h + sc * 2
    );
  });

  // ── Footer ─────────────────────────────────────────────────
  ctx.fillStyle = "#c4c4c4";
  ctx.font = `${Math.max(4, 4 * sc)}px 'Outfit',system-ui,sans-serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText("Print at 100% scale — do NOT scale or fit to page", sc * 5, (A4.h - 3) * sc);
  ctx.textAlign = "right";
  ctx.fillText("PrintMyCase", (A4.w - 5) * sc, (A4.h - 3) * sc);
}

/* ═══════════════════════════════════════════════════════════════════
   ZERO-DEPENDENCY PDF BUILDER
   Builds a valid multi-page PDF by embedding JPEG images directly.
   No CDN or external libraries needed — runs entirely in the browser.
═══════════════════════════════════════════════════════════════════ */

/**
 * Converts a canvas to raw JPEG bytes (Uint8Array).
 */
function canvasToJpegBytes(canvas, quality = 0.92) {
  const b64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Builds a PDF Blob from an array of JPEG pages.
 * Each page is { bytes: Uint8Array, w: number, h: number } (pixel dimensions).
 * The PDF page size is always A4 (595.28 × 841.89 pt).
 *
 * Object layout:
 *   1 → Catalog
 *   2 → Pages
 *   3+i*3 → Page i
 *   4+i*3 → Content stream i
 *   5+i*3 → Image XObject i
 */
function buildPDF(jpegPages) {
  const enc = new TextEncoder();
  const chunks = [];   // Uint8Array[]
  let pos = 0;

  // Helpers ─────────────────────────────────────────────────────────
  const writeStr = (s) => { const b = enc.encode(s); chunks.push(b); pos += b.length; };
  const writeBin = (b) => { chunks.push(b);           pos += b.length; };
  const curPos   = ()  => pos;

  const n = jpegPages.length;
  const PW = 595.28, PH = 841.89;                  // A4 in PDF points
  const totalObjs = 2 + n * 3;
  const offsets   = new Array(totalObjs + 2).fill(0);

  // Header ──────────────────────────────────────────────────────────
  writeStr("%PDF-1.4\n");

  // Object 1 — Catalog ──────────────────────────────────────────────
  offsets[1] = curPos();
  writeStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Object 2 — Pages tree ───────────────────────────────────────────
  offsets[2] = curPos();
  const kidsRef = Array.from({ length: n }, (_, i) => `${3 + i * 3} 0 R`).join(" ");
  writeStr(`2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${n} >>\nendobj\n`);

  // One set of 3 objects per page ───────────────────────────────────
  for (let i = 0; i < n; i++) {
    const { bytes: imgBytes, w: imgW, h: imgH } = jpegPages[i];
    const pN = 3 + i * 3;   // Page dict
    const cN = 4 + i * 3;   // Content stream
    const mN = 5 + i * 3;   // Image XObject

    // Content stream: place image with Y-flip so JPEG top-left → PDF top-left
    // Matrix: [PW  0  0  -PH  0  PH]  scales & flips the unit square to full A4
    const contStr  = enc.encode(`q ${PW.toFixed(2)} 0 0 ${(-PH).toFixed(2)} 0 ${PH.toFixed(2)} cm /Im${i + 1} Do Q\n`);

    // Page dict
    offsets[pN] = curPos();
    writeStr(
      `${pN} 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R\n` +
      `   /MediaBox [0 0 ${PW.toFixed(2)} ${PH.toFixed(2)}]\n` +
      `   /Contents ${cN} 0 R\n` +
      `   /Resources << /XObject << /Im${i + 1} ${mN} 0 R >> >> >>\n` +
      `endobj\n`
    );

    // Content stream object
    offsets[cN] = curPos();
    writeStr(`${cN} 0 obj\n<< /Length ${contStr.length} >>\nstream\n`);
    writeBin(contStr);
    writeStr("endstream\nendobj\n");

    // Image XObject (JPEG, DCT-encoded)
    offsets[mN] = curPos();
    writeStr(
      `${mN} 0 obj\n` +
      `<< /Type /XObject /Subtype /Image\n` +
      `   /Width ${imgW} /Height ${imgH}\n` +
      `   /ColorSpace /DeviceRGB /BitsPerComponent 8\n` +
      `   /Filter /DCTDecode /Length ${imgBytes.length} >>\n` +
      `stream\n`
    );
    writeBin(imgBytes);
    writeStr("\nendstream\nendobj\n");
  }

  // Cross-reference table ───────────────────────────────────────────
  const xrefPos = curPos();
  writeStr(`xref\n0 ${totalObjs + 1}\n`);
  writeStr("0000000000 65535 f \n");
  for (let i = 1; i <= totalObjs; i++) {
    writeStr(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }

  // Trailer ─────────────────────────────────────────────────────────
  writeStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefPos}\n%%EOF\n`
  );

  // Assemble final Uint8Array ───────────────────────────────────────
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }

  return new Blob([result], { type: "application/pdf" });
}

/**
 * Downloads a Blob as a named file using an anchor click.
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Opens sheets in a new browser tab as a standalone print-ready HTML page.
 * Shows instructions + "Print Now" button; @page CSS ensures exact A4.
 * Completely avoids the sandboxed-iframe printing restriction.
 */
function openPrintWindow(imageSrcs) {
  const pages = imageSrcs
    .map(src => `<div class="pg"><img src="${src}" alt="print sheet"></div>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8">
<title>PrintMyCase — Print Sheet</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#f0f0ee;font-family:system-ui,sans-serif}
  .bar{background:#fff;border-bottom:1px solid #ddd;padding:12px 20px;
       display:flex;align-items:center;gap:14px;position:sticky;top:0;z-index:10}
  .bar h1{font-size:15px;font-weight:700;color:#111}
  .bar p{font-size:11px;color:#666;flex:1;line-height:1.5}
  .bar button{padding:9px 22px;background:#6366f1;color:#fff;border:none;
              border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}
  .warn{background:#fffbe6;border-bottom:1px solid #e6d800;
        padding:8px 20px;font-size:11px;color:#7a6600}
  .pg{width:210mm;height:297mm;margin:16px auto;background:#fff;
      box-shadow:0 4px 24px rgba(0,0,0,.18);overflow:hidden}
  .pg img{width:210mm;height:297mm;display:block}
  @page{size:A4 portrait;margin:0}
  @media print{
    .bar,.warn{display:none}
    body{background:#fff}
    .pg{width:210mm;height:297mm;margin:0;box-shadow:none;page-break-after:always}
    .pg:last-child{page-break-after:avoid}
  }
</style>
</head><body>
<div class="bar">
  <span style="font-size:26px">🖨️</span>
  <div>
    <h1>PrintMyCase — Ready to Print</h1>
    <p>Paper: <b>A4</b> &nbsp;·&nbsp; Scale: <b>100% / Actual Size</b> &nbsp;·&nbsp; Margins: <b>None / 0 mm</b></p>
  </div>
  <button onclick="window.print()">Print Now</button>
</div>
<div class="warn">⚠️ In the browser print dialog set Scale = <strong>100%</strong> and
Margins = <strong>None</strong> — do NOT use "Fit to page"</div>
${pages}
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const tab  = window.open(url, "_blank");
  if (!tab) {
    alert("Popup blocked!\nPlease allow popups for this site, then click 'Print Directly' again.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ═══════════════════════════════════════════════════════════════════
   MINI A4 THUMBNAIL — used in layout picker (Step 2)
═══════════════════════════════════════════════════════════════════ */
function MiniA4Preview({ layout, active, dark }) {
  return (
    <div style={{
      width: "100%", aspectRatio: "210/297", position: "relative",
      background: dark ? "#1e1e2e" : "#f0f0ee", borderRadius: 4, overflow: "hidden",
    }}>
      {layout.map((slot, i) => {
        const pct = (v, total) => `${(v / total) * 100}%`;
        return (
          <div key={i} style={{
            position: "absolute",
            left: pct(slot.x, A4.w), top: pct(slot.y, A4.h),
            width: pct(slot.w, A4.w), height: pct(slot.h, A4.h),
            border: `1.5px dashed ${active ? "#6366f1" : "#a5b4fc"}`,
            background: active ? "rgba(99,102,241,0.18)" : "rgba(165,180,252,0.1)",
            borderRadius: 1,
          }} />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   IMAGE EDITOR MODAL — zoom, rotate, pan, brightness/contrast/saturation
═══════════════════════════════════════════════════════════════════ */
function ImageEditor({ editing, onSave, onCancel, dark }) {
  const [st, setSt] = useState({
    zoom:       editing.zoom       ?? 1,
    rotate:     editing.rotate     ?? 0,
    offsetX:    editing.offsetX    ?? 0,
    offsetY:    editing.offsetY    ?? 0,
    brightness: editing.brightness ?? 100,
    contrast:   editing.contrast   ?? 100,
    saturation: editing.saturation ?? 100,
  });

  const set = (k, v) => setSt(p => ({ ...p, [k]: v }));
  const reset = () => setSt({ zoom: 1, rotate: 0, offsetX: 0, offsetY: 0, brightness: 100, contrast: 100, saturation: 100 });

  const C = dark ? {
    bg: "#13131e", border: "#2d2d42", text: "#f3f4f6",
    muted: "#6b7280", sub: "#9ca3af", btn: "#1e1e2e", btnText: "#d1d5db",
  } : {
    bg: "#ffffff", border: "#e5e7eb", text: "#111827",
    muted: "#9ca3af", sub: "#6b7280", btn: "#f3f4f6", btnText: "#374151",
  };

  const Slider = ({ label, k, min, max, step = 1, fmt = v => v }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 11, color: C.text, fontFamily: "monospace", fontWeight: 600 }}>{fmt(st[k])}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={st[k]}
        onChange={e => set(k, +e.target.value)}
        style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }} />
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 620, borderRadius: 22,
        border: `1px solid ${C.border}`, background: C.bg,
        boxShadow: "0 32px 80px rgba(0,0,0,0.45)", overflow: "hidden",
        fontFamily: "'Outfit',system-ui,sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: C.text }}>Edit Image</span>
          <button onClick={onCancel} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: C.btn, color: C.muted, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 16, padding: 18, flexWrap: "wrap" }}>
          {/* Live preview */}
          <div style={{ flex: "1 1 150px", minWidth: 130, maxWidth: 190 }}>
            <div style={{ borderRadius: 12, overflow: "hidden", background: dark ? "#1e1e2e" : "#f0f0f0", aspectRatio: "9/16" }}>
              <img src={editing.dataURL} alt="preview" style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                filter: `brightness(${st.brightness}%) contrast(${st.contrast}%) saturate(${st.saturation}%)`,
                transform: `rotate(${st.rotate}deg) scale(${st.zoom}) translate(${st.offsetX * 50}%, ${st.offsetY * 50}%)`,
                transformOrigin: "center", transition: "all 0.12s ease",
              }} />
            </div>
            {/* Quick rotate buttons */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Rotate</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[[-90, "↺ 90°"], [90, "↻ 90°"], [180, "↕ 180°"], [270, "↔ 270°"]].map(([deg, lbl]) => (
                  <button key={deg} onClick={() => set("rotate", (st.rotate + deg) % 360)}
                    style={{ padding: "5px 0", borderRadius: 7, border: `1px solid ${C.border}`, background: C.btn, color: C.btnText, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Slider label="Zoom"       k="zoom"       min={0.5} max={3}   step={0.05} fmt={v => `${v.toFixed(2)}×`} />
            <Slider label="Offset X"   k="offsetX"    min={-1}  max={1}   step={0.04} fmt={v => v.toFixed(2)} />
            <Slider label="Offset Y"   k="offsetY"    min={-1}  max={1}   step={0.04} fmt={v => v.toFixed(2)} />
            <Slider label="Brightness" k="brightness" min={20}  max={200} fmt={v => `${v}%`} />
            <Slider label="Contrast"   k="contrast"   min={20}  max={200} fmt={v => `${v}%`} />
            <Slider label="Saturation" k="saturation" min={0}   max={200} fmt={v => `${v}%`} />
            <button onClick={reset} style={{ width: "100%", padding: "7px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: 12, marginTop: 2 }}>
              ↺ Reset All
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, padding: "0 18px 18px" }}>
          <button onClick={onCancel} style={{ padding: "11px 20px", borderRadius: 11, border: `1px solid ${C.border}`, background: "transparent", color: C.btnText, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            Cancel
          </button>
          <button onClick={() => onSave(st)} style={{ flex: 1, padding: "11px 0", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#6366f1,#3b82f6)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>
            ✓ Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════ */
export default function PrintMyCase() {
  // Load custom fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  const [step, setStep]           = useState(1);
  const [dark, setDark]           = useState(false);
  const [brand, setBrand]         = useState("");
  const [model, setModel]         = useState("");
  const [sheetCount, setSheetCount] = useState(1);
  const [perSheet, setPerSheet]   = useState(2);
  const [bleed, setBleed]         = useState(3);
  const [photos, setPhotos]       = useState({});
  const [activeSheet, setActiveSheet] = useState(0);
  const [dragOver, setDragOver]   = useState(null);
  const [editing, setEditing]     = useState(null);
  const [showBleed, setShowBleed] = useState(true);
  const [bgColor, setBgColor]     = useState("#f8f8f8");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfDone, setPdfDone]     = useState(false);
  const [narrow, setNarrow]       = useState(false);

  const canvasRef  = useRef(null);
  const fileRef    = useRef(null);
  const pendingSlot = useRef(null);

  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 700);
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const phone  = brand && model ? { brand, model, dims: PHONES[brand]?.[model] } : null;
  const models = brand ? Object.keys(PHONES[brand] || {}) : [];
  const layout = useMemo(() => phone ? computeLayout(phone.dims, perSheet, bleed) : [], [phone, perSheet, bleed]);
  const totalPhones = useMemo(() => BRANDS.reduce((a, b) => a + Object.keys(PHONES[b]).length, 0), []);

  // Redraw canvas whenever relevant state changes
  useEffect(() => {
    if (!canvasRef.current || !phone || step !== 4) return;
    const sp = Array.from({ length: perSheet }, (_, i) => photos[`${activeSheet}-${i}`] || null);
    renderA4(canvasRef.current, phone, layout, sp, { showBleed, bgColor });
  }, [phone, layout, photos, activeSheet, showBleed, bgColor, step, perSheet]);

  const handleFile = useCallback((file, key) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => setPhotos(prev => ({
        ...prev,
        [key]: { img, dataURL: e.target.result, zoom: 1, rotate: 0, offsetX: 0, offsetY: 0, brightness: 100, contrast: 100, saturation: 100 },
      }));
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Renders all sheets to JPEG pages, builds PDF blob, downloads ──
  const generatePDF = async () => {
    if (!phone) return;
    setPdfLoading(true);
    try {
      // 200 DPI render: 1mm = ~7.87px → A4 = 1654×2340px
      const pxmm = 200 / 25.4;
      const jpegPages = [];
      for (let s = 0; s < sheetCount; s++) {
        const oc = document.createElement("canvas");
        oc.width  = Math.round(A4.w * pxmm);
        oc.height = Math.round(A4.h * pxmm);
        const sl = computeLayout(phone.dims, perSheet, bleed);
        const sp = Array.from({ length: perSheet }, (_, i) => photos[`${s}-${i}`] || null);
        renderA4(oc, phone, sl, sp, { showBleed: false, bgColor });
        jpegPages.push({ bytes: canvasToJpegBytes(oc, 0.93), w: oc.width, h: oc.height });
      }
      const blob = buildPDF(jpegPages);
      downloadBlob(blob, `PrintMyCase-${phone.model.replace(/\s+/g, "-")}.pdf`);
      setPdfDone(true);
      setTimeout(() => setPdfDone(false), 3000);
    } catch (e) {
      console.error("PDF error:", e);
      alert("PDF generation failed:\n" + e.message);
    }
    setPdfLoading(false);
  };

  // ── Render sheets and open in a new print-ready tab ───────────────
  const handlePrint = () => {
    if (!phone) return;
    const imgSrcs = [];
    for (let s = 0; s < sheetCount; s++) {
      const oc = document.createElement("canvas");
      // 150 DPI for print tab — crisp enough, renders fast
      const pxmm = 150 / 25.4;
      oc.width  = Math.round(A4.w * pxmm);
      oc.height = Math.round(A4.h * pxmm);
      const sl = computeLayout(phone.dims, perSheet, bleed);
      const sp = Array.from({ length: perSheet }, (_, i) => photos[`${s}-${i}`] || null);
      renderA4(oc, phone, sl, sp, { showBleed: true, bgColor });
      imgSrcs.push(oc.toDataURL("image/jpeg", 0.95));
    }
    openPrintWindow(imgSrcs);
  };

  /* ─── Design tokens ─────────────────────────────────────────── */
  const C = dark ? {
    bg: "#0c0c14", card: "#13131e", border: "#252535",
    text: "#f3f4f6", muted: "#6b7280", sub: "#9ca3af",
    subtle: "#1e1e2e", subtle2: "#252535", input: "#1e1e2e",
  } : {
    bg: "#fafaf8", card: "#ffffff", border: "#e8e8e4",
    text: "#111827", muted: "#9ca3af", sub: "#6b7280",
    subtle: "#f4f4f0", subtle2: "#ebebeb", input: "#fafaf8",
  };

  const fontFamily = "'Outfit', system-ui, sans-serif";
  const headingFont = "'Syne', 'Outfit', system-ui, sans-serif";
  const ACCENT = "#6366f1";

  const CARD = {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
    padding: 26, fontFamily, color: C.text,
  };
  const BTN_PRI = {
    background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
    color: "#fff", border: "none", borderRadius: 12, padding: "13px 22px",
    fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily,
    transition: "box-shadow 0.2s, transform 0.15s",
  };
  const BTN_GHOST = {
    background: "transparent", color: C.sub, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "12px 18px", fontWeight: 600, fontSize: 13,
    cursor: "pointer", fontFamily, transition: "background 0.15s",
  };
  const INPUT = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontFamily,
    border: `1px solid ${C.border}`, background: C.input, color: C.text,
    fontSize: 14, outline: "none", boxSizing: "border-box",
  };

  const photoCount = Object.keys(photos).filter(k => k.startsWith(`${activeSheet}-`)).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily, color: C.text, transition: "background 0.3s, color 0.3s" }}>

      {/* ══════════════ HEADER ══════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: dark ? "rgba(12,12,20,0.94)" : "rgba(250,250,248,0.94)",
        backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`,
        padding: "0 20px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 33, height: 33, borderRadius: 10,
            background: "linear-gradient(135deg,#6366f1,#3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: headingFont, fontWeight: 800, fontSize: 14, color: "#fff",
            boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          }}>P</div>
          <span style={{
            fontFamily: headingFont, fontWeight: 800, fontSize: 19,
            background: "linear-gradient(135deg,#6366f1,#3b82f6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>PrintMyCase</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {phone && step > 1 && (
            <span style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, background: dark ? "#1e1e2e" : "rgba(99,102,241,0.08)", color: ACCENT, fontWeight: 600 }}>
              {phone.brand} {phone.model}
            </span>
          )}
          <button onClick={() => setDark(d => !d)} style={{
            width: 35, height: 35, borderRadius: 9, border: `1px solid ${C.border}`,
            background: C.subtle, color: dark ? "#fbbf24" : "#6b7280",
            cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {dark ? "☀" : "☽"}
          </button>
        </div>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      {step === 1 && (
        <div style={{
          textAlign: "center", padding: "52px 20px 36px",
          background: dark
            ? "radial-gradient(ellipse 70% 260px at 50% 0, rgba(99,102,241,0.14), transparent)"
            : "radial-gradient(ellipse 70% 260px at 50% 0, rgba(99,102,241,0.07), transparent)",
        }}>
          <h1 style={{ fontFamily: headingFont, fontWeight: 800, fontSize: "clamp(22px,5.5vw,44px)", lineHeight: 1.12, margin: "0 0 14px", letterSpacing: "-0.03em" }}>
            Custom Phone Case<br />Insert Generator
          </h1>
          <p style={{ color: C.muted, fontSize: 15, maxWidth: 460, margin: "0 auto 22px", lineHeight: 1.65 }}>
            Upload your photos, choose your layout, download a print-ready A4 PDF with precise cut guides for any phone model.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 7 }}>
            {[`${totalPhones}+ phone models`, "Smart layout engine", "Bleed & cut guides", "300 DPI PDF", "In-browser photo editor"].map(t => (
              <span key={t} style={{ fontSize: 11, padding: "4px 13px", borderRadius: 20, border: `1px solid ${C.border}`, color: C.sub, background: dark ? C.subtle : "#fff", letterSpacing: "0.01em" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ STEP PROGRESS BAR ══════════════ */}
      <div style={{ maxWidth: 840, margin: "0 auto", padding: narrow ? "12px 16px 4px" : "14px 24px 4px" }}>
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", maxWidth: 380, margin: "0 auto 28px" }}>
          <div style={{ position: "absolute", top: 16, left: 0, right: 0, height: 2, background: C.border }} />
          <div style={{ position: "absolute", top: 16, left: 0, height: 2, background: "linear-gradient(90deg,#6366f1,#3b82f6)", width: `${((step - 1) / 3) * 100}%`, transition: "width 0.45s cubic-bezier(0.4,0,0.2,1)" }} />
          {[{ n: 1, l: "Phone" }, { n: 2, l: "Layout" }, { n: 3, l: "Photos" }, { n: 4, l: "Export" }].map(({ n, l }) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, cursor: n < step ? "pointer" : "default" }} onClick={() => n < step && setStep(n)}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, transition: "all 0.3s",
                background: n <= step ? "linear-gradient(135deg,#6366f1,#3b82f6)" : C.subtle2,
                color: n <= step ? "#fff" : C.muted,
                boxShadow: n === step ? "0 0 0 4px rgba(99,102,241,0.22)" : "none",
              }}>
                {n < step ? "✓" : n}
              </div>
              <span style={{ fontSize: 10, marginTop: 4, fontWeight: 600, color: n === step ? ACCENT : C.muted }}>{l}</span>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════
            STEP 1 — PHONE SELECTION
        ════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ maxWidth: 580, margin: "0 auto" }}>
            <div style={CARD}>
              <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 20, margin: "0 0 4px" }}>Select Your Phone</h2>
              <p style={{ color: C.muted, fontSize: 13, margin: "0 0 22px" }}>We use exact real-world dimensions for a perfect cut-fit</p>

              {/* Brand grid */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 9 }}>Brand</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px,1fr))", gap: 7 }}>
                  {BRANDS.map(b => {
                    const active = brand === b;
                    const acc = BRAND_ACCENT[b] || "#6366f1";
                    return (
                      <button key={b} onClick={() => { setBrand(b); setModel(""); }}
                        style={{
                          padding: "9px 6px", borderRadius: 11, fontFamily,
                          border: `2px solid ${active ? acc : C.border}`,
                          background: active ? acc : C.subtle,
                          color: active ? "#fff" : C.text,
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                          transition: "all 0.15s", outline: "none",
                          transform: active ? "scale(1.06)" : "scale(1)",
                          boxShadow: active ? `0 4px 14px ${acc}55` : "none",
                          filter: !active && dark ? "brightness(0.85)" : "none",
                        }}>
                        {b === "Google Pixel" ? "Pixel" : b}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model select */}
              {brand && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 8 }}>
                    Model — {brand} ({models.length} options)
                  </div>
                  <select value={model} onChange={e => setModel(e.target.value)} style={{ ...INPUT, appearance: "auto" }}>
                    <option value="">Choose {brand} model...</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              {/* Phone spec chip */}
              {phone && (
                <div style={{
                  borderRadius: 14, padding: "14px 16px", marginBottom: 22,
                  background: dark ? "#1e1e2e" : "rgba(99,102,241,0.05)",
                  border: `1px solid ${dark ? "#2d2d42" : "rgba(99,102,241,0.15)"}`,
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{
                    width: 38, flexShrink: 0, aspectRatio: "9/19",
                    borderRadius: 8, border: `2px solid ${ACCENT}`,
                    background: dark ? "#2d2d42" : "#e8e8ff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>📱</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{phone.brand} {phone.model}</div>
                    <div style={{ color: C.sub, fontSize: 12, marginTop: 3 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{phone.dims.w} × {phone.dims.h} mm</span>
                      <span style={{ color: C.muted, marginLeft: 8 }}>t: {phone.dims.t}mm</span>
                    </div>
                    <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, padding: "2px 9px", borderRadius: 20, background: dark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.1)", color: "#22c55e", fontWeight: 600 }}>
                      ✓ Verified Dimensions
                    </span>
                  </div>
                </div>
              )}

              <button disabled={!phone} onClick={() => setStep(2)}
                style={{ ...BTN_PRI, width: "100%", opacity: phone ? 1 : 0.35, cursor: phone ? "pointer" : "not-allowed", fontSize: 15 }}>
                Continue to Layout →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP 2 — SHEET CONFIGURATION
        ════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <div style={CARD}>
              <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 20, margin: "0 0 4px" }}>Configure Layout</h2>
              <p style={{ color: C.muted, fontSize: 13, margin: "0 0 24px" }}>Choose how many A4 sheets and how many photos per sheet</p>

              {/* Sheet count */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 9 }}>Number of A4 Sheets</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[1, 2, 3].map(n => (
                    <button key={n} onClick={() => setSheetCount(n)} style={{
                      flex: 1, padding: "15px 0", borderRadius: 13, fontFamily: headingFont,
                      border: `2px solid ${sheetCount === n ? ACCENT : C.border}`,
                      background: sheetCount === n ? (dark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.06)") : C.subtle,
                      color: sheetCount === n ? ACCENT : C.text,
                      fontWeight: 800, fontSize: 24, cursor: "pointer", transition: "all 0.15s",
                    }}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Photos per sheet */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 9 }}>Photos Per Sheet</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[1, 2, 3, 4].map(n => {
                    const sl = phone
                      ? computeLayout(phone.dims, n, bleed)
                      : Array.from({ length: n }, (_, i) => ({ x: 10 + (i % 2) * 100, y: 30 + Math.floor(i / 2) * 140, w: 90, h: 130, bleed: 3, pw: 84, ph: 124 }));
                    return (
                      <button key={n} onClick={() => setPerSheet(n)} style={{
                        padding: 12, borderRadius: 14, cursor: "pointer", textAlign: "left",
                        border: `2px solid ${perSheet === n ? ACCENT : C.border}`,
                        background: perSheet === n ? (dark ? "rgba(99,102,241,0.11)" : "rgba(99,102,241,0.04)") : C.subtle,
                        transition: "all 0.15s",
                      }}>
                        <MiniA4Preview layout={sl} active={perSheet === n} dark={dark} />
                        <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, marginTop: 7, color: perSheet === n ? ACCENT : C.text }}>{n} Photo{n > 1 ? "s" : ""}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{["", "Centered, full bleed", "Side by side / stacked", "2+1 centred", "2×2 grid"][n]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bleed */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted }}>Bleed Area</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: ACCENT, fontSize: 12 }}>{bleed} mm</span>
                </div>
                <input type="range" min={0} max={5} step={0.5} value={bleed} onChange={e => setBleed(+e.target.value)}
                  style={{ width: "100%", accentColor: ACCENT }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 2 }}>
                  <span>0 mm — no bleed</span><span>5 mm — max</span>
                </div>
              </div>

              {/* Summary */}
              {phone && (
                <div style={{ borderRadius: 12, padding: "12px 14px", background: C.subtle, marginBottom: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: 12, color: C.sub }}>
                  <div>📄 <b>{sheetCount}</b> sheet{sheetCount > 1 ? "s" : ""}</div>
                  <div>🖼️ <b>{sheetCount * perSheet}</b> total photos</div>
                  <div>📐 Slot: <b style={{ fontFamily: "monospace" }}>{(phone.dims.w + bleed * 2).toFixed(1)}×{(phone.dims.h + bleed * 2).toFixed(1)}mm</b></div>
                  <div>✂️ Cut: <b style={{ fontFamily: "monospace" }}>{phone.dims.w}×{phone.dims.h}mm</b></div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep(1)} style={BTN_GHOST}>← Back</button>
                <button onClick={() => { setStep(3); setActiveSheet(0); }} style={{ ...BTN_PRI, flex: 1 }}>Upload Photos →</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP 3 — PHOTO UPLOAD
        ════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {sheetCount > 1 && (
              <div style={{ display: "flex", gap: 7, marginBottom: 13 }}>
                {Array.from({ length: sheetCount }, (_, i) => (
                  <button key={i} onClick={() => setActiveSheet(i)} style={{
                    padding: "7px 17px", borderRadius: 10, fontFamily, fontWeight: 600, fontSize: 13, cursor: "pointer",
                    border: `1px solid ${i === activeSheet ? "transparent" : C.border}`,
                    background: i === activeSheet ? "linear-gradient(135deg,#6366f1,#3b82f6)" : C.subtle,
                    color: i === activeSheet ? "#fff" : C.text,
                    transition: "all 0.15s",
                  }}>Sheet {i + 1}</button>
                ))}
              </div>
            )}

            <div style={CARD}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 20, margin: "0 0 2px" }}>Upload Photos</h2>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Sheet {activeSheet + 1} of {sheetCount} · {perSheet} slot{perSheet > 1 ? "s" : ""}</p>
                </div>
                <span style={{ fontSize: 11, padding: "4px 11px", borderRadius: 20, fontWeight: 600, background: photoCount === perSheet ? (dark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.1)") : C.subtle, color: photoCount === perSheet ? "#22c55e" : C.muted }}>
                  {photoCount}/{perSheet} uploaded
                </span>
              </div>

              {/* Upload slots grid */}
              <div style={{ display: "grid", gridTemplateColumns: perSheet === 1 ? "1fr" : "1fr 1fr", gap: 12, maxWidth: perSheet === 1 ? 220 : "100%", margin: "0 auto" }}>
                {Array.from({ length: perSheet }, (_, i) => {
                  const key = `${activeSheet}-${i}`;
                  const photo = photos[key];
                  const slot = layout[i];
                  const ar = slot ? slot.w / slot.h : 0.47;
                  const isOver = dragOver === key;

                  return (
                    <div key={i}>
                      <div
                        style={{
                          position: "relative", borderRadius: 14, overflow: "hidden",
                          aspectRatio: String(ar), cursor: photo ? "default" : "pointer",
                          border: `2px dashed ${isOver ? ACCENT : photo ? C.border : (dark ? "#2d2d42" : "#ddd")}`,
                          background: isOver ? (dark ? "rgba(99,102,241,0.09)" : "rgba(99,102,241,0.04)") : C.subtle,
                          transition: "border-color 0.2s, background 0.2s",
                        }}
                        onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={e => { e.preventDefault(); setDragOver(null); handleFile(e.dataTransfer.files[0], key); }}
                        onClick={() => { if (!photo) { pendingSlot.current = key; fileRef.current?.click(); } }}
                      >
                        {photo ? (
                          <>
                            <img src={photo.dataURL} alt="" style={{
                              width: "100%", height: "100%", objectFit: "cover", display: "block",
                              filter: `brightness(${photo.brightness}%) contrast(${photo.contrast}%) saturate(${photo.saturation}%)`,
                            }} />
                            {/* Hover overlay */}
                            <div className="photo-overlay" style={{
                              position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              gap: 8, opacity: 0, transition: "opacity 0.2s",
                            }}
                              onMouseEnter={e => e.currentTarget.style.opacity = 1}
                              onMouseLeave={e => e.currentTarget.style.opacity = 0}
                            >
                              <button onClick={e => { e.stopPropagation(); setEditing({ key, ...photo }); }}
                                style={{ padding: "7px 13px", borderRadius: 8, border: "none", background: "#fff", color: "#111", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily }}>
                                ✏️ Edit
                              </button>
                              <button onClick={e => { e.stopPropagation(); setPhotos(p => { const n = { ...p }; delete n[key]; return n; }); }}
                                style={{ padding: "7px 13px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily }}>
                                🗑️
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", border: `2px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.muted, marginBottom: 4 }}>+</div>
                            <div style={{ fontWeight: 600, fontSize: 12, color: C.sub }}>Photo {i + 1}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>Click or drag & drop</div>
                            {slot && <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{slot.w.toFixed(1)}×{slot.h.toFixed(1)} mm slot</div>}
                          </div>
                        )}
                      </div>

                      {photo && (
                        <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                          <button onClick={() => setEditing({ key, ...photo })} style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily }}>✏️ Edit</button>
                          <button onClick={() => { pendingSlot.current = key; fileRef.current?.click(); }} style={{ flex: 1, padding: "7px 0", borderRadius: 9, border: `1px solid ${C.border}`, background: "transparent", color: C.sub, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily }}>↺ Replace</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: C.subtle, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                💡 <b>Tip:</b> Use high-resolution photos (3000px+ recommended) for crisp 300 DPI print quality. Supports JPG, PNG, HEIC, WebP.
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={() => setStep(2)} style={BTN_GHOST}>← Back</button>
                <button onClick={() => setStep(4)} style={{ ...BTN_PRI, flex: 1 }}>Preview & Export →</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP 4 — PREVIEW & EXPORT
        ════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 290px", gap: 20, alignItems: "start" }}>

              {/* ── A4 Canvas preview ─────────────────────────── */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <h2 style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 18, margin: 0 }}>A4 Preview</h2>
                  {sheetCount > 1 && (
                    <div style={{ display: "flex", gap: 4 }}>
                      {Array.from({ length: sheetCount }, (_, i) => (
                        <button key={i} onClick={() => setActiveSheet(i)} style={{
                          padding: "5px 13px", borderRadius: 8, border: "none", fontFamily, fontWeight: 600, fontSize: 12, cursor: "pointer",
                          background: i === activeSheet ? "linear-gradient(135deg,#6366f1,#3b82f6)" : C.subtle,
                          color: i === activeSheet ? "#fff" : C.text,
                        }}>S{i + 1}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ borderRadius: 18, overflow: "hidden", boxShadow: dark ? "0 24px 72px rgba(0,0,0,0.65)" : "0 20px 60px rgba(0,0,0,0.14)", border: `1px solid ${C.border}` }}>
                  <canvas ref={canvasRef} width={794} height={1123} style={{ width: "100%", display: "block" }} />
                </div>
                <p style={{ textAlign: "center", fontSize: 10, color: C.muted, marginTop: 9 }}>
                  210 × 297 mm (A4) · Set printer to <b>100% scale</b> — do not "fit to page"
                </p>
              </div>

              {/* ── Sidebar ───────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* Print options */}
                <div style={{ ...CARD, padding: 16 }}>
                  <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Print Options</div>

                  {/* Bleed toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, cursor: "pointer" }} onClick={() => setShowBleed(v => !v)}>
                    <div style={{ width: 40, height: 22, borderRadius: 11, background: showBleed ? ACCENT : C.subtle2, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: showBleed ? 21 : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>Show Bleed Guide</div>
                      <div style={{ fontSize: 10, color: C.muted }}>Inner blue dashed line</div>
                    </div>
                  </div>

                  {/* BG color */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, marginBottom: 7 }}>Slot Background</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                      {["#f8f8f8", "#ffffff", "#111111", "#fde8e8", "#e8f0ff", "#e8f8e8", "#fff8e0"].map(c => (
                        <button key={c} onClick={() => setBgColor(c)} style={{
                          width: 26, height: 26, borderRadius: 7, border: `2px solid ${bgColor === c ? ACCENT : "transparent"}`,
                          background: c, cursor: "pointer",
                          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.1)`,
                          transform: bgColor === c ? "scale(1.18)" : "scale(1)", transition: "all 0.12s",
                        }} />
                      ))}
                      <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                        style={{ width: 26, height: 26, borderRadius: 7, border: "none", padding: 0, cursor: "pointer", background: "none" }} title="Custom colour" />
                    </div>
                  </div>

                  {/* Cut-guide legend */}
                  {phone?.dims?.cam && (
                    <div style={{ marginTop: 12, borderRadius: 9, padding: "9px 11px", background: C.subtle, fontSize: 11, lineHeight: 2 }}>
                      <div style={{ fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, marginBottom: 3 }}>Cut Guide Legend</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 13, height: 13, borderRadius: 3, border: "2px dashed rgba(220,38,38,0.9)", background: "rgba(239,68,68,0.1)", flexShrink: 0 }} />
                        <span style={{ color: C.sub }}>Red = Camera module cutout</span>
                      </div>
                      {phone?.dims?.fp?.type === "rear" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 13, height: 13, borderRadius: "50%", border: "2px dashed rgba(5,150,105,0.9)", background: "rgba(16,185,129,0.1)", flexShrink: 0 }} />
                          <span style={{ color: C.sub }}>Green = Fingerprint cutout</span>
                        </div>
                      )}
                      <div style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>
                        {phone?.dims?.fp?.type === "udp" && "ℹ️ Under-display FP — no back cutout"}
                        {phone?.dims?.fp?.type === "side" && "ℹ️ Side FP button — no back cutout"}
                        {phone?.dims?.fp?.type === "none" && "ℹ️ Face ID — no fingerprint cutout"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone info */}
                <div style={{ ...CARD, padding: 14 }}>
                  <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Phone Dimensions</div>
                  {phone && (
                    <div style={{ fontSize: 12, color: C.sub }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3 }}>{phone.brand} {phone.model}</div>
                      <div style={{ fontFamily: "monospace", fontSize: 11 }}>{phone.dims.w} × {phone.dims.h} × {phone.dims.t} mm</div>
                      <div style={{ borderRadius: 9, padding: "9px 11px", background: C.subtle, marginTop: 8, fontSize: 11, lineHeight: 1.8 }}>
                        <div>Slot size: <b style={{ fontFamily: "monospace" }}>{(phone.dims.w + bleed * 2).toFixed(1)} × {(phone.dims.h + bleed * 2).toFixed(1)} mm</b></div>
                        <div>Bleed: <b>{bleed} mm</b> per side</div>
                        <div>Sheets: <b>{sheetCount}</b> × <b>{perSheet}</b> photos</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Export */}
                <div style={{ ...CARD, padding: 14 }}>
                  <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Export</div>
                  <button onClick={generatePDF} disabled={pdfLoading} style={{
                    ...BTN_PRI, width: "100%", fontSize: 14,
                    background: pdfDone
                      ? "linear-gradient(135deg,#22c55e,#16a34a)"
                      : pdfLoading
                      ? "#9ca3af"
                      : "linear-gradient(135deg,#6366f1,#3b82f6)",
                    cursor: pdfLoading ? "wait" : "pointer",
                    marginBottom: 6,
                  }}>
                    {pdfDone ? "✓ PDF Downloaded!" : pdfLoading ? "⏳ Generating 300 DPI PDF..." : "⬇️ Download PDF"}
                  </button>
                  <p style={{ textAlign: "center", fontSize: 10, color: C.muted, margin: "0 0 10px" }}>A4 · 300 DPI · {sheetCount} page{sheetCount > 1 ? "s" : ""} · JPEG compression 95%</p>
                  <button onClick={handlePrint} style={{ ...BTN_GHOST, width: "100%", textAlign: "center", display: "block" }}>🖨️ Print Directly</button>
                </div>

                <button onClick={() => setStep(3)} style={{ ...BTN_GHOST, textAlign: "center" }}>← Back to Photos</button>

                {/* Tips */}
                <div style={{ borderRadius: 12, padding: "12px 14px", background: C.subtle, fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                  <b style={{ color: C.sub }}>Print tips</b><br />
                  • Set printer to 100% scale / actual size<br />
                  • Use glossy photo paper for best results<br />
                  • Cut along the outer dashed line<br />
                  • Blue inner line = safe zone (no bleed)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ HIDDEN FILE INPUT ══════════════ */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f && pendingSlot.current) { handleFile(f, pendingSlot.current); pendingSlot.current = null; }
          e.target.value = "";
        }} />

      {/* ══════════════ IMAGE EDITOR MODAL ══════════════ */}
      {editing && (
        <ImageEditor
          editing={editing}
          dark={dark}
          onSave={updates => {
            setPhotos(p => ({ ...p, [editing.key]: { ...p[editing.key], ...updates } }));
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
