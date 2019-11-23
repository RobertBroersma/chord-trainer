import React, { useState, useEffect, useCallback, Suspense } from 'react'
import WebMidi from 'webmidi'

import { Global } from '@emotion/core'
import { ThemeProvider } from 'theme-ui'
import {
  Box,
  Flex,
  Button,
  Text,
  Select,
  Label,
  Spinner,
} from '@theme-ui/components'

import { chord } from '@tonaljs/chord'
import { simplify, enharmonic } from '@tonaljs/note'
import { Machine, assign } from 'xstate'
import { useMachine } from '@xstate/react'
import theme from '../theme'
import { useMedia } from '../hooks/useMedia'

const Piano = React.lazy(() => import('../components/Piano'))
const chordNames = ['major', 'minor']
const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const chords = notes.reduce(
  (cum, note) => cum.concat(...chordNames.map(name => chord(`${note}${name}`))),
  [],
)

const isChord = chord => notes =>
  chord.notes.every(
    note => notes.includes(simplify(note)) || notes.includes(enharmonic(note)),
  ) && chord.notes.length === notes.length

const machine = Machine(
  {
    id: 'root',
    initial: 'config',
    context: {
      currentChord: null,
      playedChords: [],
      startTime: 0,
    },
    states: {
      config: {
        entry: 'resetPlayedChords',
        on: {
          PRESS_START: 'starting',
        },
      },
      starting: {
        initial: 'three',
        states: {
          three: {
            after: {
              500: 'two',
            },
          },
          two: {
            after: {
              500: 'one',
            },
          },
          one: {
            after: {
              500: '#root.playing',
            },
          },
        },
      },
      playing: {
        entry: 'setStartTime',
        initial: 'idle',
        states: {
          idle: {
            entry: ['nextChord', 'resetPiano'],
            on: {
              PLAY_NOTES: [
                {
                  target: 'correct',
                  cond: 'isChord',
                  actions: assign({
                    playedChords: ctx => [
                      ...ctx.playedChords,
                      ctx.currentChord,
                    ],
                  }),
                },
                {
                  target: '',
                },
              ],
            },
          },
          correct: {
            after: {
              500: [
                {
                  target: 'idle',
                  cond: 'isNotFinished',
                },
                {
                  target: '#root.finished',
                },
              ],
            },
          },
        },
      },
      finished: {
        on: {
          REPLAY: 'config',
        },
      },
    },
  },
  {
    guards: {
      isChord: (ctx, e) => isChord(ctx.currentChord)(e.playingNotes),
      isNotFinished: ctx => {
        const chordsLeft = chords.filter(
          chord => !ctx.playedChords.includes(chord),
        )

        return chordsLeft.length > 0
      },
    },
    actions: {
      setStartTime: assign({
        startTime: () => new Date().getTime(),
      }),
      resetPlayedChords: assign({
        playedChords: () => [],
      }),
      nextChord: assign({
        currentChord: ctx => {
          const chordsLeft = chords.filter(
            chord => !ctx.playedChords.includes(chord),
          )

          return chordsLeft[Math.floor(Math.random() * chordsLeft.length)]
        },
      }),
    },
  },
)

const Timer = ({ startTime, run }) => {
  const [currentTime, setCurrentTime] = useState(new Date().getTime())

  useEffect(() => {
    if (run) {
      const interval = setInterval(
        () => setCurrentTime(new Date().getTime()),
        10,
      )
      return () => clearInterval(interval)
    }
  }, [run])

  return <div>{((currentTime - startTime) / 1000).toFixed(2)}s</div>
}

const Index = () => {
  const [state, send] = useMachine(machine)
  const [inputs, setInputs] = useState([])
  const [selectedInputIndex, setSelectedInputIndex] = useState('none')
  const [, setPlayingNotes] = useState([])

  const endNote = useMedia(
    ['(min-width: 1200px)', '(min-width: 840px)', '(min-width: 840px)'],
    ['B5', 'B4', 'B4'],
    'B3',
  )

  useEffect(() => {
    WebMidi.enable(function(err) {
      if (err) {
        console.log('WebMidi could not be enabled')
      }

      setInputs(WebMidi.inputs)
    })
  }, [])

  const setInput = useCallback(e => {
    setSelectedInputIndex(e.target.value)
  }, [])

  useEffect(() => {
    state.actions.forEach(action => {
      if (action.type === 'resetPiano') {
        setPlayingNotes([])
      }
    })
  }, [state])

  const addNote = note => {
    setPlayingNotes(current => {
      const newPlayingNotes = [...current, note]
      send('PLAY_NOTES', { playingNotes: newPlayingNotes })

      return newPlayingNotes
    })
  }

  const removeNote = note => {
    setPlayingNotes(current => {
      const newPlayingNotes = current.filter(n => n !== note)
      send('PLAY_NOTES', { playingNotes: newPlayingNotes })

      return newPlayingNotes
    })
  }

  return (
    <ThemeProvider theme={theme}>
      <Global
        styles={theme => ({
          html: {
            height: '100%',
          },
          body: {
            margin: 0,
            height: '100%',
            fontFamily: theme.fonts.body,
            color: theme.colors.white,
          },
          'body > div, body > div > div': {
            height: '100%',
          },
        })}
      />
      <Flex
        bg={state.matches('playing.correct') ? 'success' : 'black'}
        p={[3, 4]}
        sx={{
          height: '100%',
          flexDirection: 'column',
          transition: '.2s ease background',
        }}
      >
        {state.matches('playing') && (
          <Box
            sx={{
              position: 'absolute',
              right: 4,
              fontSize: 4,
              fontWeight: 'bold',
            }}
          >
            <Timer
              startTime={state.context.startTime}
              run={state.matches('playing')}
            />
          </Box>
        )}
        <Flex
          sx={{
            flex: '1 0 50%',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Flex sx={{ alignItems: 'center', flexDirection: 'column' }}>
            {state.matches('config') && (
              <>
                <Text
                  sx={{ fontSize: 6, fontWeight: 'bold', textAlign: 'center' }}
                >
                  CHORD TRAINER
                </Text>
                {inputs.length > 0 ? (
                  <Label
                    sx={{
                      marginTop: 4,
                      display: ['none', 'flex'],
                      flexDirection: 'column',
                      maxWidth: 400,
                    }}
                  >
                    Use MIDI Input
                    <Select onChange={setInput} value={selectedInputIndex}>
                      <option style={{ color: 'black' }} value="none">
                        None
                      </option>
                      {inputs.map((input, index) => (
                        <option
                          style={{ color: 'black' }}
                          key={index}
                          value={index}
                        >
                          {input.name}
                        </option>
                      ))}
                    </Select>
                  </Label>
                ) : (
                  <Text
                    sx={{
                      display: ['none', 'flex'],
                      marginTop: 4,
                      fontSize: 5,
                    }}
                  >
                    Connect a MIDI Keyboard and refresh the page!
                  </Text>
                )}
                <Button
                  sx={{
                    marginTop: 4,
                    transition: '.2s ease all',
                    outline: 'none',
                    '&:hover, &:focus': {
                      backgroundColor: 'success',
                      color: 'white',
                    },
                  }}
                  variant="secondary"
                  onClick={() => send('PRESS_START')}
                >
                  Start
                </Button>
              </>
            )}

            {state.matches('starting.three') && (
              <Text sx={{ fontSize: 100, fontWeight: 'bold' }}>3</Text>
            )}
            {state.matches('starting.two') && (
              <Text sx={{ fontSize: 100, fontWeight: 'bold' }}>2</Text>
            )}
            {state.matches('starting.one') && (
              <Text sx={{ fontSize: 100, fontWeight: 'bold' }}>1</Text>
            )}
            {state.matches('playing') && (
              <>
                <Text sx={{ fontSize: [80, 120], fontWeight: 'bold' }}>
                  {state.context.currentChord.name
                    .replace(/\s+minor/, 'm')
                    .replace(/\s+major/, '')}
                </Text>
              </>
            )}

            {state.matches('finished') && (
              <>
                <Text sx={{ fontSize: [5, 8], fontWeight: 'bold' }}>
                  FINISHED!
                </Text>
                <Text sx={{ fontSize: [6, 8], fontWeight: 'bold' }}>
                  <Timer startTime={state.context.startTime} />
                </Text>
                <Button
                  sx={{
                    marginTop: 4,
                    transition: '.2s ease all',
                    outline: 'none',
                    '&:hover, &:focus': {
                      backgroundColor: 'success',
                      color: 'white',
                    },
                  }}
                  variant="secondary"
                  onClick={() => send('REPLAY')}
                >
                  Replay
                </Button>
              </>
            )}
          </Flex>
        </Flex>
        <Flex
          sx={{
            flex: '1 0 50%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {typeof window !== 'undefined' && (
            <Suspense fallback={<Spinner />}>
              <Piano
                startNote="C3"
                progress={state.context.playedChords.length / chords.length}
                endNote={endNote}
                input={inputs[selectedInputIndex] || null}
                state={state}
                currentChord={state.context.currentChord || { notes }}
                onPlayNote={addNote}
                onStopNote={removeNote}
              />
            </Suspense>
          )}
        </Flex>
      </Flex>
    </ThemeProvider>
  )
}

export default Index
