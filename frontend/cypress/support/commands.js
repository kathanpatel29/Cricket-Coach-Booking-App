// Custom command for login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-cy=email-input]').type(email)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=login-button]').click()
  cy.url().should('include', '/dashboard')
})

// Custom command for coach registration
Cypress.Commands.add('registerCoach', (name, email, password) => {
  cy.visit('/register')
  cy.get('[data-cy=name-input]').type(name)
  cy.get('[data-cy=email-input]').type(email)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=role-select]').select('coach')
  cy.get('[data-cy=register-button]').click()
})

// Custom command for client registration
Cypress.Commands.add('registerClient', (name, email, password) => {
  cy.visit('/register')
  cy.get('[data-cy=name-input]').type(name)
  cy.get('[data-cy=email-input]').type(email)
  cy.get('[data-cy=password-input]').type(password)
  cy.get('[data-cy=role-select]').select('client')
  cy.get('[data-cy=register-button]').click()
})

// Custom command for booking creation
Cypress.Commands.add('createBooking', (coachId, date, timeSlot) => {
  cy.visit(`/coaches/${coachId}`)
  cy.get('[data-cy=book-button]').click()
  cy.get('[data-cy=date-picker]').click()
  cy.get(`[data-date="${date}"]`).click()
  cy.get(`[data-time="${timeSlot}"]`).click()
  cy.get('[data-cy=confirm-booking]').click()
}) 