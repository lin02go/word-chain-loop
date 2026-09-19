import { handleError, json, requireDatabase } from '../../_lib/auth.js';
import {
  anonymousPlayerCookie, beijingDay, challengeNumber, dailyChallengePayload,
  dailyStatistics, nextBeijingReset,
} from '../../_lib/daily-challenge.js';

export async function onRequestGet(context) {
  try {
    const db = requireDatabase(context.env);
    const date = beijingDay();
    return json({
      challenge: dailyChallengePayload(date),
      challengeDate: date,
      challengeNumber: challengeNumber(date),
      timezone: 'Asia/Shanghai',
      resetAt: nextBeijingReset(),
      statistics: await dailyStatistics(db, date),
    }, 200, anonymousPlayerCookie(context.request));
  } catch (error) {
    return handleError(error);
  }
}
