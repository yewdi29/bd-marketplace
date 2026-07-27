import Mux from '@mux/mux-node'

export function getMuxClient() {
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
    webhookSecret: process.env.MUX_WEBHOOK_SECRET,
  })
}
