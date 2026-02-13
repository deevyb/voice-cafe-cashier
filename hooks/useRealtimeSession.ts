'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { ORDER_TOOLS, VOICE_INSTRUCTIONS } from '@/lib/realtime-config'
import { applyToolCall } from '@/lib/cart-utils'
import type { CartItem } from '@/lib/supabase'

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

interface UseRealtimeSessionOptions {
  onCartUpdate?: (updater: (prev: CartItem[]) => CartItem[]) => void
  onFinalize?: (customerName: string) => void
}

export function useRealtimeSession(options: UseRealtimeSessionOptions = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cartRef = useRef<CartItem[]>([])

  // Keep options in a ref so the data channel handler always has the latest
  const optionsRef = useRef(options)
  optionsRef.current = options

  const disconnect = useCallback(() => {
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
    setConnectionState('idle')
    setIsSpeaking(false)
    setIsUserSpeaking(false)
    setError(null)
  }, [])

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
          model: 'gpt-realtime-mini',
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
    sendEvent({ type: 'response.create' })
  }, [sendEvent])

  // Handle tool calls — parse arguments, update cart, notify parent
  const handleToolCall = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      const { call_id, name, arguments: argsStr } = event
      console.log(`[Realtime] Tool call: ${name}`, argsStr)

      // Parse arguments from JSON string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // Send function output back to OpenAI (with cart so AI knows state)
      sendEvent({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify({ success: true, cart: result.cart }),
        },
      })

      // Handle finalize — trigger order submission
      if (result.finalize) {
        optionsRef.current.onFinalize?.(result.finalize.customer_name)
      }

      // Trigger the AI's next response
      sendEvent({ type: 'response.create' })
    },
    [sendEvent]
  )

  // Handle all server-sent events from the data channel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleServerEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          handleToolCall(event)
          break

        case 'error':
          console.error('[Realtime] Server error:', event.error)
          setError(event.error?.message || 'An error occurred')
          break

        default:
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
      setConnectionState('connecting')
      setError(null)

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

      // 4. Get microphone access
      let ms: MediaStream
      try {
        ms = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (micErr: unknown) {
        const errName = micErr instanceof DOMException ? micErr.name : ''
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          throw Object.assign(new Error('Microphone access was denied. Please allow microphone access in your browser settings and try again.'), { micDenied: true })
        }
        throw new Error('Could not access microphone. Please check your audio settings.')
      }
      streamRef.current = ms
      pc.addTrack(ms.getTracks()[0])

      // 5. Create data channel for events
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

      dc.addEventListener('close', () => {
        console.log('[Realtime] Data channel closed')
        setConnectionState('idle')
      })

      // 6. SDP offer/answer with OpenAI Realtime API
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
      disconnect()
    }
  }, [disconnect, sendSessionUpdate, triggerGreeting, handleServerEvent])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    disconnect,
    connectionState,
    isSpeaking,
    isUserSpeaking,
    error,
    isConnected: connectionState === 'connected',
  }
}
