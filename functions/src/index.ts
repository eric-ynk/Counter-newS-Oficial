/**
 * Cloud Function agendada: puxa as partidas ao vivo do HLTV via scraping
 * e grava/atualiza no Firestore, na collection "partidas_ao_vivo".
 *
 * Deploy: firebase deploy --only functions:scrapeLiveMatches
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import axios from "axios";
import * as cheerio from "cheerio";

initializeApp();
const db = getFirestore();

const HLTV_LIVE_URL = "https://www.hltv.org/matches";

// HLTV bloqueia requests sem um User-Agent "de navegador real".
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

interface PartidaAoVivo {
  id: string;
  timeA: string;
  timeB: string;
  placarA: string;
  placarB: string;
  mapa: string | null;
  evento: string | null;
  atualizadoEm: string;
}

/**
 * Faz o scraping da página de partidas e retorna só as que estão ao vivo.
 * OBS: HLTV pode mudar a estrutura do HTML a qualquer momento — se parar
 * de funcionar, o primeiro passo é inspecionar o HTML atual e ajustar
 * os seletores abaixo.
 */
async function fetchLiveMatches(): Promise<PartidaAoVivo[]> {
  const { data: html } = await axios.get<string>(HLTV_LIVE_URL, {
    headers: HEADERS,
    timeout: 10000,
  });

  const $ = cheerio.load(html);
  const matches: PartidaAoVivo[] = [];

  // Seletor de exemplo — ajuste depois de inspecionar o HTML real do HLTV.
  $(".liveMatch-container").each((_, el) => {
    const matchId = $(el).attr("data-livescore-match") || $(el).attr("id");
    const teams = $(el)
      .find(".matchTeamName")
      .map((_, t) => $(t).text().trim())
      .get();
    const scores = $(el)
      .find(".matchTeamScore")
      .map((_, s) => $(s).text().trim())
      .get();
    const mapName = $(el).find(".matchMap").text().trim();
    const eventName = $(el).find(".matchEventName").text().trim();

    if (matchId && teams.length === 2) {
      matches.push({
        id: matchId,
        timeA: teams[0],
        timeB: teams[1],
        placarA: scores[0] || "0",
        placarB: scores[1] || "0",
        mapa: mapName || null,
        evento: eventName || null,
        atualizadoEm: new Date().toISOString(),
      });
    }
  });

  return matches;
}

/**
 * Sincroniza o resultado do scraping com o Firestore:
 * - grava/atualiza cada partida ao vivo encontrada
 * - remove do Firestore as que não estão mais ao vivo
 */
async function syncFirestore(matches: PartidaAoVivo[]): Promise<void> {
  const colRef = db.collection("partidas_ao_vivo");
  const existentesSnap = await colRef.get();
  const idsAtuais = new Set(matches.map((m) => m.id));

  const batch = db.batch();

  // Remove partidas que já saíram do ar
  existentesSnap.forEach((doc) => {
    if (!idsAtuais.has(doc.id)) {
      batch.delete(doc.ref);
    }
  });

  // Grava/atualiza as partidas ao vivo atuais
  matches.forEach((match) => {
    batch.set(colRef.doc(match.id), match, { merge: true });
  });

  await batch.commit();
}

export const scrapeLiveMatches = onSchedule(
  {
    schedule: "every 1 minutes",
    timeoutSeconds: 60,
    memory: "256MiB",
    region: "southamerica-east1",
  },
  async () => {
    try {
      const matches = await fetchLiveMatches();
      await syncFirestore(matches);
      console.log(`Sincronizado: ${matches.length} partida(s) ao vivo.`);
    } catch (err) {
      console.error("Erro ao fazer scraping do HLTV:", (err as Error).message);
      // Não lança o erro pra não marcar a execução agendada como falha
      // repetidamente — apenas loga pra você acompanhar no Firebase Console.
    }
  }
);