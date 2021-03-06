import React, { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import { simplify, enharmonic } from '@tonaljs/note'
import { css } from 'theme-ui'

import PianoComponent from 'react-piano-component'

const PianoContainerStyles = styled.div(({ progress }) =>
  css({
    display: 'inline-flex',
    boxSizing: 'border-box',
    borderColor: 'success',
    position: 'relative',
    margin: 'auto',
    maxWidth: '100%',
    borderTop: '10px solid rgba(0, 0, 0, 0.5)',
    ':before': {
      content: "''",
      transition: '.4s ease all',
      width: `${progress * 100}%`,
      height: '10px',
      backgroundColor: 'success',
      position: 'absolute',
      top: '-10px',
    },
    ':after': {
      content: "''",
      width: '100%',
      height: '5px',
      backgroundColor: 'rgba(68, 68, 68, 0.2)',
      position: 'absolute',
      top: '0',
    },
  }),
)

const AccidentalKeyWrapper = styled.div(
  css({
    position: 'relative',
    width: '0',
  }),
)

const AccidentalKeyStyles = styled.button(({ isPlaying, isCorrect }) =>
  css({
    position: 'absolute',
    transform: 'translateX(-50%)',
    cursor: 'pointer',
    backgroundColor: 'black',
    width: '36px',
    height: '120px',
    borderRadius: '0px 0px 3px 3px',
    border: '3px solid',
    borderColor: 'black',
    borderTop: 'none',
    boxSizing: 'border-box',
    padding: '5px',
    outline: 'none',
    color: isPlaying ? 'white' : '#dbdbdb',
    display: 'flex',
    justifyContent: 'center',
    ':after': {
      content: isPlaying && "''",
      position: 'absolute',
      display: 'block',
      width: '16px',
      height: '16px',
      backgroundColor: isCorrect ? 'success' : 'error',
      bottom: '16px',
      borderRadius: '50%',
    },
  }),
)

const NaturalKeyStyles = styled.button(({ isPlaying, isCorrect }) =>
  css({
    cursor: 'pointer',
    background: '#fafafa',
    width: '50px',
    height: '180px',
    margin: '0 2px',
    borderRadius: '0 0 3px 3px',
    border: 'none',
    padding: '10px',
    outline: 'none',
    boxSizing: 'border-box',
    color: 'black',
    display: 'flex',
    justifyContent: 'center',
    ':after': {
      content: isPlaying && "''",
      position: 'absolute',
      display: 'block',
      width: '16px',
      height: '16px',
      backgroundColor: isCorrect ? 'success' : 'error',
      bottom: '16px',
      borderRadius: '50%',
    },
    ':first-of-type': {
      marginLeft: '0',
    },
    ':last-of-type': {
      marginRight: '0',
    },
  }),
)

const KeyText = styled.div(
  css({
    pointerEvents: 'none',
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    fontSize: '1rem',
  }),
)

function PianoContainer({ children, ...rest }) {
  return (
    <PianoContainerStyles
      onMouseDown={event => event.preventDefault()}
      {...rest}
    >
      {children}
    </PianoContainerStyles>
  )
}

function AccidentalKey({ note, isPlaying, isCorrect, text, eventHandlers }) {
  return (
    <AccidentalKeyWrapper>
      <AccidentalKeyStyles
        aria-label={note}
        isPlaying={isPlaying}
        isCorrect={isCorrect}
        {...eventHandlers}
      >
        <KeyText>{text}</KeyText>
      </AccidentalKeyStyles>
    </AccidentalKeyWrapper>
  )
}

function NaturalKey({ note, isPlaying, isCorrect, text, eventHandlers }) {
  return (
    <NaturalKeyStyles
      aria-label={note}
      isPlaying={isPlaying}
      isCorrect={isCorrect}
      {...eventHandlers}
    >
      <KeyText>{text}</KeyText>
    </NaturalKeyStyles>
  )
}

const PianoKey = ({ registerNote, onPlayNote, onStopNote, currentChord }) => ({
  note,
  isNoteAccidental,
  isNotePlaying,
  startPlayingNote,
  stopPlayingNote,
  keyboardShortcuts,
}) => {
  const toggleNote = e => {
    e.preventDefault()
    if (isNotePlaying) {
      onStopNote(note.replace(/\d/, ''))
      stopPlayingNote()
    } else {
      onPlayNote(note.replace(/\d/, ''))
      startPlayingNote()
    }
  }

  function handleMouseEnter(event) {
    if (event.buttons) {
      toggleNote()
    }
  }

  registerNote(note, { play: startPlayingNote, stop: stopPlayingNote })

  const KeyComponent = isNoteAccidental ? AccidentalKey : NaturalKey
  const eventHandlers = {
    onMouseDown: toggleNote,
    onMouseEnter: handleMouseEnter,
  }

  const isCorrect = currentChord.notes.find(
    n =>
      simplify(n) === note.replace(/\d/, '') ||
      enharmonic(n) === note.replace(/\d/, ''),
  )

  return (
    <KeyComponent
      note={note}
      isCorrect={isCorrect}
      isPlaying={isNotePlaying}
      text={keyboardShortcuts.join(' / ')}
      eventHandlers={eventHandlers}
    />
  )
}

export const Piano = ({
  state,
  onPlayNote,
  onStopNote,
  currentChord,
  input,
  progress,
  ...rest
}) => {
  const notes = useRef({})

  useEffect(() => {
    state.actions.forEach(action => {
      if (action.type === 'resetPiano') {
        Object.entries(notes.current).forEach(([key, note]) => {
          note.stop()
        })
      }
    })
  }, [state])

  useEffect(() => {
    if (input) {
      input.addListener('noteon', 'all', function(e) {
        onPlayNote(e.note.name)

        const fullNote = e.note.name + e.note.octave
        const playedNote = notes.current[fullNote]
        if (playedNote) {
          playedNote.play()
        }
      })

      input.addListener('noteoff', 'all', function(e) {
        onStopNote(e.note.name)

        const fullNote = e.note.name + e.note.octave
        const playedNote = notes.current[fullNote]
        if (playedNote) {
          playedNote.stop()
        }
      })

      return () => {
        input.removeListener('noteon')
        input.removeListener('noteoff')
      }
    }
  }, [input, onPlayNote, onStopNote])

  const registerNote = (note, funcs) => {
    notes.current[note] = funcs
  }

  return (
    <PianoContainer progress={progress}>
      <PianoComponent
        renderPianoKey={PianoKey({
          state,
          currentChord,
          registerNote,
          onPlayNote,
          onStopNote,
        })}
        {...rest}
      />
    </PianoContainer>
  )
}

export default Piano
