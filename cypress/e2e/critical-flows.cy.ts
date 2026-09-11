function login() {
  cy.visit('/');
  cy.get('[data-testid="auth-email"]').type('e2e@consultorio.test');
  cy.get('[data-testid="auth-password"]').type('admin123');
  cy.get('[data-testid="auth-submit"]').click();
  cy.get('[data-testid="auth-email"]').should('not.exist');
}

describe('Flujos críticos (Cypress)', () => {
  it('navega el calendario: mes, lista y hoy', () => {
    login();
    cy.get('#tab-calendar-main').click();
    cy.contains('HOY').should('be.visible');
    cy.get('[data-testid="calendar-view-list"]').click();
    cy.contains('Lista Cronológica de Turnos').should('be.visible');
    cy.get('[data-testid="calendar-view-month"]').click();
    cy.get('[data-testid="calendar-today"]').click();
    cy.contains('HOY').should('be.visible');
  });

  it('abre finanzas', () => {
    login();
    cy.get('#btn-open-finances').click();
    cy.contains('Finanzas y Liquidación de Honorarios').should('be.visible');
  });
});
