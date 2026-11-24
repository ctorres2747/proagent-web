import type { AdminDashboardService } from "@/services/interfaces/adminDashboard";

export const adminDashboardService: AdminDashboardService = {
  async getAdminDashboard({ anio = 2026, mes = 11 }) {
    await new Promise((r) => setTimeout(r, 250));
    const enCurso = anio === 2026 && mes === 11;
    return {
      periodo: {
        anio,
        mes,
        desde: `${anio}-${String(mes).padStart(2, "0")}-01`,
        hasta: enCurso ? `${anio}-11-24` : `${anio}-${String(mes).padStart(2, "0")}-28`,
        enCurso,
        comparadoCon: {
          desde: mes === 1 ? `${anio - 1}-12-01` : `${anio}-${String(mes - 1).padStart(2, "0")}-01`,
          hasta: mes === 1 ? `${anio - 1}-12-24` : `${anio}-${String(mes - 1).padStart(2, "0")}-24`,
        },
      },
      canales: ["whatsapp", "marketplace", "wasi", "instagram"],
      asesores: [
        {
          id: 12,
          nombre: "Carolina Ruiz",
          iniciales: "CR",
          scraper: {
            estado: "ok",
            ultimaCorrida: "2026-11-24T07:00:00-05:00",
            ultimaCorridaOk: "2026-11-24T07:00:00-05:00",
            ultimoError: null,
            corridas: [
              { inicio: "2026-11-01T07:00:00-05:00", estado: "ok", leads: 3 },
              { inicio: "2026-11-10T07:00:00-05:00", estado: "ok", leads: 4 },
              { inicio: "2026-11-24T07:00:00-05:00", estado: "ok", leads: 2 },
            ],
          },
          leads: { recibidos: 70, enContacto: 44, captadas: 8, descartadas: 15 },
          leadsAnt: { recibidos: 66, enContacto: 40, captadas: 6, descartadas: 13 },
          publicacion: {
            whatsapp: { fallos: 0, intentos: 18 },
            marketplace: { fallos: 3, intentos: 20 },
            wasi: { fallos: 1, intentos: 18 },
            instagram: { fallos: 2, intentos: 14 },
          },
          publicacionFallosAnt: { whatsapp: 1, marketplace: 2, wasi: 1, instagram: 1 },
          clientes: { calificando: 14, visitas: 7, negociando: 4, cerrados: 3, cerradosAnt: 2 },
        },
        {
          id: 13,
          nombre: "Andrés Gómez",
          iniciales: "AG",
          scraper: {
            estado: "warn",
            ultimaCorrida: "2026-11-24T07:00:00-05:00",
            ultimaCorridaOk: "2026-11-24T07:00:00-05:00",
            ultimoError: null,
            corridas: [
              { inicio: "2026-11-02T07:00:00-05:00", estado: "error", leads: 0, error: "timeout" },
              { inicio: "2026-11-12T07:00:00-05:00", estado: "error", leads: 0, error: "timeout" },
              { inicio: "2026-11-24T07:00:00-05:00", estado: "ok", leads: 5 },
            ],
          },
          leads: { recibidos: 52, enContacto: 30, captadas: 5, descartadas: 10 },
          leadsAnt: { recibidos: 55, enContacto: 28, captadas: 6, descartadas: 12 },
          publicacion: {
            whatsapp: { fallos: 1, intentos: 12 },
            marketplace: { fallos: 4, intentos: 15 },
            wasi: { fallos: 0, intentos: 12 },
            instagram: { fallos: 2, intentos: 10 },
          },
          publicacionFallosAnt: { whatsapp: 0, marketplace: 1, wasi: 0, instagram: 1 },
          clientes: { calificando: 9, visitas: 4, negociando: 2, cerrados: 2, cerradosAnt: 3 },
        },
        {
          id: 14,
          nombre: "Valentina Mejía",
          iniciales: "VM",
          scraper: {
            estado: "error",
            ultimaCorrida: "2026-11-23T07:00:00-05:00",
            ultimaCorridaOk: "2026-11-20T07:00:00-05:00",
            ultimoError: "Credenciales del portal vencidas desde el 23 nov.",
            corridas: [
              { inicio: "2026-11-01T07:00:00-05:00", estado: "ok", leads: 2 },
              { inicio: "2026-11-22T07:00:00-05:00", estado: "error", leads: 0, error: "Credenciales del portal vencidas desde el 23 nov." },
              { inicio: "2026-11-23T07:00:00-05:00", estado: "error", leads: 0, error: "Credenciales del portal vencidas desde el 23 nov." },
            ],
          },
          leads: { recibidos: 37, enContacto: 20, captadas: 4, descartadas: 8 },
          leadsAnt: { recibidos: 37, enContacto: 18, captadas: 3, descartadas: 9 },
          publicacion: {
            whatsapp: { fallos: 0, intentos: 8 },
            marketplace: { fallos: 5, intentos: 12 },
            wasi: { fallos: 2, intentos: 8 },
            instagram: { fallos: 1, intentos: 7 },
          },
          publicacionFallosAnt: { whatsapp: 0, marketplace: 2, wasi: 1, instagram: 1 },
          clientes: { calificando: 8, visitas: 5, negociando: 3, cerrados: 1, cerradosAnt: 1 },
        },
      ],
    };
  },
};
