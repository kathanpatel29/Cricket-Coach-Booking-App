describe('Cricket Coach Booking App', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('allows user registration and login', () => {
    // Registration
    cy.get('[data-cy=register-link]').click()
    cy.get('[data-cy=name-input]').type('Test User')
    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('Test@123')
    cy.get('[data-cy=register-button]').click()
    cy.url().should('include', '/login')

    // Login
    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('Test@123')
    cy.get('[data-cy=login-button]').click()
    cy.url().should('include', '/dashboard')
  })

  it('allows booking a coach', () => {
    // Login first
    cy.login('client@test.com', 'Test@123')

    // Book a coach
    cy.get('[data-cy=coaches-link]').click()
    cy.get('[data-cy=coach-card]').first().click()
    cy.get('[data-cy=book-button]').click()
    cy.get('[data-cy=date-picker]').click()
    cy.get('.react-calendar__tile--active').click()
    cy.get('[data-cy=time-slot]').first().click()
    cy.get('[data-cy=confirm-booking]').click()
    cy.get('[data-cy=success-message]').should('be.visible')
  })

  it('allows coach profile management', () => {
    // Login as coach
    cy.login('coach@test.com', 'Test@123')

    // Update profile
    cy.get('[data-cy=profile-link]').click()
    cy.get('[data-cy=edit-profile]').click()
    cy.get('[data-cy=bio-input]').clear().type('Updated bio')
    cy.get('[data-cy=hourly-rate]').clear().type('75')
    cy.get('[data-cy=save-profile]').click()
    cy.get('[data-cy=success-message]').should('be.visible')

    // Set availability
    cy.get('[data-cy=availability-link]').click()
    cy.get('[data-cy=add-slot]').click()
    cy.get('[data-cy=slot-time]').select('10:00')
    cy.get('[data-cy=save-slots]').click()
    cy.get('[data-cy=success-message]').should('be.visible')
  })

  it('allows admin functions', () => {
    // Login as admin
    cy.login('admin@test.com', 'Test@123')

    // View users
    cy.get('[data-cy=users-link]').click()
    cy.get('[data-cy=users-table]').should('be.visible')

    // Approve coach
    cy.get('[data-cy=coaches-link]').click()
    cy.get('[data-cy=approve-button]').first().click()
    cy.get('[data-cy=success-message]').should('be.visible')

    // View reports
    cy.get('[data-cy=reports-link]').click()
    cy.get('[data-cy=booking-report]').should('be.visible')
  })
}) 