describe('Backup Page', () => {
  beforeEach(() => {
    cy.login({ userType: 'admin' });
    cy.visit('/admin/backup');
  });

  it('should display backup page', () => {
    cy.get('h1').should('contain', 'Backup');
  });

  it('should create backup', () => {
    cy.get('[data-test="create-backup-btn"]').click();
    cy.get('[data-test="backup-success"]').should('be.visible');
  });

  it('should list backups', () => {
    cy.get('[data-test="backup-list"]').should('exist').and('be.visible');
  });

  it('should restore backup', () => {
    cy.get('[data-test="restore-backup-btn"]').first().click();
    cy.get('[data-test="confirm-restore"]').click();
    cy.get('[data-test="restore-success"]').should('be.visible');
  });
});
