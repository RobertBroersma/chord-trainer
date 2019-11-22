module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-prefetch-google-fonts`,
      options: {
        fonts: [
          {
            family: `Poppins`,
            variants: ['400', '700'],
          },
          {
            family: `Open Sans`,
            variants: [`400`, `700`],
          },
        ],
      },
    },
  ],
}
