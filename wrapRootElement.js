import React from 'react'
import { Global } from '@emotion/core'
import { ThemeProvider } from 'theme-ui'
import { Helmet } from 'react-helmet'
import theme from './src/theme'

export const wrapRootElement = ({ element }) => (
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
    <Helmet>
      <meta charSet="utf-8" />
      <html lang="en" />
      <title>Piano Chord Trainer</title>
      <meta
        name="description"
        content="Practice chords by playing them on a real or virtual piano."
      />
      <link rel="canonical" href="https://chord-trainer.netlify.com/" />
    </Helmet>
    {element}
  </ThemeProvider>
)
