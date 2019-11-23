import React from 'react'
import { Helmet } from 'react-helmet'
import { Link as GatsbyLink } from 'gatsby'

import { Link, Flex, Box, Text } from '@theme-ui/components'

const Credits = () => {
  return (
    <>
      <Helmet>
        <link
          rel="canonical"
          href="https://chord-trainer.netlify.com/credits"
        />
      </Helmet>
      <Flex
        bg="black"
        p={[3, 4]}
        sx={{
          minHeight: '100%',
          flexDirection: 'column',
          color: 'white',
        }}
      >
        <Text as="h1">Big thanks to the authors of these tools!</Text>
        <Flex sx={{ flexDirection: 'column', height: '100%', flex: 1 }} mt={3}>
          <Link variant="primary" target="blank" href="https://xstate.js.org/">
            Xstate
          </Link>
          <Link
            variant="primary"
            target="blank"
            href="https://github.com/lillydinhle/react-piano-component"
          >
            react-piano-component
          </Link>
          <Link
            variant="primary"
            target="blank"
            href="https://github.com/tonaljs/tonal"
          >
            Tonal
          </Link>
          <Link
            variant="primary"
            target="blank"
            href="https://github.com/gatsbyjs/gatsby"
          >
            Gatsby
          </Link>
          <Link
            variant="primary"
            target="blank"
            href="https://github.com/system-ui/theme-ui"
          >
            Theme-UI
          </Link>
          <Box mt="auto">
            <Link variant="primary" as={GatsbyLink} to="/">
              Back to the app
            </Link>
          </Box>
        </Flex>
      </Flex>
    </>
  )
}

export default Credits
