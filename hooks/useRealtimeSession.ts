'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { ORDER_TOOLS, VOICE_INSTRUCTIONS } from '@/lib/realtime-config'
import { applyToolCall } from '@/lib/cart-utils'
import type { CartItem } from '@/lib/supabase'

const voiceModel = process.env.NEXT_PUBLIC_OPENAI_REALTIME_MODEL || 'gpt-realtime'

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

interface UseRealtimeSessionOptions {
  onCartUpdate?: (updater: (prev: CartItem[]) => CartItem[]) => void
  onFinalize?: (customerName: string) => Promise<void>
}

export function useRealtimeSession(options: UseRealtimeSessionOptions = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [micDenied, setMicDenied] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cartRef = useRef<CartItem[]>([])

  // Track intentional disconnect to distinguish from unexpected drops
  const intentionalDisconnectRef = useRef(false)
  // Track whether we've already attempted an auto-reconnect
  const reconnectAttemptedRef = useRef(false)

  // Keep options in a ref so the data channel handler always has the latest
  const optionsRef = useRef(options)
  optionsRef.current = options

  // Internal cleanup (no state changes — used by both disconnect and reconnect)
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (dcRef.current) {
      dcRef.current.close()
      dcRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null
      audioRef.current = null
    }
    cartRef.current = []
  }, [])

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true
    cleanup()
    setConnectionState('idle')
    setIsSpeaking(false)
    setIsUserSpeaking(false)
    setError(null)
    setMicDenied(false)
  }, [cleanup])

  // Send event over the data channel
  const sendEvent = useCallback((event: Record<string, unknown>) => {
    if (dcRef.current?.readyState === 'open') {
      dcRef.current.send(JSON.stringify(event))
    }
  }, [])

  // Configure session after data channel opens — uses inline instructions
  // because the stored prompt is tied to gpt-5.2 (text model) which is
  // incompatible with realtime audio models
  const sendSessionUpdate = useCallback(
    () => {
      const payload = {
        type: 'session.update',
        session: {
          type: 'realtime',
          model: voiceModel,
          instructions: VOICE_INSTRUCTIONS,
          audio: {
            input: {
              turn_detection: { type: 'semantic_vad' },
            },
          },
          tools: ORDER_TOOLS as unknown as Record<string, unknown>[],
        },
      }
      sendEvent(payload)
    },
    [sendEvent]
  )

  // Trigger the AI's greeting after session is configured
  const triggerGreeting = useCallback(() => {
    const greetingEvent = {
      type: 'response.create',
      response: {
        instructions:
          'Greet briefly and ask what they would like to order. Do not call tools until the customer provides an order.',
      },
    }
    sendEvent(greetingEvent)
  }, [sendEvent])

  // Handle tool calls — parse arguments, update cart, notify parent.
  // For finalize_order: awaits the parent callback and sends real success/failure to the AI.
  const handleToolCall = useCallback(
    async (event: any) => {
      const { call_id, name, arguments: argsStr } = event
      console.log(`[Realtime] Tool call: ${name}`, argsStr)

      // Parse arguments from JSON string
      let args: Record<string, any> = {}
      try {
        args = JSON.parse(argsStr || '{}')
      } catch {
        args = {}
      }

      // Apply cart mutation using shared utility
      const result = applyToolCall(cartRef.current, name, args)
      cartRef.current = result.cart

      // Notify parent to update UI
      optionsRef.current.onCartUpdate?.(() => result.cart)

      // For finalize_order: await the parent callback and send real result to AI
      if (result.finalize) {
        // Guard: reject empty cart finalization
        if (cartRef.current.length === 0) {
          sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id,
              output: JSON.stringify({ success: false, error: 'Cart is empty — nothing to finalize.' }),
            },
          })
          sendEvent({ type: 'response.create' })
          return
        }

        try {
          await optionsRef.current.onFinalize?.(result.finalize.customer_name)
          // Order saved successfully
          sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id,
              output: JSON.stringify({ success: true, order_confirmed: true, cart: result.cart }),
            },
          })
        } catch (err) {
          // Order submission failed — tell the AI so it can inform the customer
          const errorMsg = err instanceof Error ? err.message : 'Failed to place order'
          console.error('[Realtime] Finalize error:', err)
          sendEvent({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id,
              output: JSON.stringify({ success: false, error: errorMsg }),
            },
          })
        }
        sendEvent({ type: 'response.create' })
        return
      }

      // Non-finalize tool calls: send success and brief follow-up
      sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify({ success: true, cart: result.cart }),
        },
      })

      // Trigger the AI's next response — keep non-finalize turns brief
      sendEvent({
        type: 'response.create',
        response: {
          instructions:
            'Reply with exactly: "Anything else?" Do not repeat, summarize, or mention any item names.',
        },
      })
    },
    [sendEvent]
  )

  // Handle all server-sent events from the data channel
  const handleServerEvent = useCallback(
    (event: any) => {
      switch (event.type) {
        case 'session.created':
          console.log('[Realtime] Session created')
          break

        case 'session.updated':
          console.log('[Realtime] Session configured — triggering greeting')
          triggerGreeting()
          break

        case 'input_audio_buffer.speech_started':
          setIsUserSpeaking(true)
          break

        case 'input_audio_buffer.speech_stopped':
          setIsUserSpeaking(false)
          break

        case 'response.audio.delta':
        case 'response.output_audio.delta':
          setIsSpeaking(true)
          break

        case 'response.output_audio_transcript.done':
          break

        case 'response.done':
          setIsSpeaking(false)
          break

        case 'response.function_call_arguments.done':
          // handleToolCall is async for finalize_order; fire-and-forget here since
          // it manages its own error handling and AI communication
          handleToolCall(event)
          break

        case 'conversation.item.input_audio_transcription.completed':
          break

        case 'error':
          console.error('[Realtime] Server error:', event.error)
          setError(event.error?.message || 'An error occurred')
          break

        default:
          if (
            event.type.startsWith('conversation.item') ||
            event.type.startsWith('input_audio_buffer') ||
            event.type.startsWith('response.audio_transcript') ||
            event.type.startsWith('response.output_audio_transcript')
          ) {
            // Known event types — silently ignore
          }
          // Log non-audio events for debugging
          if (!event.type.startsWith('response.audio')) {
            console.log('[Realtime]', event.type)
          }
          break
      }
    },
    [triggerGreeting, handleToolCall]
  )

  const connect = useCallback(async () => {
    try {
      intentionalDisconnectRef.current = false
      reconnectAttemptedRef.current = false
      setConnectionState('connecting')
      setError(null)
      setMicDenied(false)

      // 1. Fetch ephemeral token from our server
      const tokenRes = await fetch('/api/realtime/token', { method: 'POST' })
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to get session token')
      }
      const tokenData = await tokenRes.json()
      const ephemeralKey = tokenData.key
      if (!ephemeralKey) throw new Error('No ephemeral key returned from server')

      // 2. Create peer connection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 3. Set up remote audio playback (AI's voice)
      const audio = document.createElement('audio')
      audio.autoplay = true
      audioRef.current = audio
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0]
      }

      // 4. WebRTC connection monitoring — detect dropped connections
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState
        console.log('[Realtime] ICE connection state:', state)
        if (state === 'disconnected' || state === 'failed') {
          if (intentionalDisconnectRef.current) return

          // Attempt one auto-reconnect
          if (!reconnectAttemptedRef.current) {
            reconnectAttemptedRef.current = true
            console.log('[Realtime] Connection lost — attempting auto-reconnect')
            cleanup()
            // Re-invoke connect (will be called from the outer scope)
            // Use setTimeout to avoid re-entrancy issues
            setTimeout(() => {
              setConnectionState('connecting')
              setError(null)
              // The connect function reference is stable, so we call it via a ref
              connectRef.current?.()
            }, 500)
          } else {
            // Auto-reconnect already attempted — show error
            console.error('[Realtime] Connection lost after auto-reconnect attempt')
            cleanup()
            setError('Connection lost. Please tap to reconnect.')
            setConnectionState('error')
            setIsSpeaking(false)
            setIsUserSpeaking(false)
          }
        }
      }

      // 5. Get microphone access
      let ms: MediaStream
      try {
        ms = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (micErr: unknown) {
        const errName = micErr instanceof DOMException ? micErr.name : ''
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setMicDenied(true)
          throw new Error('Microphone access was denied. Please allow microphone access in your browser settings and try again.')
        }
        throw new Error('Could not access microphone. Please check your audio settings.')
      }
      streamRef.current = ms
      pc.addTrack(ms.getTracks()[0])

      // 6. Create data channel for events
      const dc = pc.createDataChannel('oai-events')
      dcRef.current = dc

      dc.addEventListener('open', () => {
        setConnectionState('connected')
        // Configure session with inline instructions + tools
        sendSessionUpdate()
      })

      dc.addEventListener('message', (e) => {
        try {
          handleServerEvent(JSON.parse(e.data))
        } catch (parseErr) {
          console.error('[Realtime] Failed to parse event:', parseErr)
        }
      })

      dc.addEventListener('error', (e) => {
        console.error('[Realtime] Data channel error:', e)
        if (!intentionalDisconnectRef.current) {
          setError('Voice connection error. Please try again.')
        }
      })

      dc.addEventListener('close', () => {
        console.log('[Realtime] Data channel closed')
        if (intentionalDisconnectRef.current) {
          // User clicked "End Session" — silent idle
          setConnectionState('idle')
        } else {
          // Unexpected close — show error
          setError('Connection lost. Please tap to reconnect.')
          setConnectionState('error')
          setIsSpeaking(false)
          setIsUserSpeaking(false)
        }
      })

      // 7. SDP offer/answer with OpenAI Realtime API
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      })

      if (!sdpRes.ok) {
        const sdpErr = await sdpRes.text()
        console.error('[Realtime] SDP error:', sdpRes.status, sdpErr)
        throw new Error('Failed to establish voice connection')
      }

      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpRes.text(),
      }
      await pc.setRemoteDescription(answer)

      // Connection is now being established — data channel 'open' event will fire next
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect'
      console.error('[Realtime] Connection error:', err)
      setError(errorMessage)
      setConnectionState('error')
      cleanup()
    }
  }, [cleanup, sendSessionUpdate, triggerGreeting, handleServerEvent])

  // Ref to connect function for auto-reconnect from ICE state change handler
  const connectRef = useRef(connect)
  connectRef.current = connect

  // Clean up on unmount
  useEffect(() => {
    return () => {
      intentionalDisconnectRef.current = true
      cleanup()
    }
  }, [cleanup])

  return {
    connect,
    disconnect,
    connectionState,
    isSpeaking,
    isUserSpeaking,
    error,
    micDenied,
    isConnected: connectionState === 'connected',
  }
}
