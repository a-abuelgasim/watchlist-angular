import { defineConfig } from 'cypress'

export default defineConfig({

  e2e: {
    'baseUrl': 'http://localhost:4200',
    screenshotOnRunFailure: false,
    video: false,
  },


  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    screenshotOnRunFailure: false,
    video: false,
    specPattern: '**/*.cy.ts'
  }

})
