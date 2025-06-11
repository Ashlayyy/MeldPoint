/// <reference types="cypress" />

export {}; // Make this file a module

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      login(options?: { userType?: 'admin' | 'user' }): Chainable<void>;
    }
  }
}

type UserType = 'admin' | 'user';
type MockUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};

// Mock user data based on user type
const mockUsers: Record<UserType, MockUser> = {
  admin: {
    id: 'test-admin-id',
    email: 'admin@test.com',
    name: 'Test Admin',
    roles: ['admin'],
    permissions: ['read:all', 'write:all']
  },
  user: {
    id: 'test-user-id',
    email: 'user@test.com',
    name: 'Test User',
    roles: ['user'],
    permissions: ['read:own']
  }
};

// Custom command for login that bypasses Microsoft OAuth
Cypress.Commands.add('login', (options = { userType: 'user' as UserType }) => {
  const userType = options.userType || 'user';
  const mockUser = mockUsers[userType];

  // Set secure cookies that would normally be set by your auth callback
  cy.setCookie('connect.sid', 'test-session-id', {
    secure: true,
    httpOnly: true,
    sameSite: 'lax'
  });

  cy.intercept('GET', '/user/auth/microsoft*', (req) => {
    req.redirect(`/auth/callback`);
  }).as('microsoftAuth');

  // Intercept the callback endpoint
  cy.intercept('GET', '**/auth/callback*', (req) => {
    // Set any additional cookies your callback would set
    req.reply({
      statusCode: 302,
      headers: {
        'Set-Cookie': [
          'auth=test-auth-cookie; HttpOnly; Secure; SameSite=Lax',
          'user_id=' + mockUser.id + '; HttpOnly; Secure; SameSite=Lax'
        ],
        Location: '/'
      }
    });
  }).as('authCallback');

  // Intercept the current user API call
  cy.intercept('GET', `${Cypress.env('VITE_API_URL')}/user/auth/current`, {
    statusCode: 200,
    body: {
      data: mockUser
    }
  }).as('getCurrentUser');

  // Visit login page and click Microsoft login button
  cy.visit('/login');
  cy.get('[data-test="microsoft-login-button"]').click();

  // Wait for auth flow to complete
  cy.wait(['@microsoftAuth', '@authCallback', '@getCurrentUser']);

  // Verify we're logged in
  cy.url().should('not.include', '/login');
});

// Preserve cookies between tests
beforeEach(() => {
  cy.getCookies().then((cookies) => {
    cookies.forEach((cookie) => {
      cy.setCookie(cookie.name, cookie.value);
    });
  });
});

// Global error handling
Cypress.on('uncaught:exception', (err) => {
  console.error('Uncaught exception:', err);
  return false;
});
