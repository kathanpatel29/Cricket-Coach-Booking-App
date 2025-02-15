describe('Cricket Coach Booking App - Main Flows', () => {
  beforeEach(() => {
    cy.visit('/');
    // Clear cookies and local storage between tests
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Authentication Flow', () => {
    it('allows user registration and login as client', () => {
      const email = `test-${Date.now()}@example.com`;
      
      // Register as client
      cy.get('[data-cy=register-link]').click();
      cy.url().should('include', '/register');
      
      cy.get('[data-cy=name-input]').type('Test Client');
      cy.get('[data-cy=email-input]').type(email);
      cy.get('[data-cy=password-input]').type('Password123!');
      cy.get('[data-cy=confirm-password-input]').type('Password123!');
      cy.get('[data-cy=role-select]').select('client');
      cy.get('[data-cy=register-submit]').click();

      // Verify registration success
      cy.url().should('include', '/login');
      
      // Login
      cy.get('[data-cy=email-input]').type(email);
      cy.get('[data-cy=password-input]').type('Password123!');
      cy.get('[data-cy=login-submit]').click();

      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-cy=user-menu]').should('contain', 'Test Client');
    });

    it('handles invalid login attempts', () => {
      cy.visit('/login');
      cy.get('[data-cy=email-input]').type('invalid@example.com');
      cy.get('[data-cy=password-input]').type('wrongpassword');
      cy.get('[data-cy=login-submit]').click();

      cy.get('[data-cy=error-message]')
        .should('be.visible')
        .and('contain', 'Invalid credentials');
    });
  });

  describe('Coach Registration and Profile', () => {
    it('completes coach registration and profile setup', () => {
      const email = `coach-${Date.now()}@example.com`;
      
      // Register as coach
      cy.get('[data-cy=register-link]').click();
      cy.get('[data-cy=name-input]').type('Test Coach');
      cy.get('[data-cy=email-input]').type(email);
      cy.get('[data-cy=password-input]').type('Password123!');
      cy.get('[data-cy=confirm-password-input]').type('Password123!');
      cy.get('[data-cy=role-select]').select('coach');
      cy.get('[data-cy=register-submit]').click();

      // Login
      cy.get('[data-cy=email-input]').type(email);
      cy.get('[data-cy=password-input]').type('Password123!');
      cy.get('[data-cy=login-submit]').click();

      // Complete profile
      cy.url().should('include', '/coach/profile');
      cy.get('[data-cy=bio-input]').type('Experienced cricket coach with 10 years of expertise');
      cy.get('[data-cy=specialization-input]').type('Batting technique');
      cy.get('[data-cy=experience-input]').type('10');
      cy.get('[data-cy=hourly-rate-input]').type('50');
      cy.get('[data-cy=profile-submit]').click();

      // Set availability
      cy.get('[data-cy=availability-tab]').click();
      cy.get('[data-cy=monday-toggle]').click();
      cy.get('[data-cy=monday-start]').type('09:00');
      cy.get('[data-cy=monday-end]').type('17:00');
      cy.get('[data-cy=availability-submit]').click();

      // Verify profile completion
      cy.get('[data-cy=success-message]').should('be.visible');
      cy.get('[data-cy=profile-status]').should('contain', 'Complete');
    });
  });

  describe('Booking Flow', () => {
    beforeEach(() => {
      // Login as client
      cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
        email: 'client@example.com',
        password: 'Password123!'
      }).then((response) => {
        localStorage.setItem('token', response.body.token);
      });
    });

    it('completes a booking with a coach', () => {
      // Search for coaches
      cy.visit('/coaches');
      cy.get('[data-cy=search-input]').type('batting');
      cy.get('[data-cy=search-submit]').click();

      // Select a coach
      cy.get('[data-cy=coach-card]').first().click();
      
      // View coach profile and book
      cy.get('[data-cy=book-session-btn]').click();
      
      // Select date and time
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      cy.get('[data-cy=date-picker]').type(futureDate.toISOString().split('T')[0]);
      cy.get('[data-cy=time-slot-select]').select('14:00');
      cy.get('[data-cy=duration-select]').select('1');
      cy.get('[data-cy=booking-submit]').click();

      // Complete payment
      cy.get('[data-cy=card-number]').type('4242424242424242');
      cy.get('[data-cy=card-expiry]').type('1230');
      cy.get('[data-cy=card-cvc]').type('123');
      cy.get('[data-cy=payment-submit]').click();

      // Verify booking confirmation
      cy.url().should('include', '/booking/success');
      cy.get('[data-cy=booking-confirmation]').should('be.visible');
    });

    it('handles booking conflicts', () => {
      cy.visit('/coaches');
      cy.get('[data-cy=coach-card]').first().click();
      cy.get('[data-cy=book-session-btn]').click();

      // Try to book an unavailable slot
      cy.get('[data-cy=date-picker]').type('2024-01-01');
      cy.get('[data-cy=time-slot-select]').select('10:00');
      cy.get('[data-cy=duration-select]').select('1');
      cy.get('[data-cy=booking-submit]').click();

      cy.get('[data-cy=error-message]')
        .should('be.visible')
        .and('contain', 'not available');
    });
  });

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      // Login as admin
      cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
        email: 'admin@example.com',
        password: 'AdminPass123!'
      }).then((response) => {
        localStorage.setItem('token', response.body.token);
      });
    });

    it('manages coach approvals', () => {
      cy.visit('/admin/coaches');
      
      // View pending coaches
      cy.get('[data-cy=pending-coaches-tab]').click();
      cy.get('[data-cy=coach-approval-card]').first().as('pendingCoach');
      
      // View coach details
      cy.get('@pendingCoach').find('[data-cy=view-details]').click();
      cy.get('[data-cy=coach-profile-modal]').should('be.visible');
      
      // Approve coach
      cy.get('[data-cy=approve-coach]').click();
      cy.get('[data-cy=success-message]').should('be.visible');
      
      // Verify coach appears in approved list
      cy.get('[data-cy=approved-coaches-tab]').click();
      cy.get('[data-cy=coach-list]')
        .should('contain', cy.get('@pendingCoach').find('[data-cy=coach-name]').text());
    });

    it('views and manages bookings', () => {
      cy.visit('/admin/bookings');
      
      // Filter bookings
      cy.get('[data-cy=date-range-start]').type('2024-01-01');
      cy.get('[data-cy=date-range-end]').type('2024-12-31');
      cy.get('[data-cy=filter-submit]').click();

      // View booking details
      cy.get('[data-cy=booking-row]').first().click();
      cy.get('[data-cy=booking-details-modal]').should('be.visible');
      
      // Export bookings report
      cy.get('[data-cy=export-report]').click();
      cy.get('[data-cy=download-link]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    const sizes = ['iphone-6', 'ipad-2', [1024, 768]];
    
    sizes.forEach(size => {
      it(`displays correctly on ${size}`, () => {
        if (Cypress._.isArray(size)) {
          cy.viewport(size[0], size[1]);
        } else {
          cy.viewport(size);
        }

        // Test navigation menu
        cy.visit('/');
        cy.get('[data-cy=nav-menu]').should('be.visible');
        if (size === 'iphone-6') {
          cy.get('[data-cy=mobile-menu-button]').should('be.visible').click();
        }

        // Test coach cards layout
        cy.visit('/coaches');
        cy.get('[data-cy=coach-card]').should('be.visible');

        // Test booking form layout
        cy.visit('/booking/new');
        cy.get('[data-cy=booking-form]').should('be.visible');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', () => {
      // Simulate offline state
      cy.intercept('GET', `${Cypress.env('apiUrl')}/*`, (req) => {
        req.destroy();
      });

      cy.visit('/coaches');
      cy.get('[data-cy=error-message]')
        .should('be.visible')
        .and('contain', 'network error');
    });

    it('handles API errors with appropriate messages', () => {
      cy.intercept('POST', `${Cypress.env('apiUrl')}/bookings`, {
        statusCode: 500,
        body: {
          message: 'Internal server error'
        }
      });

      // Attempt to create booking
      cy.visit('/booking/new');
      cy.get('[data-cy=booking-form]').submit();

      cy.get('[data-cy=error-message]')
        .should('be.visible')
        .and('contain', 'server error');
    });
  });

  describe('Performance', () => {
    it('loads and renders quickly', () => {
      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.performance.mark('start-load');
        },
      });

      cy.window().then((win) => {
        win.performance.mark('end-load');
        win.performance.measure('page-load', 'start-load', 'end-load');
        const measure = win.performance.getEntriesByName('page-load')[0];
        expect(measure.duration).to.be.lessThan(3000); // 3 seconds
      });
    });
  });
}); 