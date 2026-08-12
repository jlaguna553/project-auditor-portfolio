# Project Auditor — Auditoría de proyectos de software

![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)

> **Audita cualquier proyecto: detecta tecnologías, patrones, vulnerabilidades y aplica correcciones desde una app de escritorio.**

Project Auditor es una aplicación de escritorio (Electron) que **analiza un proyecto de software y genera un diagnóstico completo**: tecnologías detectadas, patrones de arquitectura, vulnerabilidades y correcciones sugeridas. Con un clic puede aplicar correcciones automatizadas y exportar el reporte.

## ✨ Características

- **Detección de tecnologías** — identifica frameworks, lenguajes y herramientas del proyecto
- **Análisis de patrones** — detecta patrones de arquitectura y código
- **Escaneo de vulnerabilidades** — señala riesgos de seguridad conocidos
- **Corrector automático** — aplica correcciones (`fixer.ts`) directo sobre el código
- **Reporte exportable** — genera un reporte estructurado (`report.ts`)
- **UI moderna** — interfaz React con Tailwind sobre Electron (electron-vite)

## 🛠 Stack

| Capa | Tecnología |
|---|---|
| Shell | Electron (electron-vite) |
| UI | React 19 + Tailwind CSS 4 |
| Lenguaje | TypeScript |
| Proceso principal | `electron/main` + `electron/preload` |

## 🚀 Inicio rápido

```bash
npm install
npm run dev        # lanza la app en modo desarrollo
```

Compilar ejecutable:

```bash
npm run build      # genera el bundle en out/
```

## 📁 Estructura

```
project-auditor/
├── electron/
│   ├── main/             # Proceso principal de Electron
│   └── preload/          # Bridge seguro renderer ↔ main
├── src/
│   ├── App.tsx           # UI principal
│   ├── components/       # Componentes React
│   ├── fixer.ts          # Motor de correcciones automáticas
│   ├── report.ts         # Generación de reportes
│   └── types.ts          # Tipos del dominio
├── electron.vite.config.ts
└── package.json
```

## 🧠 Detalles técnicos

- **Arquitectura segura de Electron**: preload expone solo las APIs necesarias al renderer, el proceso principal hace el trabajo pesado (lectura de archivos, análisis).
- El motor de correcciones (`fixer.ts`) está separado del análisis, así que añadir una nueva regla no toca la UI.

<!-- Agrega capturas en docs/screenshots/ -->

---

## Desarrollado por Francisco Javier Laguna

Full-stack developer · React · Vue · .NET · PHP

[GitHub](https://github.com/jlaguna553) · [LinkedIn](https://www.linkedin.com/in/francisco-javier-laguna-mondrag%C3%B3n-80a798154/) · [CV Online](https://cv-online.jlaguna553.workers.dev/v/xrdcnyej)
