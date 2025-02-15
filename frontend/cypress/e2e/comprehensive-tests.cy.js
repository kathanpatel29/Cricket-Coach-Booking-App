describe('Comprehensive Application Tests', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Authentication & Authorization', () => {
    it('validates registration form fields', () => {
      cy.get('[data-cy=register-link]').click()
      cy.get('[data-cy=register-button]').click()
      cy.get('[data-cy=name-error]').should('be.visible')
      cy.get('[data-cy=email-error]').should('be.visible')
      cy.get('[data-cy=password-error]').should('be.visible')
    })

    it('shows password strength indicator', () => {
      cy.get('[data-cy=register-link]').click()
      cy.get('[data-cy=password-input]').type('weak')
      cy.get('[data-cy=password-strength]').should('contain', 'Weak')
      cy.get('[data-cy=password-input]').clear().type('StrongPass123!')
      cy.get('[data-cy=password-strength]').should('contain', 'Strong')
    })

    it('handles invalid login attempts', () => {
      cy.get('[data-cy=login-link]').click()
      cy.get('[data-cy=login-button]').click()
      cy.get('[data-cy=login-error]').should('be.visible')
    })
  })

  describe('Booking System', () => {
    beforeEach(() => {
      cy.login('client@test.com', 'Test@123')
    })

    it('validates booking form fields', () => {
      cy.get('[data-cy=coaches-link]').click()
      cy.get('[data-cy=coach-card]').first().click()
      cy.get('[data-cy=book-button]').click()
      cy.get('[data-cy=confirm-booking]').click()
      cy.get('[data-cy=date-error]').should('be.visible')
      cy.get('[data-cy=time-error]').should('be.visible')
    })

    it('shows unavailable time slots', () => {
      cy.get('[data-cy=coaches-link]').click()
      cy.get('[data-cy=coach-card]').first().click()
      cy.get('[data-cy=book-button]').click()
      cy.get('[data-cy=date-picker]').click()
      cy.get('.react-calendar__tile--active').click()
      cy.get('[data-cy=time-slot].disabled').should('exist')
    })

    it('completes payment process', () => {
      cy.createBooking('coachId', '2024-03-20', '10:00')
      cy.get('[data-cy=stripe-card]').within(() => {
        cy.fillStripeElements({
          cardNumber: '4242424242424242',
          cardExpiry: '12/25',
          cardCvc: '123'
        })
      })
      cy.get('[data-cy=pay-button]').click()
      cy.get('[data-cy=payment-success]', { timeout: 10000 }).should('be.visible')
    })
  })

  describe('Coach Management', () => {
    beforeEach(() => {
      cy.login('coach@test.com', 'Test@123')
    })

    it('validates coach profile updates', () => {
      cy.get('[data-cy=profile-link]').click()
      cy.get('[data-cy=edit-profile]').click()
      cy.get('[data-cy=save-profile]').click()
      cy.get('[data-cy=bio-error]').should('be.visible')
      cy.get('[data-cy=rate-error]').should('be.visible')
    })

    it('manages availability slots', () => {
      cy.get('[data-cy=availability-link]').click()
      // Add slot
      cy.get('[data-cy=add-slot]').click()
      cy.get('[data-cy=slot-date]').type('2024-03-20')
      cy.get('[data-cy=slot-time]').select('10:00')
      cy.get('[data-cy=save-slots]').click()
      // Delete slot
      cy.get('[data-cy=delete-slot]').first().click()
      cy.get('[data-cy=confirm-delete]').click()
      cy.get('[data-cy=success-message]').should('be.visible')
    })

    it('views and responds to bookings', () => {
      cy.get('[data-cy=bookings-link]').click()
      cy.get('[data-cy=booking-card]').first().within(() => {
        cy.get('[data-cy=accept-booking]').click()
      })
      cy.get('[data-cy=success-message]').should('be.visible')
    })
  })

  describe('Admin Features', () => {
    beforeEach(() => {
      cy.login('admin@test.com', 'Test@123')
    })

    it('manages coach approval process', () => {
      cy.get('[data-cy=coaches-link]').click()
      cy.get('[data-cy=pending-coaches]').click()
      cy.get('[data-cy=coach-card]').first().within(() => {
        cy.get('[data-cy=view-details]').click()
        cy.get('[data-cy=approve-button]').click()
      })
      cy.get('[data-cy=success-message]').should('be.visible')
    })

    it('generates and downloads reports', () => {
      cy.get('[data-cy=reports-link]').click()
      // Booking report
      cy.get('[data-cy=booking-report]').click()
      cy.get('[data-cy=date-range]').click()
      cy.get('[data-cy=download-report]').click()
      cy.readFile('cypress/downloads/booking-report.csv').should('exist')
      // Revenue report
      cy.get('[data-cy=revenue-report]').click()
      cy.get('[data-cy=download-report]').click()
      cy.readFile('cypress/downloads/revenue-report.csv').should('exist')
    })
  })

  describe('Responsive Design', () => {
    const sizes = ['iphone-6', 'ipad-2', [1024, 768]]
    
    sizes.forEach(size => {
      it(`displays correctly on ${size}`, () => {
        if (Cypress._.isArray(size)) {
          cy.viewport(size[0], size[1])
        } else {
          cy.viewport(size)
        }
        
        cy.visit('/')
        cy.get('[data-cy=nav-menu]').should('be.visible')
        cy.get('[data-cy=mobile-menu]').should('exist')
        
        // Test navigation
        if (size === 'iphone-6') {
          cy.get('[data-cy=mobile-menu-button]').click()
        }
        cy.get('[data-cy=nav-links]').should('be.visible')
      })
    })
  })

  describe('Internationalization', () => {
    it('switches between languages', () => {
      // English
      cy.get('[data-cy=language-selector]').click()
      cy.get('[data-cy=lang-en]').click()
      cy.get('[data-cy=welcome-text]').should('contain', 'Welcome')
      
      // Hindi
      cy.get('[data-cy=language-selector]').click()
      cy.get('[data-cy=lang-hi]').click()
      cy.get('[data-cy=welcome-text]').should('contain', 'स्वागत है')
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      cy.intercept('GET', '/api/coaches', {
        forceNetworkError: true
      })
      cy.visit('/coaches')
      cy.get('[data-cy=error-message]').should('be.visible')
      cy.get('[data-cy=retry-button]').should('be.visible')
    })

    it('handles API errors with proper messages', () => {
      cy.intercept('POST', '/api/bookings', {
        statusCode: 400,
        body: {
          message: 'Selected time slot is not available'
        }
      })
      cy.createBooking('coachId', '2024-03-20', '10:00')
      cy.get('[data-cy=error-message]')
        .should('be.visible')
        .and('contain', 'Selected time slot is not available')
    })
  })

  describe('Loading States', () => {
    it('shows loading indicators', () => {
      cy.intercept('GET', '/api/coaches', (req) => {
        req.delay(1000)
        req.reply([])
      })
      cy.visit('/coaches')
      cy.get('[data-cy=loading-spinner]').should('be.visible')
      cy.get('[data-cy=loading-spinner]').should('not.exist')
    })
  })
}) 