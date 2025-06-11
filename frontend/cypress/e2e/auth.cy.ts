describe('Authentication', () => {
  beforeEach(() => {
    // Reset any previous login state
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should login as regular user with Microsoft OAuth', () => {
    cy.login(); // Uses default user type

    // Verify we're logged in
    cy.url().should('not.include', '/login');

    // Verify auth cookies are set
    cy.getCookie('connect.sid').should('exist');
    cy.getCookie('jwt').should('exist');
  });

  it('should login as admin with Microsoft OAuth', () => {
    cy.login({ userType: 'admin' });
    cy.url().should('not.include', '/login');
    cy.getCookie('connect.sid').should('exist');
    cy.getCookie('jwt').should('exist');
  });

  it('should handle failed login attempts', () => {
    // Intercept the auth call and simulate a failure
    cy.intercept('GET', '/user/auth/microsoft*', {
      statusCode: 401,
      body: {
        error: 'microsoft_auth_failed',
        error_description: 'Authentication failed',
        trace_id: 'test-trace-id'
      }
    }).as('authFailed');

    cy.visit('/login');
    cy.get('[data-test="microsoft-login-button"]').click();

    // Verify error handling
    cy.wait('@authFailed');
    cy.get('[data-test="auth-error"]').should('be.visible');
    cy.get('[data-test="auth-error"]').should('contain.text', 'Microsoft authentication failed');

    // Verify no auth cookies are set
    cy.getCookie('session').should('not.exist');
    cy.getCookie('auth').should('not.exist');
    cy.getCookie('user_id').should('not.exist');
  });

  it('should handle session expiration', () => {
    cy.login();

    cy.getCookie('connect.sid').should('exist');
    cy.getCookie('jwt').should('exist');

    cy.visit('/beheer/gebruikers');

    cy.url().should('include', '/login');
  });
});
