import { useEffect, useState } from 'react'
import { TIMEFRAME_TO_MS, type Timeframe } from '@/constants/chart'

/**
 * 次のローソク足確定までの残り時間(ms)を返すフック
 * @param interval - 時間枠
 */
export function useCandleCountdown(interval: Timeframe) {
  const [remaining, setRemaining] = useState(() => calcRemaining(interval))

  useEffect(() => {
    const update = () => setRemaining(calcRemaining(interval))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [interval])

  return remaining
}

function calcRemaining(interval: Timeframe) {
  const dur = TIMEFRAME_TO_MS[interval]
  const now = Date.now()
  const next = Math.ceil(now / dur) * dur
  return next - now
}

export default useCandleCountdown
